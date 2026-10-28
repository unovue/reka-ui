import type { Ref, ShallowRef } from 'vue'
import { isClient } from '@vueuse/shared'
import { nextTick, shallowRef } from 'vue'

/**
 * Where a presence-managed element is in its enter/exit lifecycle (#2827),
 * mirroring Base UI's `TransitionStatus`:
 * - `'starting'`: the first frame after the element was mounted (or shown again)
 *   by an open; rendered as `data-starting-style`, so CSS transitions can start
 *   from those styles.
 * - `'ending'`: from the close until every exit transition/animation has
 *   finished; rendered as `data-ending-style`.
 * - `undefined`: neither.
 */
export type PresenceTransitionStatus = 'starting' | 'ending' | undefined

/**
 * Whether the node is mounted (`'mounted'`), kept mounted until its exit
 * animations finish (`'unmountSuspended'`), or unmounted.
 */
export type PresenceState = 'mounted' | 'unmountSuspended' | 'unmounted'

export interface UsePresenceOptions {
  /** Stamp the starting style on the initial render when `present` starts `true`. */
  appear?: boolean
  /**
   * Called once the enter (`true`) or exit (`false`) transitions and animations
   * of the node have finished, right before an exiting node unmounts. Not called
   * for a change that a later one interrupts (closing while still opening only
   * reports the close).
   */
  onComplete?: (present: boolean) => void
}

function noop() {}

export const STARTING_STYLE_ATTR = 'data-starting-style'
export const ENDING_STYLE_ATTR = 'data-ending-style'

type PresenceEvent = 'MOUNT' | 'UNMOUNT' | 'ANIMATION_OUT' | 'ANIMATION_END'

/** The presence state machine, shared by every instance. */
const TRANSITIONS: Record<PresenceState, Partial<Record<PresenceEvent, PresenceState>>> = {
  mounted: {
    UNMOUNT: 'unmounted',
    ANIMATION_OUT: 'unmountSuspended',
  },
  unmountSuspended: {
    MOUNT: 'mounted',
    ANIMATION_END: 'unmounted',
  },
  unmounted: {
    MOUNT: 'mounted',
  },
}

/**
 * Whether the environment runs Web Animations (`Element.getAnimations()`).
 * Without it no CSS transition or animation can be observed (jsdom, very old
 * browsers), so presence settles immediately and stamps no lifecycle attributes.
 */
export function supportsAnimations(node?: Element | null): boolean {
  if (!isClient)
    return false
  const target = node ?? globalThis.document?.documentElement
  return typeof target?.getAnimations === 'function'
}

/**
 * The transitions/animations of `node` itself (not its subtree) that are still
 * going to finish. Infinite animations never settle, so they do not hold the
 * node; idle (cancelled) and finished ones are already done.
 */
export function getRunningAnimations(node: Element): Animation[] {
  return node.getAnimations().filter((animation) => {
    if (animation.playState === 'finished' || animation.playState === 'idle')
      return false
    const endTime = animation.effect?.getComputedTiming().endTime
    return endTime !== Infinity
  })
}

/**
 * Mount/unmount state of a presence-managed node that waits for its CSS
 * transitions as well as its CSS animations (#2827). A port of Base UI's
 * `useTransitionStatus` + `useAnimationsFinished`:
 * - opening an unmounted node renders it with `transitionStatus` `'starting'`
 *   for one frame, then clears it;
 * - closing sets `'ending'` and keeps the node mounted until
 *   `getAnimations()` reports nothing running, then unmounts it;
 * - with nothing running (no transition, no animation, reduced motion that
 *   disables them, `display: none`) the node unmounts in the same tick.
 *
 * A class (methods on the prototype, no per-instance closures) that its owner
 * creates only once the node is first present, and drives from its own
 * watcher: `onPresentChange` for `present`, `onNodeChange` for the node.
 */
export class PresenceController {
  readonly transitionStatus: ShallowRef<PresenceTransitionStatus> = shallowRef()

  // Every `present` change starts a new run; async work from an older run
  // (a pending frame, a pending `finished` promise) checks it and bails out.
  private run = 0
  private frame: number | undefined
  // A close whose rendered state has not been checked for animations yet.
  private exitPending = false

  constructor(
    /** The owner's state; `'mounted'` or `'unmounted'` when this is created. */
    private readonly state: ShallowRef<PresenceState>,
    private readonly node: Readonly<Ref<HTMLElement | undefined>>,
    private readonly options: UsePresenceOptions,
  ) {}

  private dispatch(event: PresenceEvent) {
    this.state.value = TRANSITIONS[this.state.value][event] ?? this.state.value
  }

  private dispatchCustomEvent(name: 'enter' | 'after-enter' | 'leave' | 'after-leave') {
    // We only dispatch this event because CustomEvent is not available in Node18
    // https://github.com/unovue/reka-ui/issues/930
    if (isClient) {
      const customEvent = new CustomEvent(name, { bubbles: false, cancelable: false })
      this.node.value?.dispatchEvent(customEvent)
    }
  }

  /** Cancels the pending frame and invalidates the current run. */
  cancelPending() {
    this.run++
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame)
      this.frame = undefined
    }
  }

  /**
   * Calls `done` once the node has no running transition or animation. A
   * rejected `finished` (an animation cancelled because a property it depends
   * on changed) re-checks instead of resolving, so a replacement transition is
   * waited for too (Base UI's `treatAbortedAsFinished = false`).
   */
  private whenAnimationsFinish(currentRun: number, done: () => void) {
    const element = this.node.value
    if (!element || !supportsAnimations(element))
      return done()
    const running = getRunningAnimations(element)
    if (!running.length)
      return done()
    const recheck = () => {
      if (currentRun === this.run)
        this.whenAnimationsFinish(currentRun, done)
    }
    // `.then(noop)` so the joined promise does not resolve to (and retain) the
    // finished Animation objects (Base UI #5719).
    Promise.all(running.map(animation => animation.finished.then(noop))).then(recheck, recheck)
  }

  // Nothing animates on the server: the immediate watcher still runs during
  // SSR, but the completion must only be reported by the client.
  private notifyComplete(value: boolean) {
    if (isClient)
      this.options.onComplete?.(value)
  }

  private finishEnter() {
    this.dispatchCustomEvent('after-enter')
    this.notifyComplete(true)
  }

  private finishExit() {
    this.dispatch(this.state.value === 'unmountSuspended' ? 'ANIMATION_END' : 'UNMOUNT')
    this.transitionStatus.value = undefined
    this.dispatchCustomEvent('after-leave')
    this.notifyComplete(false)
  }

  /**
   * Looks at the rendered closed state: with nothing running, the exit is done
   * right away (returns `true`); otherwise the caller decides what to wait for.
   */
  private settlePendingExit() {
    this.dispatchCustomEvent('leave')
    const element = this.node.value
    if (element && supportsAnimations(element) && getRunningAnimations(element).length)
      return false
    this.finishExit()
    return true
  }

  /** The `present` watcher (`prevPresent` is `undefined` on the initial call). */
  async onPresentChange(currentPresent: boolean, prevPresent: boolean | undefined) {
    // Closed and reopened before the closed state was checked for exit
    // animations: settle that close first, so a node with nothing to wait for
    // still goes through a full unmount/mount cycle.
    if (currentPresent && this.exitPending)
      this.settlePendingExit()
    this.exitPending = false
    this.cancelPending()
    const currentRun = this.run
    const isInitial = prevPresent === undefined

    if (currentPresent) {
      // Base UI stamps the starting style only when an unmounted popup opens:
      // not on the initial render (unless `appear`), and not when reopening
      // mid-exit (the exit transition reverses from wherever it is).
      const startsFromUnmounted = isInitial ? !!this.options.appear : this.state.value === 'unmounted'
      this.transitionStatus.value = startsFromUnmounted && supportsAnimations() ? 'starting' : undefined

      await nextTick()
      if (currentRun !== this.run)
        return
      this.dispatch('MOUNT')
      this.dispatchCustomEvent('enter')

      if (this.transitionStatus.value !== 'starting')
        return this.whenAnimationsFinish(currentRun, () => this.finishEnter())

      this.frame = requestAnimationFrame(() => {
        this.frame = undefined
        // Resolve styles while the starting style is still applied, so it is
        // the before-change style of the transitions even if nothing has read
        // styles since the node was inserted.
        if (this.node.value)
          void getComputedStyle(this.node.value).transitionProperty
        this.transitionStatus.value = undefined
        nextTick(() => {
          if (currentRun === this.run)
            this.whenAnimationsFinish(currentRun, () => this.finishEnter())
        })
      })
      return
    }

    if (isInitial || this.state.value === 'unmounted') {
      this.transitionStatus.value = undefined
      return
    }

    if (supportsAnimations())
      this.transitionStatus.value = 'ending'

    // Wait for the closed state (`data-state`, `data-ending-style`) to be
    // rendered: `getAnimations()` flushes styles, so the exit transitions and
    // animations it starts are already listed.
    this.exitPending = true
    await nextTick()
    if (currentRun !== this.run)
      return
    this.exitPending = false
    if (this.settlePendingExit())
      return
    this.dispatch('ANIMATION_OUT')
    this.whenAnimationsFinish(currentRun, () => this.finishExit())
  }

  /**
   * The node watcher. The node can go away while its exit is still suspended
   * (a parent `v-if`, an `as` swap): there is nothing left to wait for.
   */
  onNodeChange(newNode: HTMLElement | undefined) {
    if (!newNode && this.state.value === 'unmountSuspended') {
      this.cancelPending()
      this.finishExit()
    }
  }
}
