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
export function useEmitAsProps<Name extends string, Fn extends AnyFn = AnyFn>(emit: ToEmit<Name, Fn>) {
  const vm = getCurrentInstance()

  const events = vm?.type.emits as Name[]
  const result: EmitAsProps<Fn> = {}

  if (!events?.length) {
    console.warn(
      `No emitted event found. Please check component: ${vm?.type.__name}`,
    )
  }

  events?.forEach((ev) => {
    result[toHandlerKey(camelize(ev))] = (...arg: any) => emit(ev, ...arg)
  })

  return result
}

export type ToEmit<Name extends string, Fn extends AnyFn>
  = OverloadSignatureTuple<Fn, Props<Fn>, []> extends infer T
    ? T[number]['args'] extends [name: Name, ...args: any[]]
      ? [T[number]['return']] extends [void]
          ? Fn
          : never
      : never
    : never

type OverloadSignature<
  TArgs extends readonly unknown[],
  TReturn,
> = {
  args: TArgs
  return: TReturn
}

// @ts-expect-error - extending a generic type parameter `T` is intentional here so
// ExtendSignature inherits every overload of T for the recursive overload-walking
// algorithm. Removing this suppression causes TS to error and would break the
// recursion/bottoming-out logic (silently changing overload inference).
// Preserve this directive until TS natively supports `interface … extends T`.
// Ref: ExtendSignature<T, TArgs, TReturn> and the recursive overload walk in
// OverloadSignatureTuple.
interface ExtendSignature<T extends object, TArgs extends readonly unknown[], TReturn> extends T {
  (...args: TArgs): TReturn
}

type OverloadSignatureTuple<
  TFunction extends AnyFn,
  TProps extends object,
  TSignature extends readonly OverloadSignature<readonly unknown[], unknown>[],
> = TProps extends TFunction
  ? TSignature
  : TFunction extends ExtendSignature<TProps, infer TArgs, infer TReturn>
    ? OverloadSignatureTuple<
      TFunction,
      ExtendSignature<TProps, TArgs, TReturn>,
      [Props<OverloadSignature<TArgs, TReturn>>, ...TSignature]
    >
    : TSignature

export type Props<T extends object> = {
  [K in keyof T]: T[K]
} & {}

type ToFunctionSignatureTuple<T extends readonly OverloadSignature<readonly unknown[], unknown>[]> = {
  [K in keyof T]: T[K] extends OverloadSignature<infer A, infer R>
    ? (...args: A) => R
    : never;
}

type FunctionSignatureTuple<T extends AnyFn> = ToFunctionSignatureTuple<OverloadSignatureTuple<T, Props<T>, readonly []>>

type FunctionSignature<T extends AnyFn> = FunctionSignatureTuple<T>[number]

type MergeUnion<T> = {
  [K in T extends any ? keyof T : never]: T extends { [P in K]: any } ? T[K] : never;
}

type EmitFunction<TName extends string, TArgs extends unknown[], TReturn> = (name: TName, ...args: TArgs) => TReturn

type CamelCase<S extends string>
  = S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S

type HandlerKey<TName extends string> = CamelCase<`on-${TName}`>

type EmitUnion<Emits extends AnyFn>
  = Emits extends EmitFunction<infer TName, infer TArgs, infer TReturn>
    ? { [K in HandlerKey<TName>]: (...args: TArgs) => TReturn }
    : unknown

export type EmitAsProps<T extends AnyFn> = Props<MergeUnion<EmitUnion<FunctionSignature<T>>>>
