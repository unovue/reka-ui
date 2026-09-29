import type { AnyFn } from '@vueuse/shared'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { Emit, EmitAsProps } from './useEmitAsProps'
import type { WithOptionalBooleans } from './useForwardProps'
import { computed } from 'vue'
import { useEmitAsProps } from './useEmitAsProps'
import { useForwardProps } from './useForwardProps'

/**
 * The function `useForwardPropsEmits` takes in props and an optional emit function, and returns a
 * computed object that combines the parsed props and emits as props.
 * @param {T} props - The `props` parameter is of type `T`, which is a generic type that extends the
 * parameters of the `useForwardProps` function. It represents the props object that is passed to the
 * `useForwardProps` function.
 * @param [emit] - The `emit` parameter is a function that can be used to emit events. It takes two
 * arguments: `name`, which is the name of the event to be emitted, and `args`, which are the arguments
 * to be passed along with the event.
 * @returns a computed property that combines the parsed
 * props and emits as props.
 */
export function useForwardPropsEmits<
  T extends Record<string, any>,
>(props: MaybeRefOrGetter<T>): ComputedRef<WithOptionalBooleans<T>>
export function useForwardPropsEmits<
  T extends Record<string, any>,
  Name extends string,
  Fn extends AnyFn = AnyFn,
>(props: MaybeRefOrGetter<T>, emit: Emit<Name, Fn>): ComputedRef<WithOptionalBooleans<T> & EmitAsProps<Fn>>
export function useForwardPropsEmits<
  T extends Record<string, any>,
  Name extends string,
  Fn extends AnyFn = AnyFn,
>(props: MaybeRefOrGetter<T>, emit?: Emit<Name, Fn>) {
  const parsedProps = useForwardProps(props)
  const emitsAsProps = emit ? useEmitAsProps(emit) : {}

  return computed(() => ({
    ...parsedProps.value,
    ...emitsAsProps,
  }))
}
