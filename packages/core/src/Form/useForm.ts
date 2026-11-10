import type { ComputedRef } from 'vue'
import { injectFormRootContext } from './FormRoot.vue'

export interface UseFormReturn {
  /** How many times the form has been submitted, blocked submissions included. */
  submitCount: ComputedRef<number>
  /**
   * The current value of every named field, keyed by `name`: the object
   * `formSubmit` receives. Read when called, so call it when you need the
   * values (in a handler) rather than in a computed.
   */
  getValues: () => Record<string, unknown>
  /**
   * Validates every field now, or only the field with the given `name`,
   * whatever the validation mode. Returns whether they are all valid.
   */
  validate: (name?: string) => boolean
  /**
   * Resets the form as a `type="reset"` button does: every native and Reka UI control returns to its default
   * value, and every field's touched, dirty and validation state is cleared. In a `FormRoot` rendered as another
   * element there is no native reset, and only the fields' state is cleared.
   */
  reset: () => void
}

/**
 * Reads and drives the enclosing `FormRoot` from script. Call it in a
 * component rendered inside a `FormRoot`; it throws anywhere else.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — injects the form; call it inside `setup()`.
 */
export function useForm(): UseFormReturn {
  const context = injectFormRootContext()
  return {
    submitCount: context.submitCount as unknown as ComputedRef<number>,
    getValues: context.getValues,
    validate: context.validate,
    reset: context.reset,
  }
}
