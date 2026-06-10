/**
 * Compile-time type tests for `useEmitAsProps` and `useForwardPropsEmits`.
 *
 * These assertions are validated by `vue-tsc` (the `type-check` / `build` step):
 * `tsconfig.check.json` includes `src/**` and only excludes `*.test.ts`, so this
 * `*.test-d.ts` file is type-checked but is neither executed by Vitest (its glob
 * is `*.test.{ts,js}`) nor bundled (nothing imports it). A regression in the emit
 * type inference therefore fails the build.
 */
import type { ComputedRef } from 'vue'
import type { EmitAsProps } from './useEmitAsProps'
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

// EmitAsProps utility — emit signature to handler props
type _emitAsProps = Expect<Equal<keyof EmitAsProps<OverloadedEmit>, 'onUpdate:modelValue' | 'onChange'>>

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

// Without emit: only forwarded props, no `on*` handler keys leak in
{
  const forwarded = useForwardPropsEmits(props)
  type Value = typeof forwarded extends ComputedRef<infer V> ? V : never
  type _noHandlers = Expect<Equal<Extract<keyof Value, `on${string}`>, never>>
}
