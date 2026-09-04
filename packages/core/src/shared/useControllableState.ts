import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from './types'
import { computed, isRef, ref, shallowRef, toRaw, toValue } from 'vue'

/** Details whose `beforeUpdate` phase is over; a late `cancel()` is a no-op. */
const closedDetails = new WeakSet<ChangeEventDetails<any, any>>()
function closeDetails(details: ChangeEventDetails<any, any>) {
  closedDetails.add(details)
}

/**
 * Creates the details object passed as the second argument of
 * `beforeUpdate:<name>` / `update:<name>` (#2828). `cancel()` flips
 * `isCanceled`; `useControllableState` honours it only during the
 * `beforeUpdate` phase.
 */
export function createChangeEventDetails<R extends string = string, E extends Event = Event>(
  reason: R | BaseChangeReason,
  event?: E,
): ChangeEventDetails<R, E> {
  let canceled = false
  const details: ChangeEventDetails<R, E> = {
    reason,
    event,
    cancel: () => {
      if (closedDetails.has(details)) {
        // eslint-disable-next-line node/prefer-global/process
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[reka-ui] `ChangeEventDetails.cancel()` was called after the `beforeUpdate` phase; '
            + 'it has no effect. Cancel synchronously inside `beforeUpdate:<name>` / `onBeforeUpdate`.',
          )
        }
        return
      }
      canceled = true
    },
    get isCanceled() {
      return canceled
    },
  }
  return details
}

export interface UseControllableStateOptions<T, R extends string = string> {
  /**
   * Controlled value. A getter/ref resolving to `undefined` means uncontrolled.
   * A writable `Ref` is written back on change when neither `emit` nor
   * `onUpdate` is given ("ref-owned" mode).
   */
  prop?: MaybeRefOrGetter<T | undefined>
  defaultValue?: T | (() => T)
  /** Model name, e.g. 'open' or 'modelValue'. With `emit`, emits `beforeUpdate:<name>` then `update:<name>`. */
  name?: string
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: T, details: ChangeEventDetails<R>) => void
  onUpdate?: (value: T, details: ChangeEventDetails<R>) => void
  /** @default Object.is */
  isEqual?: (a: T, b: T) => boolean
}

export interface UseControllableStateReturn<T, R extends string = string> {
  /** Controlled prop when defined, else the internal value. */
  state: ComputedRef<T>
  /** Request a change. Returns `false` when unchanged or cancelled. */
  setState: (value: T, reason?: R | BaseChangeReason, event?: Event) => boolean
  /** Initial `{ reason: 'none', isCanceled: false }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<R>>>
  isControlled: ComputedRef<boolean>
}

/**
 * The one controlled/uncontrolled model every root composable owns (#2828) —
 * replaces vueuse `useVModel`. A change runs `onBeforeUpdate` + the cancellable
 * `beforeUpdate:<name>` emit, then (unless cancelled) writes the internal or
 * ref-owned value and fires `onUpdate` + `update:<name>`. In controlled mode
 * with `emit`/`onUpdate` nothing is written: the owning parent's `update:`
 * handler does.
 *
 * @experimental
 * @lifecycle pure — no lifecycle hooks, no `document`; callable outside `setup()`.
 */
export function useControllableState<T, R extends string = string>(
  options: UseControllableStateOptions<T, R>,
): UseControllableStateReturn<T, R> {
  const { prop, name, emit, onBeforeUpdate, onUpdate } = options
  const isEqual = options.isEqual ?? Object.is
  const initial = typeof options.defaultValue === 'function'
    ? (options.defaultValue as () => T)()
    : options.defaultValue as T
  const internal = ref(initial) as Ref<T>

  const isControlled = computed(() => toValue(prop) !== undefined)
  const state = computed<T>(() => (isControlled.value ? toValue(prop) as T : internal.value))
  // shallowRef: details carry a native `event` and a closure-backed getter — never proxy them.
  const lastChangeDetails = shallowRef(createChangeEventDetails<R>('none')) as Ref<ChangeEventDetails<R>>
  closeDetails(lastChangeDetails.value)

  // Ref-owned: a writable prop ref with no emit/onUpdate is the model's home.
  const refOwned = isRef(prop) && !emit && !onUpdate

  function setState(value: T, reason?: R | BaseChangeReason, event?: Event): boolean {
    // `toRaw`: the internal ref is deep (useVModel parity), so compare against the raw value.
    if (isEqual(value, toRaw(state.value)))
      return false

    const details = createChangeEventDetails<R>(reason ?? 'imperative-action', event)

    onBeforeUpdate?.(value, details)
    if (emit && name)
      emit(`beforeUpdate:${name}`, value, details)
    closeDetails(details)

    if (details.isCanceled) {
      lastChangeDetails.value = details
      return false
    }

    if (!isControlled.value)
      internal.value = value
    else if (refOwned)
      (prop as Ref<T | undefined>).value = value

    onUpdate?.(value, details)
    if (emit && name)
      emit(`update:${name}`, value, details)
    lastChangeDetails.value = details
    return true
  }

  return { state, setState, lastChangeDetails, isControlled }
}
