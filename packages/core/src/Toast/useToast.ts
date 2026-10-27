import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { GlobalToastManager, ToastObject } from './createToastManager'
import type { ToastProviderContext, ToastStackEntry, ToastStackState } from './ToastProvider.vue'
import type { ToastStore } from './useToastStore'
import type { SwipeDirection, SwipeEvent } from './utils'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { onKeyStroke, useRafFn } from '@vueuse/core'
import { isClient } from '@vueuse/shared'
import { computed, getCurrentScope, onMounted, onScopeDispose, ref, shallowReactive, toValue, watch, watchEffect } from 'vue'
import { focusFirst, getTabbableCandidates } from '@/FocusScope/utils'
import { createPartSurface, disclosureState, getActiveElement, useControllableState } from '@/shared'
import { TOAST_MANAGER_SUBSCRIBE } from './createToastManager'
import { useToastStore } from './useToastStore'
import {
  handleAndDispatchCustomEvent,
  isDeltaInDirection,
  TOAST_SWIPE_CANCEL,
  TOAST_SWIPE_END,
  TOAST_SWIPE_MOVE,
  TOAST_SWIPE_START,
  VIEWPORT_PAUSE,
  VIEWPORT_RESUME,
} from './utils'

// =============================================================================
// Headless composables for the Toast family — issues #2723 and #2825.
//
// A toast's `open` state is ONE controllable model (`useToastRoot`): the
// auto-dismiss timeout, the close button, an action, a swipe, Escape and a
// programmatic close all go through one `setState`, so `beforeUpdate:open` can
// cancel any of them and `update:open` carries the reason (#2828). A toast
// from the manager (`toast` prop) reads its `open` from the manager's store,
// and a committed close is written back to the store, so declarative and
// managed toasts share the same close path, timer and reasons.
//
// The rest of the family is split by behaviour rather than by part:
// `useToastProvider` (shared state + the `createToastManager()` bridge),
// `useToastTimer` (auto-dismiss with pause/resume), `useToastSwipe` (the swipe
// gesture and its CSS variables) and `useToastViewport` (the hotkey, the
// pause on hover/focus/window blur and the reversed tab order). The announce
// live region, Collection, Teleport, Presence and the focus proxies stay in
// the shells.
// =============================================================================

/**
 * Why a toast's `open` state changed (#2828); the `reason` of `ChangeEventDetails`.
 *
 * - `timeout`: the auto-dismiss `duration` elapsed.
 * - `close-press`: `ToastClose` was activated.
 * - `action-press`: `ToastAction` was activated (with `closeOnClick`).
 * - `swipe`: a swipe passed `swipeThreshold` in `swipeDirection`.
 * - `escape-key`: Escape was pressed.
 */
export type ToastOpenChangeReason
  = | 'timeout'
    | 'close-press'
    | 'action-press'
    | 'swipe'
    | 'escape-key'

type ChangeReason = ToastOpenChangeReason | BaseChangeReason

/** Semantic state of a toast; `data-state`, `data-swipe-direction`, `data-status`, `data-expanded`, `data-limited`. */
export type ToastRootState = {
  state: DisclosureState
  swipeDirection: SwipeDirection
  status: string | undefined
  expanded: boolean
  limited: boolean
}

/** Semantic state of the viewport list; `data-expanded`. */
export type ToastViewportState = { expanded: boolean }

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export interface UseToastProviderProps {
  /** Label announced before each toast. @defaultValue `'Notification'` */
  label?: MaybeRefOrGetter<string | undefined>
  /** Auto-dismiss time (ms) of each toast. @defaultValue `5000` */
  duration?: MaybeRefOrGetter<number | undefined>
  /** Disables swipe to close. @defaultValue `false` */
  disableSwipe?: MaybeRefOrGetter<boolean | undefined>
  /** Direction of the closing swipe. @defaultValue `'right'` */
  swipeDirection?: MaybeRefOrGetter<SwipeDirection | undefined>
  /** Distance (px) a swipe must pass to close. @defaultValue `50` */
  swipeThreshold?: MaybeRefOrGetter<number | undefined>
  /** Maximum number of toasts shown at once; older ones get `data-limited` and `inert`. */
  limit?: MaybeRefOrGetter<number | undefined>
  /** A manager from `createToastManager()`; its toasts are added to this provider's list. */
  toastManager?: MaybeRefOrGetter<GlobalToastManager | undefined>
}

export interface UseToastProviderReturn {
  /** The toasts added through the manager, newest first. */
  toasts: ToastStore['toasts']
  /** The `ToastProviderContext` — the SFC provides this verbatim. */
  context: ToastProviderContext
}

/**
 * Headless ToastProvider logic: the shared duration, swipe and label
 * settings, the toast count, the pause flag, the stacking order with `limit`,
 * and the store behind `useToastManager()`. A manager from
 * `createToastManager()` is subscribed on mount (never during SSR, where a
 * module-level manager would be shared between requests).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the manager subscription is bound to the calling component.
 */
export function useToastProvider(props: UseToastProviderProps = {}): UseToastProviderReturn {
  const label = computed(() => toValue(props.label) ?? 'Notification')
  const duration = computed(() => toValue(props.duration) ?? 5000)
  const disableSwipe = computed(() => toValue(props.disableSwipe) ?? false)
  const swipeDirection = computed<SwipeDirection>(() => toValue(props.swipeDirection) ?? 'right')
  const swipeThreshold = computed(() => toValue(props.swipeThreshold) ?? 50)

  const viewport = ref<HTMLElement>()
  const toastCount = ref(0)
  const isClosePausedRef = ref(false)

  const toastStore = useToastStore()

  onMounted(() => {
    // Subscribe on mount only: a module-level manager outlives SSR requests.
    watch(() => toValue(props.toastManager), (manager, _, onCleanup) => {
      if (!manager)
        return
      const unsubscribe = manager[TOAST_MANAGER_SUBSCRIBE]((event) => {
        if (event.action === 'add')
          toastStore.add(event.options)
        else if (event.action === 'close')
          toastStore.close(event.id)
        else
          toastStore.update(event.id, event.updates)
      })
      onCleanup(unsubscribe)
    }, { immediate: true })
  })

  const entries = shallowReactive<ToastStackEntry[]>([])
  let seq = 0

  const stack = computed(() => {
    const limit = toValue(props.limit)
    const ordered = [...entries].sort((a, b) => b.seq - a.seq)
    const states = new Map<ToastStackEntry, ToastStackState>()
    let visibleIndex = 0
    let offsetY = 0
    ordered.forEach((entry, index) => {
      const closing = !entry.open
      states.set(entry, {
        index: closing ? index : visibleIndex,
        offsetY,
        limited: !closing && limit !== undefined && visibleIndex >= limit,
      })
      if (!closing) {
        offsetY += entry.height
        visibleIndex++
      }
    })
    return { ordered, states }
  })

  const hovering = ref(false)
  const focused = ref(false)

  const context: ToastProviderContext = {
    label,
    duration,
    disableSwipe,
    swipeDirection,
    swipeThreshold,
    toastCount,
    viewport,
    onViewportChange(el) {
      viewport.value = el
    },
    onToastAdd() {
      toastCount.value++
    },
    onToastRemove() {
      toastCount.value--
    },
    isClosePausedRef,
    toastStore,
    hovering,
    focused,
    expanded: computed(() => hovering.value || focused.value),
    frontmostHeight: computed(() => stack.value.ordered.find(entry => entry.open)?.height || undefined),
    closingCount: computed(() => entries.filter(entry => !entry.open).length),
    registerToast(entry) {
      entry.seq = ++seq
      entries.push(entry)
      return () => {
        const index = entries.indexOf(entry)
        if (index !== -1)
          entries.splice(index, 1)
      }
    },
    reopenToast(entry) {
      entry.seq = ++seq
    },
    getToastStack(entry) {
      return stack.value.states.get(entry) ?? { index: 0, offsetY: 0, limited: false }
    },
  }

  return { toasts: toastStore.toasts, context }
}

// -----------------------------------------------------------------------------
// Root (the open model)
// -----------------------------------------------------------------------------

export interface UseToastRootProps {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `true` */
  defaultOpen?: boolean
  /**
   * A toast from the manager. Its `open` drives the model, and a committed
   * close is written back to the manager's store.
   */
  toast?: MaybeRefOrGetter<ToastObject | undefined>
  /** The manager's store (`injectToastProviderContext().toastStore`); required for `toast`. */
  toastStore?: Pick<ToastStore, 'commitClose' | 'registerCloseRequest'>
  /** `type` of the toast when it has no `toast.type`. @defaultValue `'foreground'` */
  type?: MaybeRefOrGetter<'foreground' | 'background' | undefined>
  /** `duration` of the toast when it has no `toast.duration`; `undefined` uses the provider's. */
  duration?: MaybeRefOrGetter<number | undefined>
  /** Component `emit`; receives `beforeUpdate:open` then `update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<ToastOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<ToastOpenChangeReason>) => void
}

export interface UseToastRootReturn {
  /** Whether the toast is open (the manager's `toast.open` for a managed toast). */
  open: ComputedRef<boolean>
  /** `toast.type`, else the `type` prop. */
  type: ComputedRef<'foreground' | 'background'>
  /** `Infinity` while a managed toast is `loading`, else `toast.duration`, else the `duration` prop. */
  duration: ComputedRef<number | undefined>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: ChangeReason, event?: Event) => boolean
  /** Closes the toast. Returns `false` when it was already closed or the close was cancelled. */
  close: (reason?: ChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ToastOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
}

/**
 * Headless ToastRoot model: the controllable `open` state and the close every
 * dismissal goes through. A managed toast is controlled by the manager's
 * store: `beforeUpdate:open` / `update:open` still fire, and a committed close
 * is written back with `toastStore.commitClose(id, details)` (which calls
 * `toast.onClose(details)`). Called inside a scope, it also registers with the
 * store so `manager.close(id)` closes through this model with
 * `'imperative-action'` (cancellable via `beforeUpdate:open`).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the store registration of a managed toast is bound to the calling scope; callable outside a scope without it.
 */
export function useToastRoot(props: UseToastRootProps = {}): UseToastRootReturn {
  const toast = computed(() => toValue(props.toast))

  const { state: open, setState, lastChangeDetails, isControlled } = useControllableState<boolean, ToastOpenChangeReason>({
    prop: () => toast.value ? toast.value.open : toValue(props.open),
    defaultValue: props.defaultOpen ?? true,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const type = computed(() => toast.value?.type ?? toValue(props.type) ?? 'foreground')
  const duration = computed(() => toast.value?.status === 'loading'
    ? Number.POSITIVE_INFINITY
    : toast.value?.duration ?? toValue(props.duration))

  function onOpenChange(value: boolean, reason?: ChangeReason, event?: Event): boolean {
    const managed = toast.value
    const changed = setState(value, reason, event)
    if (changed && managed && !value)
      props.toastStore?.commitClose(managed.id, lastChangeDetails.value)
    return changed
  }

  // `manager.close(id)` asks this root, so an imperative close of a rendered
  // toast runs `beforeUpdate:open` / `update:open` like every other close.
  if (getCurrentScope()) {
    watch(() => toast.value?.id, (id, _, onCleanup) => {
      if (id && props.toastStore)
        onCleanup(props.toastStore.registerCloseRequest(id, reason => onOpenChange(false, reason)))
    }, { immediate: true })
  }

  return {
    open,
    type,
    duration,
    onOpenChange,
    close: (reason = 'imperative-action', event) => onOpenChange(false, reason, event),
    lastChangeDetails,
    isControlled,
  }
}

// -----------------------------------------------------------------------------
// Timer
// -----------------------------------------------------------------------------

export interface UseToastTimerOptions {
  /** Whether the toast is open; the timer (re)starts when it opens. */
  open: MaybeRefOrGetter<boolean>
  /** Auto-dismiss time (ms). `0`, a negative value or `Infinity` keeps the toast open. */
  duration: MaybeRefOrGetter<number>
  /** A value that restarts the timer when it changes (a managed toast added again with the same id). */
  restartKey?: MaybeRefOrGetter<unknown>
  /** Whether the timer starts paused (the viewport is hovered or focused). */
  isPaused?: () => boolean
  /**
   * Called when the time is up. If the toast is still open afterwards (its
   * close was cancelled, or a controlled parent ignored it), the timer re-arms
   * with the full `duration`, so the toast asks again later; pause and resume
   * work on the re-armed timer as before.
   */
  onTimeout: () => unknown
  /** Called when the timer pauses. */
  onPause?: () => void
  /** Called when the timer resumes. */
  onResume?: () => void
}

export interface UseToastTimerReturn {
  /** Time left (ms), updated every frame while running. */
  remaining: Ref<number>
  /** Stops the timer and keeps the time left. */
  pause: () => void
  /** Restarts the timer with the time left. */
  resume: () => void
}

/**
 * Headless auto-dismiss timer of a toast, with the pause / resume that
 * `ToastViewport` triggers on hover, focus and window blur.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the frame loop and the pending timeout are bound to the calling scope.
 */
export function useToastTimer(options: UseToastTimerOptions): UseToastTimerReturn {
  const duration = computed(() => toValue(options.duration))

  const closeTimerStartTimeRef = ref(0)
  const closeTimerRemainingTimeRef = ref(duration.value)
  // Global timers (not `window.*`): the watch below runs immediately, also during SSR.
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  const remainingTime = ref(duration.value)

  const remainingRaf = useRafFn(() => {
    const elapsedTime = Date.now() - closeTimerStartTimeRef.value
    remainingTime.value = Math.max(closeTimerRemainingTimeRef.value - elapsedTime, 0)
  }, { fpsLimit: 60 })

  function handleTimeout() {
    options.onTimeout()
    // Still open: the close was cancelled, or a controlled parent has not
    // closed it (yet). Re-arm a full `duration` so the toast asks again later;
    // a controlled close that lands on the next flush clears it in the watch
    // below. A committed uncontrolled close is already reflected in `open`.
    if (toValue(options.open)) {
      closeTimerRemainingTimeRef.value = duration.value
      startTimer(duration.value)
    }
  }

  function startTimer(duration: number) {
    if (duration <= 0 || duration === Number.POSITIVE_INFINITY)
      return
    // startTimer is used inside a watch with immediate set to true.
    // This results in code execution during SSR.
    // Ensure this code only runs in a browser environment
    if (!isClient)
      return
    clearTimeout(closeTimer)
    closeTimerStartTimeRef.value = Date.now()
    closeTimer = setTimeout(handleTimeout, duration)
  }

  function resume() {
    startTimer(closeTimerRemainingTimeRef.value)
    remainingRaf.resume()
    options.onResume?.()
  }

  function pause() {
    const elapsedTime = Date.now() - closeTimerStartTimeRef.value
    closeTimerRemainingTimeRef.value = closeTimerRemainingTimeRef.value - elapsedTime
    clearTimeout(closeTimer)
    remainingRaf.pause()
    options.onPause?.()
  }

  // start timer when toast opens or duration changes.
  // we include `open` in deps because closed !== unmounted when animating
  // so it could reopen before being completely unmounted
  watch([() => toValue(options.open), duration, () => toValue(options.restartKey)], () => {
    // Reset the timer when the toast is rerendered with the new duration; a
    // closed toast keeps no pending timeout.
    clearTimeout(closeTimer)
    closeTimerRemainingTimeRef.value = duration.value

    if (toValue(options.open) && !options.isPaused?.()) {
      remainingRaf.resume()
      startTimer(duration.value)
    }
  }, { immediate: true })

  if (getCurrentScope())
    onScopeDispose(() => clearTimeout(closeTimer))

  return { remaining: remainingTime, pause, resume }
}

// -----------------------------------------------------------------------------
// Swipe
// -----------------------------------------------------------------------------

export interface UseToastSwipeOptions {
  /** Direction of the closing swipe. */
  swipeDirection: MaybeRefOrGetter<SwipeDirection>
  /** Distance (px) a swipe must pass to close. */
  swipeThreshold: MaybeRefOrGetter<number>
  /** Disables the gesture. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Component `emit`; receives `swipeStart`, `swipeMove`, `swipeCancel` and
   * `swipeEnd` before the default handling, so `event.preventDefault()` skips it.
   */
  emit?: (event: any, ...args: any[]) => void
  /**
   * Called when a swipe passes the threshold. Return `false` when the toast
   * stayed open (its close was cancelled): the toast then snaps back as for a
   * cancelled swipe.
   */
  onSwipeEnd: (event: PointerEvent) => boolean
}

export interface UseToastSwipeReturn {
  /** `onPointerdown` / `onPointermove` / `onPointerup` + `user-select` / `touch-action`. */
  swipe: PartSurface<Record<string, never>>
}

function setSwipeState(target: HTMLElement, state: 'start' | 'move' | 'cancel' | 'end', delta?: { x: number, y: number }) {
  target.setAttribute('data-swipe', state)
  if (state === 'move') {
    target.style.setProperty('--reka-toast-swipe-move-x', `${delta!.x}px`)
    target.style.setProperty('--reka-toast-swipe-move-y', `${delta!.y}px`)
  }
  else if (state === 'cancel') {
    target.style.removeProperty('--reka-toast-swipe-move-x')
    target.style.removeProperty('--reka-toast-swipe-move-y')
    target.style.removeProperty('--reka-toast-swipe-end-x')
    target.style.removeProperty('--reka-toast-swipe-end-y')
  }
  else if (state === 'end') {
    target.style.removeProperty('--reka-toast-swipe-move-x')
    target.style.removeProperty('--reka-toast-swipe-move-y')
    target.style.setProperty('--reka-toast-swipe-end-x', `${delta!.x}px`)
    target.style.setProperty('--reka-toast-swipe-end-y', `${delta!.y}px`)
  }
}

/**
 * Headless swipe-to-close gesture of a toast. While the pointer moves in
 * `swipeDirection` the toast gets `data-swipe="move"` and the
 * `--reka-toast-swipe-move-x` / `-y` variables; on release past
 * `swipeThreshold` it gets `data-swipe="end"` with `--reka-toast-swipe-end-x` /
 * `-y` and closes (reason `swipe`), otherwise `data-swipe="cancel"`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useToastSwipe(options: UseToastSwipeOptions): UseToastSwipeReturn {
  const disabled = computed(() => toValue(options.disabled) ?? false)
  let pointerStart: { x: number, y: number } | null = null
  let swipeDelta: { x: number, y: number } | null = null

  // Hands the swipe event to the consumer first; the default handling runs
  // unless they called `event.preventDefault()`.
  function dispatch(name: string, emitName: string, detail: { originalEvent: PointerEvent, delta: { x: number, y: number } }) {
    return handleAndDispatchCustomEvent(name, (ev: SwipeEvent) => options.emit?.(emitName, ev), detail)
  }

  function onPointerdown(event: PointerEvent) {
    // `@pointerdown.left`
    if (event.button !== 0 || disabled.value)
      return
    pointerStart = { x: event.clientX, y: event.clientY }
  }

  function onPointermove(event: PointerEvent) {
    if (disabled.value || !pointerStart)
      return

    const swipeDirection = toValue(options.swipeDirection)
    const x = event.clientX - pointerStart.x
    const y = event.clientY - pointerStart.y
    const hasSwipeMoveStarted = Boolean(swipeDelta)
    const isHorizontalSwipe = ['left', 'right'].includes(swipeDirection)
    const clamp = ['left', 'up'].includes(swipeDirection)
      ? Math.min
      : Math.max
    const clampedX = isHorizontalSwipe ? clamp(0, x) : 0
    const clampedY = !isHorizontalSwipe ? clamp(0, y) : 0
    const moveStartBuffer = event.pointerType === 'touch' ? 10 : 2
    const delta = { x: clampedX, y: clampedY }
    const eventDetail = { originalEvent: event, delta }
    const target = event.currentTarget as HTMLElement
    if (hasSwipeMoveStarted) {
      swipeDelta = delta
      if (!dispatch(TOAST_SWIPE_MOVE, 'swipeMove', eventDetail).defaultPrevented)
        setSwipeState(target, 'move', delta)
    }
    else if (isDeltaInDirection(delta, swipeDirection, moveStartBuffer)) {
      swipeDelta = delta
      if (!dispatch(TOAST_SWIPE_START, 'swipeStart', eventDetail).defaultPrevented)
        setSwipeState(target, 'start')
      ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    }
    else if (Math.abs(x) > moveStartBuffer || Math.abs(y) > moveStartBuffer) {
      // User is swiping in wrong direction so we disable swipe gesture
      // for the current pointer down interaction
      pointerStart = null
    }
  }

  function onPointerup(event: PointerEvent) {
    if (disabled.value)
      return

    const delta = swipeDelta
    const target = event.target as HTMLElement
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
    swipeDelta = null
    pointerStart = null
    if (delta) {
      const toast = event.currentTarget as HTMLElement
      const eventDetail = { originalEvent: event, delta }
      if (
        isDeltaInDirection(delta, toValue(options.swipeDirection), toValue(options.swipeThreshold))
      ) {
        if (!dispatch(TOAST_SWIPE_END, 'swipeEnd', eventDetail).defaultPrevented) {
          setSwipeState(toast, 'end', delta)
          // A cancelled close snaps the toast back.
          if (!options.onSwipeEnd(event))
            setSwipeState(toast, 'cancel')
        }
      }
      else {
        if (!dispatch(TOAST_SWIPE_CANCEL, 'swipeCancel', eventDetail).defaultPrevented)
          setSwipeState(toast, 'cancel')
      }
      // Prevent click event from triggering on items within the toast when
      // pointer up is part of a swipe gesture
      toast?.addEventListener('click', event => event.preventDefault(), {
        once: true,
      })
    }
  }

  return {
    swipe: createPartSurface<Record<string, never>>(
      () => ({
        style: disabled.value ? undefined : { userSelect: 'none', touchAction: 'none' },
        onPointerdown,
        onPointermove,
        onPointerup,
      }),
      () => ({}),
    ),
  }
}

/**
 * The attrs of the rendered toast (`tabindex`, `data-*`, `inert` and the
 * stacking CSS variables), derived from the provider and the toast's stack
 * entry. Shared by `ToastRootImpl.vue`.
 * @internal
 */
export function getToastSurface(options: {
  providerContext: ToastProviderContext
  open: () => boolean
  status: () => string | undefined
  stack: () => ToastStackState
  height: () => number
}): PartSurface<ToastRootState> {
  const { providerContext } = options
  return createPartSurface<ToastRootState>(
    () => ({
      tabindex: '0',
      inert: options.stack().limited || undefined,
      style: {
        '--reka-toast-index': options.stack().index,
        '--reka-toast-offset-y': `${options.stack().offsetY}px`,
        '--reka-toast-height': options.height() ? `${options.height()}px` : undefined,
      },
    }),
    () => ({
      state: disclosureState(options.open()),
      swipeDirection: providerContext.swipeDirection.value,
      status: options.status(),
      expanded: providerContext.expanded.value,
      limited: options.stack().limited,
    }),
  )
}

/**
 * The close button surface: a click calls `onClose(event, 'close-press')`.
 * It does not move focus itself; `ToastRootContext.onClose` moves focus to
 * the viewport after a committed keyboard close.
 * @internal
 */
export function getToastCloseSurface(onClose: (event?: Event, reason?: ChangeReason) => void): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ onClick: (event: MouseEvent) => onClose(event, 'close-press') }),
    () => ({}),
  )
}

// -----------------------------------------------------------------------------
// Viewport
// -----------------------------------------------------------------------------

export interface UseToastViewportOptions {
  /** The provider context (`injectToastProviderContext()`). */
  providerContext: ToastProviderContext
  /** The viewport list element. */
  viewportElement: Ref<HTMLElement | undefined | null>
  /** Keys that move focus to the viewport. Read once. @defaultValue `['F8']` */
  hotkey?: string[]
  /** Region label; `{hotkey}` is replaced. @defaultValue `'Notifications ({hotkey})'` */
  label?: MaybeRefOrGetter<string | ((hotkey: string) => string) | undefined>
  /** The toast elements, oldest first (the SFC hands its collection). */
  getToasts: () => HTMLElement[]
  /** The focus proxy before the list, focused when tabbing backwards out of the viewport. */
  headFocusProxy: Ref<HTMLElement | undefined>
  /** The focus proxy after the list, focused when tabbing forwards out of the viewport. */
  tailFocusProxy: Ref<HTMLElement | undefined>
}

export interface UseToastViewportReturn {
  /** Whether any toast is mounted. */
  hasToasts: ComputedRef<boolean>
  /** `role="region"` / `aria-label` / `tabindex` of the landmark wrapping the list. */
  region: PartSurface<Record<string, never>>
  /** `tabindex` + `--reka-toast-frontmost-height` of the list; `data-expanded`. */
  viewport: PartSurface<ToastViewportState>
  /** `focus` handler of the head proxy: focus entering from before the viewport goes to the newest toast. */
  onHeadProxyFocus: () => void
  /** `focus` handler of the tail proxy: focus entering from after the viewport goes to the oldest toast's last tabbable. */
  onTailProxyFocus: () => void
}

/**
 * Headless ToastViewport logic: the hotkey that focuses the viewport, the
 * pause of every toast timer while the pointer is over the viewport, focus is
 * inside it or the window is blurred, the expanded state, and the tab order
 * that runs from the newest toast to the oldest.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the hotkey and viewport listeners are bound to the calling component.
 */
export function useToastViewport(options: UseToastViewportOptions): UseToastViewportReturn {
  const { providerContext, viewportElement: currentElement, headFocusProxy, tailFocusProxy } = options
  const hotkey = options.hotkey ?? ['F8']
  const hasToasts = computed(() => providerContext.toastCount.value > 0)

  const KEY_RE = /Key/g
  const DIGIT_RE = /Digit/g
  const hotkeyMessage = hotkey.join('+').replace(KEY_RE, '').replace(DIGIT_RE, '')
  const label = computed(() => {
    const value = toValue(options.label) ?? 'Notifications ({hotkey})'
    return typeof value === 'string' ? value.replace('{hotkey}', hotkeyMessage) : value(hotkeyMessage)
  })

  onKeyStroke(hotkey, () => {
    currentElement.value?.focus()
  })

  onMounted(() => {
    providerContext.onViewportChange(currentElement.value!)
  })

  // Collapse only once closing toasts have finished animating, so the stack does not
  // shift under the pointer while a toast is dismissed.
  const pendingPointerLeave = ref(false)
  watch([pendingPointerLeave, providerContext.closingCount], ([pending, closingCount]) => {
    if (pending && closingCount === 0) {
      providerContext.hovering.value = false
      pendingPointerLeave.value = false
    }
  })

  watch(hasToasts, (value) => {
    if (!value) {
      providerContext.hovering.value = false
      providerContext.focused.value = false
      pendingPointerLeave.value = false
    }
  })

  function getSortedTabbableCandidates({ tabbingDirection }: { tabbingDirection: 'forwards' | 'backwards' }) {
    const toastItems = options.getToasts()
    const tabbableCandidates = toastItems.map((toastNode) => {
      const toastTabbableCandidates = [toastNode, ...getTabbableCandidates(toastNode)]
      return tabbingDirection === 'forwards'
        ? toastTabbableCandidates
        : toastTabbableCandidates.reverse()
    })
    return (
      tabbingDirection === 'forwards' ? tabbableCandidates.reverse() : tabbableCandidates
    ).flat()
  }

  watchEffect((cleanupFn) => {
    const viewport = currentElement.value
    if (hasToasts.value && viewport) {
      const handlePause = () => {
        if (!providerContext.isClosePausedRef.value) {
          const pauseEvent = new CustomEvent(VIEWPORT_PAUSE)
          viewport.dispatchEvent(pauseEvent)
          providerContext.isClosePausedRef.value = true
        }
      }

      const handleResume = () => {
        if (providerContext.isClosePausedRef.value) {
          const resumeEvent = new CustomEvent(VIEWPORT_RESUME)
          viewport.dispatchEvent(resumeEvent)
          providerContext.isClosePausedRef.value = false
        }
      }

      const handleFocusOutResume = (event: FocusEvent) => {
        const isFocusMovingOutside = !viewport.contains(event.relatedTarget as HTMLElement)
        if (isFocusMovingOutside) {
          providerContext.focused.value = false
          handleResume()
        }
      }

      const handlePointerLeaveResume = () => {
        pendingPointerLeave.value = true
        const isFocusInside = viewport.contains(getActiveElement())
        if (!isFocusInside)
          handleResume()
      }

      const handlePointerMoveExpand = () => {
        pendingPointerLeave.value = false
        providerContext.hovering.value = true
      }

      const handleFocusInExpand = () => {
        providerContext.focused.value = true
      }

      // We programmatically manage tabbing as we are unable to influence
      // the source order with portals, this allows us to reverse the
      // tab order so that it runs from most recent toast to least
      const handleKeyDown = (event: KeyboardEvent) => {
        const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
        const isTabKey = event.key === 'Tab' && !isMetaKey

        if (isTabKey) {
          const focusedElement = getActiveElement()
          const isTabbingBackwards = event.shiftKey
          const targetIsViewport = event.target === viewport

          // If we're back tabbing after jumping to the viewport then we simply
          // proxy focus out to the preceding document
          if (targetIsViewport && isTabbingBackwards) {
            headFocusProxy.value?.focus()
            return
          }

          const tabbingDirection = isTabbingBackwards ? 'backwards' : 'forwards'
          const sortedCandidates = getSortedTabbableCandidates({ tabbingDirection })
          const index = sortedCandidates.findIndex(candidate => candidate === focusedElement)
          if (focusFirst(sortedCandidates.slice(index + 1))) {
            event.preventDefault()
          }
          else {
            // If we can't focus that means we're at the edges so we
            // proxy to the corresponding exit point and let the browser handle
            // tab/shift+tab keypress and implicitly pass focus to the next valid element in the document
            isTabbingBackwards
              ? headFocusProxy.value?.focus()
              : tailFocusProxy.value?.focus()
          }
        }
      }

      viewport.addEventListener('focusin', handlePause)
      viewport.addEventListener('focusin', handleFocusInExpand)
      viewport.addEventListener('focusout', handleFocusOutResume)
      viewport.addEventListener('pointermove', handlePause)
      viewport.addEventListener('pointermove', handlePointerMoveExpand)
      viewport.addEventListener('pointerleave', handlePointerLeaveResume)
      viewport.addEventListener('keydown', handleKeyDown)
      window.addEventListener('blur', handlePause)
      window.addEventListener('focus', handleResume)

      cleanupFn(() => {
        viewport.removeEventListener('focusin', handlePause)
        viewport.removeEventListener('focusin', handleFocusInExpand)
        viewport.removeEventListener('focusout', handleFocusOutResume)
        viewport.removeEventListener('pointermove', handlePause)
        viewport.removeEventListener('pointermove', handlePointerMoveExpand)
        viewport.removeEventListener('pointerleave', handlePointerLeaveResume)
        viewport.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('blur', handlePause)
        window.removeEventListener('focus', handleResume)
      })
    }
  })

  return {
    hasToasts,
    region: createPartSurface<Record<string, never>>(
      () => ({
        'role': 'region',
        'aria-label': label.value,
        'tabindex': '-1',
        // incase list has size when empty (e.g. padding), we remove pointer events so
        // it doesn't prevent interactions with page elements that it overlays
        'style': { pointerEvents: hasToasts.value ? undefined : 'none' },
      }),
      () => ({}),
    ),
    viewport: createPartSurface<ToastViewportState>(
      () => ({
        tabindex: '-1',
        style: {
          '--reka-toast-frontmost-height': providerContext.frontmostHeight.value
            ? `${providerContext.frontmostHeight.value}px`
            : undefined,
        },
      }),
      () => ({ expanded: providerContext.expanded.value }),
    ),
    onHeadProxyFocus: () => {
      focusFirst(getSortedTabbableCandidates({ tabbingDirection: 'forwards' }))
    },
    onTailProxyFocus: () => {
      focusFirst(getSortedTabbableCandidates({ tabbingDirection: 'backwards' }))
    },
  }
}
