/**
 * Compile-time type tests for `useEmitAsProps` and `useForwardPropsEmits`.
 *
 * These assertions are validated by `vue-tsc` (the `type-check` / `build` step):
 * `tsconfig.check.json` includes all of `src/**`, so this
 * `*.test-d.ts` file is type-checked but is neither executed by Vitest (its glob
 * is `*.test.{ts,js}`) nor bundled (nothing imports it). A regression in the emit
 * type inference therefore fails the build.
 */
import type { ComputedRef, EmitFn } from 'vue'
import type { EmitAsProps } from './useEmitAsProps'
import type { ComboboxRootEmits } from '@/Combobox/ComboboxRoot.vue'
import type { DateRangePickerRootEmits } from '@/DateRangePicker/DateRangePickerRoot.vue'
import type { DialogRootEmits } from '@/Dialog/DialogRoot.vue'
import type { SelectRootEmits } from '@/Select/SelectRoot.vue'
import { useEmitAsProps } from './useEmitAsProps'
import { useForwardPropsEmits } from './useForwardPropsEmits'

// Assertion helpers
type Expect<T extends true> = T
type Equal<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

// Fixtures mirroring the emit shapes Vue produces from `defineEmits`
type OverloadedEmit = {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: number, extra: boolean): void
}
declare const overloadedEmit: OverloadedEmit

type SingleEmit = (e: 'close', reason: string) => void
declare const singleEmit: SingleEmit

// The loose signature used internally by some components must stay assignable
type LooseEmit = (name: string, ...args: any[]) => void
declare const looseEmit: LooseEmit

// `defineEmits<{ foo: [void] }>()` declares a required trailing `void` argument. TypeScript infers such
// parameters as optional, which used to break overload walking (#2769, #2766)
type VoidEmit = EmitFn<{ contentFound: [void] }>
declare const voidEmit: VoidEmit

type MixedVoidEmit = EmitFn<{ 'contentFound': [void], 'update:modelValue': [value: string], 'change': [value: number, extra: void] }>
declare const mixedVoidEmit: MixedVoidEmit

// useEmitAsProps — overloaded emit maps each event to its `onXxx` handler prop
{
  const result = useEmitAsProps(overloadedEmit)
  type Result = typeof result
  type _keys = Expect<Equal<keyof Result, 'onUpdate:modelValue' | 'onChange'>>
  type _update = Expect<Equal<Parameters<NonNullable<Result['onUpdate:modelValue']>>, [value: string]>>
  type _change = Expect<Equal<Parameters<NonNullable<Result['onChange']>>, [value: number, extra: boolean]>>
}

// useEmitAsProps — single (non-overloaded) emit
{
  const result = useEmitAsProps(singleEmit)
  type Result = typeof result
  type _keys = Expect<Equal<keyof Result, 'onClose'>>
  type _args = Expect<Equal<Parameters<NonNullable<Result['onClose']>>, [reason: string]>>
}

// useEmitAsProps — loose signature stays accepted (backwards compatibility)
{
  const result = useEmitAsProps(looseEmit)
  void result
}

// useEmitAsProps — emits with `[void]` arguments resolve without TS2589 and keep every event
{
  const result = useEmitAsProps(voidEmit)
  type Result = typeof result
  type _keys = Expect<Equal<keyof Result, 'onContentFound'>>
  type _args = Expect<Equal<Parameters<NonNullable<Result['onContentFound']>>, [args_0?: void]>>
}
{
  const result = useEmitAsProps(mixedVoidEmit)
  type Result = typeof result
  type _keys = Expect<Equal<keyof Result, 'onContentFound' | 'onUpdate:modelValue' | 'onChange'>>
  type _update = Expect<Equal<Parameters<NonNullable<Result['onUpdate:modelValue']>>, [value: string]>>
  type _change = Expect<Equal<Parameters<NonNullable<Result['onChange']>>, [value: number, extra?: void]>>
}

// EmitAsProps utility — emit signature to handler props
type _emitAsProps = Expect<Equal<keyof EmitAsProps<OverloadedEmit>, 'onUpdate:modelValue' | 'onChange'>>

// EmitAsProps on real roots: every event maps to its handler, including roots
// with many emits (DateRangePickerRoot has 11), which used to hit TS2589
// ("Type instantiation is excessively deep") and fall back to the loose signature.
type HandlerKeys<E> = { [K in keyof E & string]: `on${Capitalize<K>}` }[keyof E & string]
type _dialogKeys = Expect<Equal<keyof EmitAsProps<EmitFn<DialogRootEmits>>, HandlerKeys<DialogRootEmits>>>
type _selectKeys = Expect<Equal<keyof EmitAsProps<EmitFn<SelectRootEmits>>, HandlerKeys<SelectRootEmits>>>
type _comboboxKeys = Expect<Equal<keyof EmitAsProps<EmitFn<ComboboxRootEmits>>, HandlerKeys<ComboboxRootEmits>>>
type DateRangePickerHandlers = EmitAsProps<EmitFn<DateRangePickerRootEmits>>
type _dateRangePickerKeys = Expect<Equal<keyof DateRangePickerHandlers, HandlerKeys<DateRangePickerRootEmits>>>
type _dateRangePickerOpenComplete = Expect<Equal<Parameters<NonNullable<DateRangePickerHandlers['onUpdate:openComplete']>>, [value: boolean]>>

// Headroom: twenty emits still resolve.
type ManyEmits = { [K in `e${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20}`]: [a: number, b: string] }
type ManyHandlers = EmitAsProps<EmitFn<ManyEmits>>
type _manyKeys = Expect<Equal<keyof ManyHandlers, HandlerKeys<ManyEmits>>>
type _manyArgs = Expect<Equal<Parameters<NonNullable<ManyHandlers['onE20']>>, [a: number, b: string]>>

// useForwardPropsEmits — fixtures
interface DemoProps { foo: string, bar: boolean }
declare const props: DemoProps

// With emit: forwarded props AND emit-as-props are both present and typed
{
  const forwarded = useForwardPropsEmits(props, overloadedEmit)
  type Value = typeof forwarded extends ComputedRef<infer V> ? V : never
  type _prop = Expect<Equal<Value['foo'], string>>
  type _emit = Expect<Equal<Parameters<NonNullable<Value['onChange']>>, [value: number, extra: boolean]>>
}

// With a `[void]` emit and an omitted prop, as in the reproduction from #2769
declare const delegatedProps: Omit<DemoProps & { class?: string }, 'class'>
{
  const forwarded = useForwardPropsEmits(delegatedProps, voidEmit)
  type Value = typeof forwarded extends ComputedRef<infer V> ? V : never
  type _prop = Expect<Equal<Value['foo'], string>>
  type _emit = Expect<Equal<Parameters<NonNullable<Value['onContentFound']>>, [args_0?: void]>>
  type _noClass = Expect<Equal<Extract<keyof Value, 'class'>, never>>
}

// Without emit: only forwarded props, no `on*` handler keys leak in
{
  const forwarded = useForwardPropsEmits(props)
  type Value = typeof forwarded extends ComputedRef<infer V> ? V : never
  type _noHandlers = Expect<Equal<Extract<keyof Value, `on${string}`>, never>>
}
