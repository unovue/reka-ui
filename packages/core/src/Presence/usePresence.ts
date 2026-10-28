import type { Ref } from 'vue'
import { isClient } from '@vueuse/shared'
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useStateMachine } from '@/shared'

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
 */
export function usePresence(
  present: Ref<boolean>,
  node: Readonly<Ref<HTMLElement | undefined>>,
  options: UsePresenceOptions = {},
) {
  const { state, dispatch } = useStateMachine(present.value ? 'mounted' : 'unmounted', {
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
  })
  const transitionStatus = ref<PresenceTransitionStatus>()

  // Every `present` change starts a new run; async work from an older run
  // (a pending frame, a pending `finished` promise) checks it and bails out.
  let run = 0
  let frame: number | undefined
  // A close whose rendered state has not been checked for animations yet.
  let exitPending = false

  const dispatchCustomEvent = (name: 'enter' | 'after-enter' | 'leave' | 'after-leave') => {
    // We only dispatch this event because CustomEvent is not available in Node18
    // https://github.com/unovue/reka-ui/issues/930
    if (isClient) {
      const customEvent = new CustomEvent(name, { bubbles: false, cancelable: false })
      node.value?.dispatchEvent(customEvent)
    }
  }

  function cancelPending() {
    run++
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
      frame = undefined
    }
  }

  /**
   * Calls `done` once the node has no running transition or animation. A
   * rejected `finished` (an animation cancelled because a property it depends
   * on changed) re-checks instead of resolving, so a replacement transition is
   * waited for too (Base UI's `treatAbortedAsFinished = false`).
   */
  function whenAnimationsFinish(currentRun: number, done: () => void) {
    const element = node.value
    if (!element || !supportsAnimations(element))
      return done()
    const running = getRunningAnimations(element)
    if (!running.length)
      return done()
    const recheck = () => {
      if (currentRun === run)
        whenAnimationsFinish(currentRun, done)
    }
    // `.then(noop)` so the joined promise does not resolve to (and retain) the
    // finished Animation objects (Base UI #5719).
    Promise.all(running.map(animation => animation.finished.then(noop))).then(recheck, recheck)
  }

  // Nothing animates on the server: the immediate watcher still runs during
  // SSR, but the completion must only be reported by the client.
  const notifyComplete = (value: boolean) => {
    if (isClient)
      options.onComplete?.(value)
  }

  function finishEnter() {
    dispatchCustomEvent('after-enter')
    notifyComplete(true)
  }

  function finishExit() {
    dispatch(state.value === 'unmountSuspended' ? 'ANIMATION_END' : 'UNMOUNT')
    transitionStatus.value = undefined
    dispatchCustomEvent('after-leave')
    notifyComplete(false)
  }

  /**
   * Looks at the rendered closed state: with nothing running, the exit is done
   * right away (returns `true`); otherwise the caller decides what to wait for.
   */
  function settlePendingExit() {
    dispatchCustomEvent('leave')
    const element = node.value
    if (element && supportsAnimations(element) && getRunningAnimations(element).length)
      return false
    finishExit()
    return true
  }

  watch(
    present,
    async (currentPresent, prevPresent) => {
      // Closed and reopened before the closed state was checked for exit
      // animations: settle that close first, so a node with nothing to wait for
      // still goes through a full unmount/mount cycle.
      if (currentPresent && exitPending)
        settlePendingExit()
      exitPending = false
      cancelPending()
      const currentRun = run
      const isInitial = prevPresent === undefined

      if (currentPresent) {
        // Base UI stamps the starting style only when an unmounted popup opens:
        // not on the initial render (unless `appear`), and not when reopening
        // mid-exit (the exit transition reverses from wherever it is).
        const startsFromUnmounted = isInitial ? !!options.appear : state.value === 'unmounted'
        transitionStatus.value = startsFromUnmounted && supportsAnimations() ? 'starting' : undefined

        await nextTick()
        if (currentRun !== run)
          return
        dispatch('MOUNT')
        dispatchCustomEvent('enter')

        if (transitionStatus.value !== 'starting')
          return whenAnimationsFinish(currentRun, finishEnter)

        frame = requestAnimationFrame(() => {
          frame = undefined
          // Resolve styles while the starting style is still applied, so it is
          // the before-change style of the transitions even if nothing has read
          // styles since the node was inserted.
          if (node.value)
            void getComputedStyle(node.value).transitionProperty
          transitionStatus.value = undefined
          nextTick(() => {
            if (currentRun === run)
              whenAnimationsFinish(currentRun, finishEnter)
          })
        })
        return
      }

      if (isInitial || state.value === 'unmounted') {
        transitionStatus.value = undefined
        return
      }

      if (supportsAnimations())
        transitionStatus.value = 'ending'

      // Wait for the closed state (`data-state`, `data-ending-style`) to be
      // rendered: `getAnimations()` flushes styles, so the exit transitions and
      // animations it starts are already listed.
      exitPending = true
      await nextTick()
      if (currentRun !== run)
        return
      exitPending = false
      if (settlePendingExit())
        return
      dispatch('ANIMATION_OUT')
      whenAnimationsFinish(currentRun, finishExit)
    },
    { immediate: true },
  )

  // The node can go away while its exit is still suspended (a parent `v-if`,
  // an `as` swap): there is nothing left to wait for.
  watch(node, (newNode) => {
    if (!newNode && state.value === 'unmountSuspended') {
      cancelPending()
      finishExit()
    }
  })

  onScopeDispose(cancelPending)

  const isPresent = computed(() =>
    state.value === 'mounted' || state.value === 'unmountSuspended',
  )

  return {
    isPresent,
    transitionStatus,
  }
}
