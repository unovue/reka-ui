import type { AnyFn } from '@vueuse/shared'
import { camelize, getCurrentInstance, toHandlerKey } from 'vue'

// Vue doesn't have emits forwarding, in order to bind the emits we have to convert events into `onXXX` handlers
// issue: https://github.com/vuejs/core/issues/5917
/**
 * The `useEmitAsProps` function is a TypeScript utility that converts emitted events into props for a
 * Vue component.
 *
 * @template Name - The event name string union type.
 * @template Fn - The emit function type.
 *
 * @param emit - The `emit` parameter is a function that is used to emit events from a component. It
 *
 * takes two parameters: `name` which is the name of the event to be emitted, and `...args` which are
 * the arguments to be passed along with the event.
 * @returns The function `useEmitAsProps` returns an object that maps event names to functions that
 * call the `emit` function with the corresponding event name and arguments.
 */
export function useEmitAsProps<Name extends string, Fn extends AnyFn = AnyFn>(emit: Emit<Name, Fn>) {
  const vm = getCurrentInstance()

  const events = vm?.type.emits as Name[]
  const result: Record<string, any> = {}

  if (!events?.length) {
    console.warn(
      `No emitted event found. Please check component: ${vm?.type.__name}`,
    )
  }

  events?.forEach((ev) => {
    result[toHandlerKey(camelize(ev))] = (...arg: any) => emit(ev, ...arg)
  })

  return result as EmitAsProps<Fn>
}

export type EmitAsProps<T extends AnyFn> = Expand<Partial<MergeUnion<EmitUnion<OverloadUnion<T>>>>>

export type Emit<Name extends string, Fn extends AnyFn> = IsEmit<Name, Fn> extends true ? Fn : never

type IsEmit<Name extends string, Fn extends AnyFn>
  = OverloadUnion<Fn> extends infer T extends AnyFn
    ? Parameters<T> extends [name: Name, ...args: any[]]
      ? [ReturnType<T>] extends [void]
          ? true
          : false
      : false
    : false

type Expand<T> = {
  [K in keyof T]: T[K]
} & {}

type MergeUnion<T> = {
  [K in T extends any ? keyof T : never]: T extends { [P in K]: any } ? T[K] : never;
}

type EmitUnion<Fn extends AnyFn>
  = Fn extends (name: infer Name extends string, ...args: infer Args) => infer Return
    ? { [K in HandlerKey<Name>]: (...args: Args) => Return }
    : unknown

// Types for prop keys

type CamelCase<S extends string>
  = S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S

type HandlerKey<Name extends string> = CamelCase<`on-${Name}`>

// Package-private overload types from @vue/shared

type OverloadProps<TOverload> = Pick<TOverload, keyof TOverload>

type OverloadUnionRecursive<
  TOverload,
  TPartialOverload = unknown,
> = TOverload extends (...args: infer TArgs) => infer TReturn
  ? TPartialOverload extends TOverload
    ? never
    : | OverloadUnionRecursive<
            TPartialOverload & TOverload,
            TPartialOverload
            & ((...args: TArgs) => TReturn)
            & OverloadProps<TOverload>
    >
    | ((...args: TArgs) => TReturn)
  : never

type OverloadUnion<TOverload extends (...args: any[]) => any> = Exclude<
  OverloadUnionRecursive<(() => never) & TOverload>,
  TOverload extends () => never ? never : () => never
>
