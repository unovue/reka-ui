import type { Ref } from 'vue'
import { computed, ref } from 'vue'

export type FieldValidationMode = 'onSubmit' | 'onBlur' | 'onChange'

export type FieldValidateResult = string | string[] | null | undefined | void

export type FieldValidateFn = (value: unknown) => FieldValidateResult | Promise<FieldValidateResult>

export interface UseFieldValidationOptions {
  validate?: Ref<FieldValidateFn | undefined>
  validationMode: Ref<FieldValidationMode>
  validationDebounceMs: Ref<number | undefined>
}

function normalizeErrors(result: FieldValidateResult): string[] {
  if (!result)
    return []
  return Array.isArray(result) ? result.filter(Boolean) : [result]
}

function snapshotValidityState(validity: ValidityState): ValidityState {
  return {
    badInput: validity.badInput,
    customError: validity.customError,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valid: validity.valid,
    valueMissing: validity.valueMissing,
  }
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

  async function runCustomValidate(value: unknown) {
    const validateFn = options.validate?.value
    if (!validateFn)
      return

    const currentToken = ++token
    const result = await validateFn(value)
    // A newer validation call superseded this one; drop the stale result.
    if (currentToken !== token)
      return

    customErrors.value = normalizeErrors(result)
  }

  /**
   * Runs validation for the given value.
   * @param value The current control value to validate.
   * @param immediate Skip the configured debounce (used for blur/submit).
   */
  async function triggerValidation(value: unknown, immediate = false) {
    clearDebounce()

    const debounceMs = options.validationDebounceMs.value
    if (!immediate && debounceMs) {
      await new Promise<void>((resolve) => {
        debounceTimer = setTimeout(resolve, debounceMs)
      })
    }

    await runCustomValidate(value)
    hasValidated.value = true
  }

  function setNativeValidity(nextValidity: ValidityState | undefined) {
    // `element.validity` is a *live* object — the browser (and jsdom) mutate
    // it in place and hand back the same reference on every access. Assigning
    // that reference straight to a ref would make Vue's `Object.is` change
    // check see no change (and skip reactivity) even when the underlying
    // constraint state flipped. Snapshot it into a fresh plain object instead.
    validity.value = nextValidity ? snapshotValidityState(nextValidity) : undefined
    hasValidated.value = true
  }

  function reset() {
    clearDebounce()
    token++
    customErrors.value = []
    validity.value = undefined
    hasValidated.value = false
  }

  const nativeInvalid = computed(() => (validity.value ? !validity.value.valid : false))
  const customInvalid = computed(() => customErrors.value.length > 0)
  const invalid = computed(() => nativeInvalid.value || customInvalid.value)

  return {
    customErrors,
    validity,
    hasValidated,
    invalid,
    triggerValidation,
    setNativeValidity,
    reset,
  }
}
