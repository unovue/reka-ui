import type { Ref } from 'vue'
import { computed, onScopeDispose, ref } from 'vue'

export type FieldValidationMode = 'onSubmit' | 'onBlur' | 'onChange'

export type FieldValidateResult = string | string[] | null | undefined | void

export type FieldValidateFn = (value: unknown, formValues: Record<string, unknown>) => FieldValidateResult | Promise<FieldValidateResult>

export interface UseFieldValidationOptions {
  validate?: Ref<FieldValidateFn | undefined>
  validationMode: Ref<FieldValidationMode>
  validationDebounceTime: Ref<number | undefined>
  getFormValues: () => Record<string, unknown>
}

const VALIDITY_KEYS = [
  'badInput',
  'customError',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valueMissing',
] as const

/**
 * Builds a plain `ValidityState` from the given failing constraints. Used for
 * non-native controls (e.g. `Select`, `Checkbox`), which have no `ValidityState`
 * of their own, and to snapshot a native element's live one.
 */
export function createValidityState(flags: Partial<Record<typeof VALIDITY_KEYS[number], boolean>> = {}): ValidityState {
  const state = Object.fromEntries(VALIDITY_KEYS.map(key => [key, Boolean(flags[key])])) as Record<typeof VALIDITY_KEYS[number], boolean>
  return { ...state, valid: VALIDITY_KEYS.every(key => !state[key]) }
}

function normalizeErrors(result: FieldValidateResult): string[] {
  if (!result)
    return []
  return Array.isArray(result) ? result.filter(Boolean) : [result]
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return typeof value === 'object' && value !== null && typeof (value as PromiseLike<T>).then === 'function'
}

/**
 * Encapsulates the Field validation engine: custom sync/async `validate()`
 * plus native `ValidityState` tracking. Timing (when validation actually
 * runs) is controlled by the caller (`FieldRoot`) based on `validationMode` —
 * this composable only executes/debounces the check and stores the result.
 */
export function useFieldValidation(options: UseFieldValidationOptions) {
  const customErrors = ref<string[]>([])
  const validity = ref<ValidityState>()
  const hasValidated = ref(false)
  // `true` while an async `validate()` is in flight. The field is neither
  // valid nor invalid until it settles, unless an earlier custom error is kept.
  const pending = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  // Guards against out-of-order async `validate()` resolutions clobbering a
  // newer result (e.g. fast typing with a slow network-backed validator).
  let token = 0

  function clearDebounce() {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
  }

  function runCustomValidate(value: unknown) {
    const validateFn = options.validate?.value
    const currentToken = ++token
    pending.value = false
    hasValidated.value = true

    if (!validateFn) {
      customErrors.value = []
      return
    }

    let result: FieldValidateResult | PromiseLike<FieldValidateResult>
    try {
      result = validateFn(value, options.getFormValues())
    }
    catch (error) {
      // A throwing `validate` is a bug in the validator, not a field error —
      // conflating the two would hide it behind a generic "invalid" state.
      console.error(error)
      return
    }

    if (!isPromiseLike<FieldValidateResult>(result)) {
      customErrors.value = normalizeErrors(result)
      return
    }

    // Async validators don't block an `onSubmit` submission (matching Base UI):
    // the field goes neutral while pending. In the other modes a previous
    // custom error is kept, so it still blocks submission until it resolves.
    pending.value = true
    if (options.validationMode.value === 'onSubmit')
      customErrors.value = []

    result.then(
      (resolved) => {
        if (currentToken !== token)
          return
        pending.value = false
        customErrors.value = normalizeErrors(resolved)
      },
      (error) => {
        // A rejecting validator keeps the previously published state.
        console.error(error)
        if (currentToken === token)
          pending.value = false
      },
    )
  }

  /**
   * Runs validation for the given value.
   * @param value The current control value to validate.
   * @param immediate Skip the configured debounce (used for blur/submit).
   */
  function triggerValidation(value: unknown, immediate = false) {
    clearDebounce()

    const debounceTime = options.validationDebounceTime.value
    if (!immediate && debounceTime && value !== '') {
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined
        runCustomValidate(value)
      }, debounceTime)
      return
    }

    runCustomValidate(value)
  }

  function setNativeValidity(nextValidity: ValidityState | undefined) {
    // `element.validity` is a *live* object — the browser (and jsdom) mutate
    // it in place and hand back the same reference on every access. Assigning
    // that reference straight to a ref would make Vue's `Object.is` change
    // check see no change (and skip reactivity) even when the underlying
    // constraint state flipped. Snapshot it into a fresh plain object instead.
    validity.value = nextValidity ? createValidityState(nextValidity) : undefined
    hasValidated.value = true
  }

  function reset() {
    clearDebounce()
    token++
    customErrors.value = []
    validity.value = undefined
    hasValidated.value = false
    pending.value = false
  }

  // A pending debounce timer must not outlive the component that created it —
  // otherwise an unmounted field's `validate` could still fire later,
  // touching refs whose effects have already been torn down. Bumping `token`
  // also makes any validation promise already in flight a no-op once it resolves.
  onScopeDispose(() => {
    clearDebounce()
    token++
  })

  const nativeInvalid = computed(() => (validity.value ? !validity.value.valid : false))
  const customInvalid = computed(() => customErrors.value.length > 0)
  const invalid = computed(() => nativeInvalid.value || customInvalid.value)

  return {
    customErrors,
    validity,
    hasValidated,
    pending,
    invalid,
    triggerValidation,
    setNativeValidity,
    reset,
  }
}
