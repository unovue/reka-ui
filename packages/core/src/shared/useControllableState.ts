import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
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
 *
 * `isCanceled` is a plain data property that `cancel()` sets, not a getter
 * over a closure: V8 keeps an object literal's accessor pair in the literal's
 * shared map, so a getter here kept one details object (its `event`, and
 * through the event target a detached DOM tree) alive for the page's lifetime.
 */
export function createChangeEventDetails<R extends string = string, E extends Event = Event>(
  reason: R | BaseChangeReason,
  event?: E,
  trigger?: Element,
): ChangeEventDetails<R, E> {
  const details: { -readonly [K in keyof ChangeEventDetails<R, E>]: ChangeEventDetails<R, E>[K] } = {
    reason,
    event,
    ...(trigger ? { trigger } : {}),
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
      details.isCanceled = true
    },
    isCanceled: false,
  }
  return details
}

let initialDetails: ChangeEventDetails<any> | undefined
/**
 * The `{ reason: 'none' }` details every model starts with. Closed (its
 * `cancel()` is a no-op), frozen (`isCanceled` is a writable data property)
 * and holding no event, so one shared object serves every instance instead of
 * an object and a closure each.
 */
function getInitialDetails(): ChangeEventDetails<any> {
  if (!initialDetails) {
    initialDetails = createChangeEventDetails('none')
    closeDetails(initialDetails)
    Object.freeze(initialDetails)
  }
  return initialDetails
}

export interface UseControllableStateOptions<T, R extends string = string> {
  /**
   * Controlled value. A getter/ref that has only ever resolved to `undefined`
   * means uncontrolled. Controlled mode **latches**: once the prop has resolved
   * to a defined value the model stays controlled, even if the prop is later
   * cleared to `undefined` (Base UI's rule). A writable `Ref` is the model's
   * single store when neither `emit` nor `onUpdate` is given ("ref-owned" mode).
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

/** Extra options for `setState` (internal callers such as detached-trigger handles, #2826). */
export interface SetStateOptions {
  /** Attributed to the change as `details.trigger`. */
  trigger?: Element
  /**
   * Run the `beforeUpdate` / `update` cycle even when the value is unchanged.
   * A popup that is already open and switches to another detached trigger
   * reports `update:open(true)` again, cancellable like any other change.
   */
  force?: boolean
}

export interface UseControllableStateReturn<T, R extends string = string> {
  /**
   * The controlled prop while controlled, else the internal value. A controlled
   * model cleared to `undefined` reads `undefined`; it does not fall back to
   * `defaultValue`. The type stays `ComputedRef<T>` (not `T | undefined`) on
   * purpose: widening it would ripple into every family's model type, and the
   * cleared-controlled case is the parent's deliberate choice.
   */
  state: ComputedRef<T>
  /** Request a change. Returns `false` when unchanged (unless `options.force`) or cancelled. */
  setState: (value: T, reason?: R | BaseChangeReason, event?: Event, options?: SetStateOptions) => boolean
  /** Initial `{ reason: 'none', isCanceled: false }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<R>>>
  /** `true` in ref-owned mode, and (latched) once the prop has ever been defined. */
  isControlled: ComputedRef<boolean>
}

/**
 * One model's state: the uncontrolled store, the controlled latch and the last
 * change details, in one object rather than four reactive cells (a ref, two
 * computeds and a shallowRef, each with its own dep). It is also the
 * `isControlled` ref itself.
 *
 * - `isControlled` reads the prop directly (tracked by the reader) until it
 *   latches; it was a computed, but the read is a getter call and `state`,
 *   the computed every consumer binds, already caches.
 * - The uncontrolled store is created on first use, so a controlled model
 *   (the parent owns `v-model`) never allocates one.
 * - `lastChangeDetails` is a plain slot until something reads it; the first
 *   read moves it into a `shallowRef` so later writes are tracked.
 */
class ControllableModel<T, R extends string> {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  internal: Ref<T> | undefined = undefined
  details: ChangeEventDetails<R> = getInitialDetails()
  detailsRef: ShallowRef<ChangeEventDetails<R>> | undefined = undefined

  constructor(
    readonly prop: MaybeRefOrGetter<T | undefined>,
    readonly refOwned: boolean,
    public everDefined: boolean,
    public initial: T | undefined,
  ) {}

  /** `isControlled`. */
  get value(): boolean {
    if (this.refOwned)
      return true
    // Controlled mode latches: once the prop has ever been defined the model
    // stays controlled even if the parent later clears it to `undefined`.
    // Without the latch a controlled Tabs cleared to `undefined` would fall
    // back to the internal value (still holding `defaultValue`) and re-activate
    // a stale tab. A plain field flipped on read rather than a `watch`: this
    // composable is pure and callable outside a component scope, so a `watch`
    // would never be stopped. Until it latches the read tracks `prop`.
    if (!this.everDefined && toValue(this.prop) !== undefined)
      this.everDefined = true
    return this.everDefined
  }

  /** The uncontrolled value (deep, `useVModel` parity), created on first use. */
  get store(): Ref<T> {
    if (!this.internal) {
      this.internal = ref(this.initial) as Ref<T>
      this.initial = undefined
    }
    return this.internal
  }

  read(): T {
    if (this.refOwned) {
      const owned = (this.prop as Ref<T | undefined>).value
      return owned === undefined ? this.store.value : owned
    }
    // Controlled: mirror the prop as-is — `undefined` reads `undefined`, never `defaultValue`.
    return this.value ? toValue(this.prop) as T : this.store.value
  }

  setDetails(details: ChangeEventDetails<R>) {
    if (this.detailsRef)
      this.detailsRef.value = details
    else
      this.details = details
  }
}

/** `lastChangeDetails`: a readonly ref view whose cell is created on first read. */
class LastChangeDetailsRef<R extends string> {
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  constructor(readonly model: ControllableModel<any, R>) {}
  get value(): ChangeEventDetails<R> {
    const model = this.model
    // shallowRef: details carry a native `event` and a `cancel` closure — never proxy them.
    return (model.detailsRef ??= shallowRef(model.details)).value
  }
}

/**
 * The one controlled/uncontrolled model every root composable owns (#2828) —
 * replaces vueuse `useVModel`. A change runs `onBeforeUpdate` + the cancellable
 * `beforeUpdate:<name>` emit, then (unless cancelled) writes the internal or
 * ref-owned value and fires `onUpdate` + `update:<name>`. In controlled mode
 * with `emit`/`onUpdate` nothing is written: the owning parent's `update:`
 * handler does.
 *
 * Modes:
 * - **ref-owned** (`prop` is a writable `Ref`, no `emit`/`onUpdate`): the ref is
 *   the single store — `setState` always writes it, even when it starts
 *   `undefined`; `state` falls back to `defaultValue` only while the ref reads
 *   `undefined`.
 * - **controlled** (latched — see `isControlled`): `state` mirrors the prop,
 *   `undefined` included.
 * - **uncontrolled**: `state` is the internal value seeded from `defaultValue`.
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

  // Ref-owned: a writable prop ref with no emit/onUpdate is the model's single store.
  const refOwned = isRef(prop) && !emit && !onUpdate
  const model = new ControllableModel<T, R>(prop, refOwned, !refOwned && toValue(prop) !== undefined, initial)
  const state = computed<T>(() => model.read())

  function setState(value: T, reason?: R | BaseChangeReason, event?: Event, options?: SetStateOptions): boolean {
    // Ref-owned with an `undefined` ref: `state` reads `defaultValue` through the
    // fallback, but the ref itself holds nothing, so `setState(defaultValue)` is a
    // real write (it makes the ref defined) — never a no-op.
    const ownedUndefined = refOwned && (prop as Ref<T | undefined>).value === undefined
    // `toRaw`: the internal ref is deep (useVModel parity), so compare against the raw value.
    if (!ownedUndefined && !options?.force && isEqual(value, toRaw(state.value)))
      return false

    const details = createChangeEventDetails<R>(reason ?? 'imperative-action', event, options?.trigger)

    onBeforeUpdate?.(value, details)
    if (emit && name)
      emit(`beforeUpdate:${name}`, value, details)
    closeDetails(details)

    if (details.isCanceled) {
      model.setDetails(details)
      return false
    }

    if (refOwned)
      (prop as Ref<T | undefined>).value = value
    else if (!model.value)
      model.store.value = value

    onUpdate?.(value, details)
    if (emit && name)
      emit(`update:${name}`, value, details)
    model.setDetails(details)
    return true
  }

  return {
    state,
    setState,
    lastChangeDetails: new LastChangeDetailsRef(model) as unknown as Readonly<Ref<ChangeEventDetails<R>>>,
    isControlled: model as unknown as ComputedRef<boolean>,
  }
}
