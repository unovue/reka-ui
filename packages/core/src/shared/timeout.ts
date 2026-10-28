import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { getCurrentScope, onScopeDispose, shallowRef, toValue } from 'vue'

/**
 * A restartable timer as one small object: `start`/`clear` live on the
 * prototype, and nothing reactive is allocated. Replaces vueuse
 * `useTimeoutFn` where a component only starts and clears the timer
 * (`useTimeoutFn` allocates a `ref`, several closures and a return object per
 * instance, at mount).
 *
 * Created inside a component or an effect scope, the timer is cleared when the
 * scope is disposed.
 *
 * @internal
 */
export class Timeout {
  id: ReturnType<typeof setTimeout> | undefined = undefined

  constructor(
    readonly callback: () => void,
    readonly delay: MaybeRefOrGetter<number>,
  ) {}

  /** (Re)starts the timer with the current `delay`. */
  start(): void {
    this.clear()
    this.id = setTimeout(() => {
      this.id = undefined
      this.callback()
    }, toValue(this.delay))
  }

  clear(): void {
    if (this.id !== undefined) {
      clearTimeout(this.id)
      this.id = undefined
    }
  }

  get isPending(): boolean {
    return this.id !== undefined
  }
}

/** A `Timeout` cleared with the current scope. @internal */
export function createTimeout(callback: () => void, delay: MaybeRefOrGetter<number>): Timeout {
  const timeout = new Timeout(callback, delay)
  if (getCurrentScope())
    onScopeDispose(() => timeout.clear())
  return timeout
}

/**
 * vueuse `refAutoReset` as one object: a ref that returns to `initial`
 * `delay` ms after its last write. Its reactive cell is created on first read,
 * so an instance whose value is only ever written (or never touched) stays a
 * plain object; `refAutoReset` allocates a `customRef`, its dep and several
 * closures per instance at mount.
 */
class AutoResetRef<T> {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  raw: T
  cell: ShallowRef<T> | undefined = undefined
  readonly timeout: Timeout

  constructor(readonly initial: T, delay: MaybeRefOrGetter<number>) {
    this.raw = initial
    this.timeout = new Timeout(() => this.write(this.initial), delay)
  }

  get value(): T {
    return (this.cell ??= shallowRef(this.raw)).value
  }

  set value(value: T) {
    this.write(value)
    this.timeout.start()
  }

  write(value: T) {
    this.raw = value
    if (this.cell)
      this.cell.value = value
  }
}

/**
 * A ref that resets to `initial` `delay` ms after it was last set (vueuse
 * `refAutoReset`). A pending reset is dropped with the current scope.
 *
 * @internal
 */
export function autoResetRef<T>(initial: T, delay: MaybeRefOrGetter<number>): Ref<T> {
  const ref = new AutoResetRef(initial, delay)
  if (getCurrentScope())
    onScopeDispose(() => ref.timeout.clear())
  return ref as unknown as Ref<T>
}

let queue: (() => void)[] = []
/** When the pending frame was requested (`-1`: none pending), and through which `requestAnimationFrame`. */
let requestedAt = -1
let requestedWith: typeof requestAnimationFrame | undefined
/**
 * A request older than this is treated as lost (a dropped frame, or one
 * requested under fake timers that never ran) and is requested again.
 */
const STALE_REQUEST_MS = 100

function flush() {
  requestedAt = -1
  const callbacks = queue
  queue = []
  for (const callback of callbacks) {
    try {
      callback()
    }
    catch (error) {
      // One failing callback must not starve the rest of the frame.
      queueMicrotask(() => {
        throw error
      })
    }
  }
}

/**
 * Runs `callback` on the next animation frame through one shared
 * `requestAnimationFrame`: mounting N parts that each defer work by a frame
 * schedules one frame callback, not N.
 *
 * @internal
 */
export function onNextFrame(callback: () => void): void {
  queue.push(callback)
  const now = performance.now()
  const age = now - requestedAt
  // A timestamp, not the frame id: a synchronous `requestAnimationFrame` (test
  // shims) runs `flush` before returning. The request is renewed when it is
  // stale (or the clock moved backwards) or `requestAnimationFrame` was swapped
  // since (fake timers installed or removed: that frame may never run). If the
  // old request fires after all, it flushes an empty queue.
  if (requestedAt < 0 || requestedWith !== requestAnimationFrame || !(age >= 0 && age < STALE_REQUEST_MS)) {
    requestedAt = now
    requestedWith = requestAnimationFrame
    requestAnimationFrame(flush)
  }
}
