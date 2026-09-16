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

type WordChar
  = | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
    | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
    | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
    | '_'

/**
 * Type-safe converter for camelize(string) from Vue package
 */
export type Camelize<S extends string>
  = S extends `${infer Prefix}-${infer Rest}`
    ? Rest extends `${infer Char}${infer After}`
      ? Char extends WordChar
        ? `${Camelize<Prefix>}${Uppercase<Char>}${Camelize<After>}`
        : `${Camelize<Prefix>}-${Camelize<Rest>}`
      : S
    : S

type HandlerKey<Name extends string> = Camelize<`on-${Name}`>

// Overload-walking types, adapted from the package-private helpers in @vue/shared

type OverloadProps<TOverload> = Pick<TOverload, keyof TOverload>

type Signature<TArgs extends any[], TReturn> = (...args: TArgs) => TReturn

type IsEqual<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

/**
 * `Required<T>` strips `void` together with `undefined` from formerly-optional elements,
 * leaving `never`; those elements originated from `void` parameters, so restore them.
 */
type RequiredVoidArgs<TArgs extends any[]> = {
  [K in keyof TArgs]: [TArgs[K]] extends [never] ? void : TArgs[K]
}

/**
 * Whether intersecting `TSignature` in front of `TOverload` removes the last signature of `TOverload`.
 * TypeScript de-duplicates identical call signatures in an intersection, so when the last signature
 * is still the one described by `TArgs`/`TReturn` the reconstruction was not identical to it.
 */
type RemovesLastSignature<TOverload, TSignature extends AnyFn, TArgs extends any[], TReturn>
  = (TSignature & TOverload) extends (...args: infer TNextArgs) => infer TNextReturn
    ? IsEqual<[TNextArgs, TNextReturn], [TArgs, TReturn]> extends true ? false : true
    : false

/**
 * Rebuilds the last signature of `TOverload` (inferred as `TArgs`/`TReturn`) so that TypeScript
 * recognises it as identical to the original and drops it from `TPartialOverload & TOverload`.
 *
 * Trailing `void` parameters are inferred as optional (`args_0?: void | undefined`), which is no
 * longer identical to the declared `(event: 'foo', args_0: void)` signature produced by
 * `defineEmits<{ foo: [void] }>()`. Without special handling the same signature would be inferred
 * forever and TypeScript reports "Type instantiation is excessively deep and possibly infinite".
 * Resolves to `never` when no reconstruction matches.
 */
type LastSignature<TOverload, TArgs extends any[], TReturn>
  = RemovesLastSignature<TOverload, Signature<TArgs, TReturn>, TArgs, TReturn> extends true
    ? Signature<TArgs, TReturn>
    : RemovesLastSignature<TOverload, Signature<RequiredVoidArgs<Required<TArgs>>, TReturn>, TArgs, TReturn> extends true
      ? Signature<RequiredVoidArgs<Required<TArgs>>, TReturn>
      : never

type OverloadUnionRecursive<
  TOverload,
  TPartialOverload = unknown,
> = TOverload extends (...args: infer TArgs) => infer TReturn
  ? TPartialOverload extends TOverload
    ? never
    : LastSignature<TOverload, TArgs, TReturn> extends infer TSignature extends AnyFn
      ? [TSignature] extends [never]
          // The last signature cannot be removed: stop instead of recursing forever and fall back to a loose signature.
          ? (name: string, ...args: any[]) => void
          : | OverloadUnionRecursive<
              TPartialOverload & TOverload,
              TPartialOverload & TSignature & OverloadProps<TOverload>
          >
          | TSignature
      : never
  : never

type OverloadUnion<TOverload extends (...args: any[]) => any> = Exclude<
  OverloadUnionRecursive<(() => never) & TOverload>,
  TOverload extends () => never ? never : () => never
>
