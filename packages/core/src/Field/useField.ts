import type { ComputedRef } from 'vue'
import type { FieldValidityState } from './useFieldValidation'
import { injectFieldRootContext } from './fieldRootContext'

export interface UseFieldReturn {
  /** The field's `name`. */
  name: ComputedRef<string | undefined>
  /** Whether the field is disabled. */
  disabled: ComputedRef<boolean>
  /** Whether the field is required. */
  required: ComputedRef<boolean>
  /** Whether the field is known to be invalid: a failed validation, a server error or the `invalid` prop. */
  invalid: ComputedRef<boolean>
  /** Whether the control has lost focus at least once. */
  touched: ComputedRef<boolean>
  /** Whether the user changed the value to something other than its initial value. */
  dirty: ComputedRef<boolean>
  /** Whether the control holds a value. */
  filled: ComputedRef<boolean>
  /** Whether focus is in the control. */
  focused: ComputedRef<boolean>
  /** All current error messages: validation errors, then server errors. */
  errors: ComputedRef<string[]>
  /** The field's validity. Its `valid` is `null` until the field has been validated. */
  validity: ComputedRef<FieldValidityState>
  /** Validates the field now, whatever its `validationMode`. Returns whether it is valid. */
  validate: () => boolean
  /** Clears the field's touched, dirty and validation state. The control keeps its value. */
  reset: () => void
  /** Moves focus to the field's control. */
  focus: () => void
}

/**
 * Reads and drives the enclosing `FieldRoot` from script: its state, its error
 * messages, and `validate()`, `reset()` and `focus()`. Call it in a component
 * rendered inside a `FieldRoot`; it throws anywhere else.
 *
 * Every ref is the field's own, so calling it creates no reactive state.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — injects the field; call it inside `setup()`.
 */
export function useField(): UseFieldReturn {
  const context = injectFieldRootContext()
  return {
    name: context.name as ComputedRef<string | undefined>,
    disabled: context.disabled as ComputedRef<boolean>,
    required: context.required as ComputedRef<boolean>,
    invalid: context.invalid,
    touched: context.touched,
    dirty: context.dirty,
    filled: context.filled as ComputedRef<boolean>,
    focused: context.focused as ComputedRef<boolean>,
    errors: context.errors,
    validity: context.validity,
    validate: context.validate,
    reset: context.resetField,
    focus: context.focusControl,
  }
}
