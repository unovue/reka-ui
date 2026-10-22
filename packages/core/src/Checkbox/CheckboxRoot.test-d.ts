/**
 * Compile-time type tests for the generic `CheckboxRoot`, validated by `vue-tsc`
 * (see `shared/useEmitAsProps.test-d.ts`).
 *
 * The component is called the way `vue-tsc` checks a template usage, so the
 * `TrueValue` / `FalseValue` generics are inferred exactly as in
 * `<CheckboxRoot ... />`. They must be inferred from `trueValue` / `falseValue`
 * only (or fall back to `true` / `false`, the runtime defaults), never from
 * `modelValue` / `defaultValue`.
 */
import type { CheckboxRootEmits, CheckboxRootProps } from './CheckboxRoot.vue'
import CheckboxRoot from './CheckboxRoot.vue'

// Assertion helpers
type Expect<T extends true> = T
type Equal<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

type Payload<E> = E extends { 'update:modelValue': [value: infer P] } ? P : never

// Public types: `trueValue` and `falseValue` can have different types
type _propsDefault = Expect<Equal<NonNullable<CheckboxRootProps['modelValue']>, boolean | 'indeterminate'>>
type _propsMixed = Expect<Equal<NonNullable<CheckboxRootProps<'on', 0>['modelValue']>, 'on' | 0 | 'indeterminate'>>
type _emitsDefault = Expect<Equal<Payload<CheckboxRootEmits>, boolean | 'indeterminate'>>
type _emitsMixed = Expect<Equal<Payload<CheckboxRootEmits<'on', 0>>, 'on' | 0 | 'indeterminate'>>

declare const bool: boolean
declare const onOff: 'on' | 'off'
declare const onOrZero: 'on' | 0
declare const onOrFalse: 'on' | false

// Never executed: only type-checked
export function _checkboxRootTypeTests() {
  // No `trueValue` / `falseValue`: boolean
  CheckboxRoot({ 'modelValue': bool, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, boolean | 'indeterminate'>>
  } })

  // `trueValue` and `falseValue` of different types
  CheckboxRoot({ 'trueValue': 'on', 'falseValue': 0, 'modelValue': onOrZero, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, 'on' | 0 | 'indeterminate'>>
  } })

  // Only `trueValue`: the emitted value still includes `false`
  CheckboxRoot({ 'trueValue': 'on', 'modelValue': onOrFalse, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, 'on' | false | 'indeterminate'>>
  } })

  // Literal types are kept (`const` generics)
  CheckboxRoot({ 'trueValue': 'on', 'falseValue': 'off', 'modelValue': onOff, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, 'on' | 'off' | 'indeterminate'>>
  } })

  // `indeterminate` is always accepted
  CheckboxRoot({ trueValue: 'on', falseValue: 'off', modelValue: 'indeterminate' })
  CheckboxRoot({ defaultValue: 'indeterminate' })

  // `modelValue` must not drive inference (`NoInfer`): the runtime emits `true` / `false` here
  // @ts-expect-error 'on' | 'off' is not assignable to boolean
  CheckboxRoot({ modelValue: onOff })

  // @ts-expect-error the runtime emits `false`, not 'off'
  CheckboxRoot({ trueValue: 'on', modelValue: onOff })

  // @ts-expect-error `defaultValue` must match `trueValue` or `falseValue`
  CheckboxRoot({ trueValue: 'on', defaultValue: 'off' })

  // @ts-expect-error `modelValue` outside of `trueValue` | `falseValue`
  CheckboxRoot({ trueValue: 'on', falseValue: 'off', modelValue: 'nope' })
}
