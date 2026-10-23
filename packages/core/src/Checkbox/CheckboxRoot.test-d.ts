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
// A single type argument keeps its previous meaning: both values share it
type _propsSingle = Expect<Equal<NonNullable<CheckboxRootProps<string>['modelValue']>, string | 'indeterminate'>>
type _propsMixed = Expect<Equal<NonNullable<CheckboxRootProps<'on', 0>['modelValue']>, 'on' | 0 | 'indeterminate'>>
type _emitsDefault = Expect<Equal<Payload<CheckboxRootEmits>, boolean | 'indeterminate'>>
type _emitsSingle = Expect<Equal<Payload<CheckboxRootEmits<string>>, string | 'indeterminate'>>
type _emitsMixed = Expect<Equal<Payload<CheckboxRootEmits<'on', 0>>, 'on' | 0 | 'indeterminate'>>

declare const bool: boolean
declare const str: string
declare const num: number
declare const onOff: 'on' | 'off'
declare const strOrNum: string | number
declare const strOrFalse: string | false

// Never executed: only type-checked
export function _checkboxRootTypeTests() {
  // No `trueValue` / `falseValue`: boolean
  CheckboxRoot({ 'modelValue': bool, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, boolean | 'indeterminate'>>
  } })

  // `trueValue` and `falseValue` of different types
  CheckboxRoot({ 'trueValue': 'on', 'falseValue': 0, 'modelValue': strOrNum, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string | number | 'indeterminate'>>
  } })

  // Only `trueValue`: the emitted value still includes `false`
  CheckboxRoot({ 'trueValue': 'on', 'modelValue': strOrFalse, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string | false | 'indeterminate'>>
  } })

  // Widened refs bound with v-model are accepted (e.g. `ref('off')`, `ref(0)`)
  CheckboxRoot({ 'trueValue': 'on', 'falseValue': 'off', 'modelValue': str, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string | 'indeterminate'>>
  } })
  CheckboxRoot({ trueValue: 1, falseValue: 0, modelValue: num })
  CheckboxRoot({ trueValue: 'on', falseValue: 'off', modelValue: onOff })

  // `indeterminate` is always accepted
  CheckboxRoot({ trueValue: 'on', falseValue: 'off', modelValue: 'indeterminate' })
  CheckboxRoot({ defaultValue: 'indeterminate' })

  // `modelValue` must not drive inference (`NoInfer`): the runtime emits `true` / `false` here
  // @ts-expect-error 'on' | 'off' is not assignable to boolean
  CheckboxRoot({ modelValue: onOff })

  // @ts-expect-error the runtime emits `false`, not a number
  CheckboxRoot({ trueValue: 'on', modelValue: num })

  // @ts-expect-error `defaultValue` must match the type of `trueValue` or `falseValue`
  CheckboxRoot({ trueValue: 1, falseValue: 0, defaultValue: 'off' })
}
