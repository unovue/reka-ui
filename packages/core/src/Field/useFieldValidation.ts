import type { Ref } from 'vue'
import { onScopeDispose, ref } from 'vue'

export type FieldValidationMode = 'onSubmit' | 'onBlur' | 'onChange'

export type FieldValidateResult = string | string[] | null | undefined | void

export type FieldValidateFn = (value: unknown, formValues: Record<string, unknown>) => FieldValidateResult | Promise<FieldValidateResult>

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

type ValidityKey = typeof VALIDITY_KEYS[number]

/**
 * A field's constraint-validation state. Mirrors the native `ValidityState`,
 * except `valid` is `null` until the field has a validity to report.
 */
export type FieldValidityState = Record<ValidityKey, boolean> & { valid: boolean | null }

export const DEFAULT_VALIDITY_STATE: FieldValidityState = {
  ...Object.fromEntries(VALIDITY_KEYS.map(key => [key, false])) as Record<ValidityKey, boolean>,
  valid: null,
}

/**
 * Builds a `ValidityState` from the given failing constraints. Used for
 * non-native controls (e.g. `Select`, `Checkbox`), which have no
 * `ValidityState` of their own, and to snapshot a native element's live one.
 */
export function createValidityState(flags: Partial<Record<ValidityKey, boolean>> = {}): ValidityState {
  const state = Object.fromEntries(VALIDITY_KEYS.map(key => [key, Boolean(flags[key])])) as Record<ValidityKey, boolean>
  return { ...state, valid: VALIDITY_KEYS.every(key => !state[key]) }
}

type NativeControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** Where the field's constraint-validation state comes from. */
export interface FieldValiditySource {
  /** A native element whose live `ValidityState` is read (and which receives custom errors). */
  element?: NativeControl
  /** Derives the state of a control that has no native element. */
  getValidity?: (value: unknown) => ValidityState
}

export interface UseFieldValidationOptions {
  validate: Ref<FieldValidateFn | undefined>
  validationMode: Ref<FieldValidationMode>
  validationDebounceTime: Ref<number | undefined>
  getFormValues: () => Record<string, unknown>
  /** Whether validation on change currently applies (`onChange`, or `onSubmit` after a submit). */
  shouldValidateOnChange: () => boolean
  /**
   * Whether the user has changed the value (or a submit/`validate()` forced
   * validation). Until then, a `valueMissing`-only failure is suppressed to
   * reduce error noise.
   */
  markedDirty: Ref<boolean>
}

function normalizeErrors(result: FieldValidateResult): string[] {
  if (!result)
    return []
  return (Array.isArray(result) ? result : [result]).filter(Boolean)
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return typeof value === 'object' && value !== null && typeof (value as PromiseLike<T>).then === 'function'
}

function getNativeErrors(element: NativeControl | undefined) {
  return element?.validationMessage ? [element.validationMessage] : []
}

/**
 * The Field validation engine, modeled on Base UI's: native constraint
 * validation plus a custom sync/async `validate()`. Custom errors are
 * installed on the native element with `setCustomValidity`, so `:invalid`
 * and `validationMessage` agree with the field. Timing (when `commit`/
 * `change` run) is decided by the caller based on `validationMode`.
 */
export function useFieldValidation(options: UseFieldValidationOptions) {
  const validity = ref<FieldValidityState>({ ...DEFAULT_VALIDITY_STATE })
  /** Native messages or custom `validate` messages, only while invalid. */
  const errors = ref<string[]>([])
  /** The value validity was last computed for. */
  const value = ref<unknown>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  // Guards against out-of-order async `validate()` resolutions clobbering a
  // newer result (e.g. fast typing with a slow network-backed validator).
  let commitId = 0
  // The custom message Base UI-style validation installed, and the one it displaced.
  let installedCustomValidity: [element: NativeControl, message: string, displaced: string] | undefined

  function clearDebounce() {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
  }

  function setCustomValidity(element: NativeControl, message: string) {
    // Never reinstall a native constraint message as custom validity.
    const displaced = element.validity.customError ? element.validationMessage : ''
    element.setCustomValidity(message)
    installedCustomValidity = [element, message, displaced]
  }

  function clearCustomValidity() {
    const record = installedCustomValidity
    installedCustomValidity = undefined
    // Only restore when our message is still the one installed.
    if (record && (!record[0].willValidate || record[0].validationMessage === record[1]))
      record[0].setCustomValidity(record[2])
  }

  function readState(source: FieldValiditySource, currentValue: unknown): FieldValidityState {
    const { element, getValidity } = source
    let live: ValidityState | undefined
    if (element)
      live = element.willValidate ? element.validity : undefined
    else if (getValidity)
      live = getValidity(currentValue)

    // Barred controls (disabled, `type="button"`, …) have no usable state.
    if (!live)
      return { ...createValidityState() }

    const state: FieldValidityState = { ...createValidityState(live), valid: live.valid }

    // Only let `valueMissing` mark the field invalid once the value has been
    // changed (or validation was forced), to reduce error noise.
    const onlyValueMissing = state.valueMissing
      && VALIDITY_KEYS.every(key => key === 'valueMissing' || !state[key])
    if (onlyValueMissing && !options.markedDirty.value) {
      state.valueMissing = false
      state.valid = true
    }
    return state
  }

  function publish(state: FieldValidityState, messages: string[], committedValue: unknown) {
    validity.value = state
    errors.value = state.valid === false ? messages : []
    value.value = committedValue
  }

  /**
   * Validates the value now: native constraints first, then the custom
   * `validate` (which also runs despite native failures when validating on
   * change, so its messages can replace the native ones).
   */
  function commit(currentValue: unknown, source: FieldValiditySource) {
    clearDebounce()
    const id = ++commitId

    // Don't read our own previous message back as a native constraint.
    clearCustomValidity()

    let state = readState(source, currentValue)
    const nativeErrors = state.valid === false ? getNativeErrors(source.element) : []
    const validateFn = options.validate.value

    if (!validateFn || (state.valid === false && !options.shouldValidateOnChange())) {
      publish(state, nativeErrors, currentValue)
      return
    }

    let result: FieldValidateResult | PromiseLike<FieldValidateResult>
    try {
      result = validateFn(currentValue, options.getFormValues())
    }
    catch (error) {
      // A throwing `validate` is a bug in the validator, not a field error.
      console.error(error)
      publish(state, nativeErrors, currentValue)
      return
    }

    const finish = (resolved: FieldValidateResult) => {
      const customErrors = normalizeErrors(resolved)
      if (customErrors.length > 0) {
        state = { ...state, valid: false, customError: true }
        // Keep custom errors for barred controls in field state only.
        if (source.element?.willValidate)
          setCustomValidity(source.element, customErrors.join('\n'))
        publish(state, customErrors, currentValue)
      }
      else {
        publish(state, getNativeErrors(source.element), currentValue)
      }
    }

    if (!isPromiseLike<FieldValidateResult>(result)) {
      finish(result)
      return
    }

    // Validity is unknown while the validator runs, so go neutral — but keep
    // what must still block submission: native failures, and a previous
    // custom error outside `onSubmit` mode.
    if (state.valid === false)
      publish(state, nativeErrors, currentValue)
    else if (options.validationMode.value === 'onSubmit' || !validity.value.customError)
      publish({ ...state, valid: null }, [], currentValue)

    result.then(
      (resolved) => {
        if (id !== commitId)
          return
        state = readState(source, currentValue)
        finish(resolved)
      },
      (error) => {
        // A rejected validator keeps the previously published state, so a
        // transient failure can't retire an error and unblock submission.
        console.error(error)
      },
    )
  }

  /**
   * Re-checks an invalid field while its value changes but on-change
   * validation doesn't apply: clears a resolved `valueMissing` right away,
   * leaving other errors for the next blur/submit.
   */
  function revalidate(currentValue: unknown, source: FieldValiditySource) {
    if (validity.value.valid !== false)
      return
    commitId++
    clearCustomValidity()

    const live = source.element
      ? (source.element.willValidate ? source.element.validity : undefined)
      : source.getValidity?.(currentValue)
    if (!live || live.valueMissing)
      return

    publish({ ...createValidityState(), valid: true }, [], currentValue)
  }

  /** Runs on a value change: validates (debounced) when on-change validation applies. */
  function change(currentValue: unknown, source: FieldValiditySource) {
    clearDebounce()
    if (!options.shouldValidateOnChange()) {
      revalidate(currentValue, source)
      return
    }

    const debounceTime = options.validationDebounceTime.value
    if (debounceTime && currentValue !== '') {
      commitId++
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined
        commit(currentValue, source)
      }, debounceTime)
      return
    }
    commit(currentValue, source)
  }

  function reset() {
    clearDebounce()
    commitId++
    clearCustomValidity()
    validity.value = { ...DEFAULT_VALIDITY_STATE }
    errors.value = []
    value.value = null
  }

  // A pending debounce or async `validate` must not outlive the field.
  onScopeDispose(() => {
    clearDebounce()
    commitId++
  })

  return {
    validity,
    errors,
    value,
    commit,
    change,
    reset,
  }
}
