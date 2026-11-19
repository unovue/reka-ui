/**
 * Compile-time type tests for the generic `SwitchRoot`, validated by `vue-tsc`
 * (see `shared/useEmitAsProps.test-d.ts`).
 *
 * The component is called the way `vue-tsc` checks a template usage, so the
 * `TrueValue` / `FalseValue` generics are inferred exactly as in
 * `<SwitchRoot ... />`. They must be inferred from `trueValue` / `falseValue`
 * only (or fall back to `true` / `false`, the runtime defaults), never from
 * `modelValue` / `defaultValue`.
 */
import type { SwitchRootEmits, SwitchRootProps } from './SwitchRoot.vue'
import SwitchRoot from './SwitchRoot.vue'

// Assertion helpers
type Expect<T extends true> = T
type Equal<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

type Payload<E> = E extends { 'update:modelValue': [payload: infer P] } ? P : never

// Public types: `trueValue` and `falseValue` can have different types
type _propsDefault = Expect<Equal<NonNullable<SwitchRootProps['modelValue']>, boolean>>
// A single type argument keeps its previous meaning: both values share it
type _propsSingle = Expect<Equal<NonNullable<SwitchRootProps<string>['modelValue']>, string>>
type _propsMixed = Expect<Equal<NonNullable<SwitchRootProps<'on', 0>['modelValue']>, 'on' | 0>>
type _emitsDefault = Expect<Equal<Payload<SwitchRootEmits>, boolean>>
type _emitsSingle = Expect<Equal<Payload<SwitchRootEmits<string>>, string>>
type _emitsMixed = Expect<Equal<Payload<SwitchRootEmits<'on', 0>>, 'on' | 0>>

declare const bool: boolean
declare const str: string
declare const num: number
declare const onOff: 'on' | 'off'
declare const strOrNum: string | number
declare const strOrFalse: string | false

// Never executed: only type-checked
export function _switchRootTypeTests() {
  // No `trueValue` / `falseValue`: boolean
  SwitchRoot({ 'modelValue': bool, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, boolean>>
  } })

  // `trueValue` and `falseValue` of different types
  SwitchRoot({ 'trueValue': 'on', 'falseValue': 0, 'modelValue': strOrNum, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string | number>>
  } })

  // Only `trueValue`: the emitted value still includes `false`
  SwitchRoot({ 'trueValue': 'on', 'modelValue': strOrFalse, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string | false>>
  } })

  // Widened refs bound with v-model are accepted (e.g. `ref('off')`, `ref(0)`)
  SwitchRoot({ 'trueValue': 'on', 'falseValue': 'off', 'modelValue': str, 'onUpdate:modelValue': (v) => {
    type _ = Expect<Equal<typeof v, string>>
  } })
  SwitchRoot({ trueValue: 1, falseValue: 0, modelValue: num })
  SwitchRoot({ trueValue: 'on', falseValue: 'off', modelValue: onOff })

  // `modelValue` must not drive inference (`NoInfer`): the runtime emits `true` / `false` here
  // @ts-expect-error 'on' | 'off' is not assignable to boolean
  SwitchRoot({ modelValue: onOff })

  // @ts-expect-error the runtime emits `false`, not a number
  SwitchRoot({ trueValue: 'on', modelValue: num })

  // @ts-expect-error `defaultValue` must match the type of `trueValue` or `falseValue`
  SwitchRoot({ trueValue: 1, falseValue: 0, defaultValue: 'off' })
}
