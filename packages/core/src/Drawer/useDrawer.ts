import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DrawerProviderContext } from './DrawerProvider.vue'
import type {
  DrawerModal,
  DrawerOpenChangeReason,
  DrawerRootContext,
  DrawerSnapPointChangeReason,
} from './DrawerRoot.vue'
import type { DrawerSnapPoint, SwipeDirection } from './utils'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import { isOwnBackdropPress } from '@/DismissableLayer/internalBackdrop'
import { focus } from '@/FocusScope/utils'
import { createPartSurface, disclosureState, getActiveElement, getElementByIdFrom, isHTMLElement, useControllableState } from '@/shared'
import { useDrawerSnapPoints } from './composables/useDrawerSnapPoints'
import { useSwipeDismiss } from './composables/useSwipeDismiss'
import {
  computeSwipeReleaseScalar,
  createNestedSwipeProgressStore,
  DRAWER_CSS_VARS,
  getDisplacement,
} from './utils'

// =============================================================================
// Headless composables for the Drawer (overlay) family — issue #2723.
//
// Drawer is ported from Base UI and must keep matching it exactly, so this is a
// pure EXTRACTION: the logic moved out of the SFCs verbatim.
//
// - `useDrawer()` is the state-only root (overlay-root contract): the open model,
//   the frozen `DrawerRootContext` value, and pure per-part surfaces
//   (`getDrawer<Part>Surface(context)`) shared by the part SFCs and the composable.
//   The open model keeps Base UI's contract: `update:open(value, details)` fires
//   BEFORE the change commits and `details.cancel()` inside it vetoes the change.
//   It is deliberately NOT `useControllableState` (whose cancel window is
//   `beforeUpdate:*` and whose controlled mode latches).
// - `useDrawerContent()` is the popup brain (snap points, swipe dismiss, dismiss
//   reasons, `openComplete` wiring, nested-drawer CSS vars). FocusScope /
//   DismissableLayer / Presence / `useHideOthers` stay in the SFCs.
// - `useDrawerSwipeArea()` is the swipe-to-open area.
//
// The DrawerProvider coupling (`watch(open)` → `setDrawerOpen`, `removeDrawer`
// on unmount) stays in `DrawerRoot.vue`; the provider and parent contexts are
// injected there and handed in.
// =============================================================================

/** Semantic state of the trigger part; `state` → `data-state="open|closed"`. */
export type DrawerTriggerState = { state: DisclosureState }
/** Semantic state of the handle part; `state` → `data-state`. */
export type DrawerGrabberState = { state: DisclosureState }
/** Semantic state of the viewport part; `state` → `data-state`. */
export type DrawerViewportState = { state: DisclosureState }
/** Semantic state of the overlay (backdrop) part → `data-state`, `data-swipe-direction`, `data-swiping`. */
export type DrawerOverlayState = { state: DisclosureState, swipeDirection: SwipeDirection, swiping: boolean }
/** Semantic state of the content (popup) part → `data-state`, `data-swipe-direction`, `data-swiping`, `data-nested-drawer-open`. */
export type DrawerContentState = {
  state: DisclosureState
  swipeDirection: SwipeDirection
  swiping: boolean
  nestedDrawerOpen: boolean
}
/** Semantic state of the swipe area part → `data-state`, `data-swipe-direction`. */
export type DrawerSwipeAreaState = { state: DisclosureState, swipeDirection: SwipeDirection }

/** Standalone `useDrawer()` calls without a `baseId` draw `reka-drawer-<n>` from here. */
let drawerCount = 0

// -----------------------------------------------------------------------------
// Pure part surfaces
// -----------------------------------------------------------------------------

/** Trigger: `aria-haspopup`/`aria-expanded`/`aria-controls` + `onClick` → `onOpenToggle()`. The tag-dependent `type` stays in the SFC. */
export function getDrawerTriggerSurface(
  context: Pick<DrawerRootContext, 'open' | 'contentId' | 'onOpenToggle'>,
): PartSurface<DrawerTriggerState> {
  return createPartSurface<DrawerTriggerState>(
    () => ({
      'aria-haspopup': 'dialog',
      'aria-expanded': context.open.value,
      'aria-controls': context.open.value ? context.contentId : undefined,
      'onClick': () => context.onOpenToggle(),
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** Close: `onClick` → `onOpenChange(false, 'close-press')`; renders no `data-*`. */
export function getDrawerCloseSurface(
  context: Pick<DrawerRootContext, 'onOpenChange'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ onClick: () => context.onOpenChange(false, 'close-press') }),
    () => ({}),
  )
}

/** Title: the `id` the content's `aria-labelledby` points at. */
export function getDrawerTitleSurface(
  context: Pick<DrawerRootContext, 'titleId'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(() => ({ id: context.titleId }), () => ({}))
}

/** Description: the `id` the content's `aria-describedby` points at. */
export function getDrawerDescriptionSurface(
  context: Pick<DrawerRootContext, 'descriptionId'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(() => ({ id: context.descriptionId }), () => ({}))
}

/** Grabber (the visual grab bar): decorative (`aria-hidden`) + `data-state`. */
export function getDrawerGrabberSurface(
  context: Pick<DrawerRootContext, 'open'>,
): PartSurface<DrawerGrabberState> {
  return createPartSurface<DrawerGrabberState>(
    () => ({ 'aria-hidden': 'true' }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** Viewport: the `data-drawer-viewport` functional selector + `data-state`. */
export function getDrawerViewportSurface(
  context: Pick<DrawerRootContext, 'open'>,
): PartSurface<DrawerViewportState> {
  return createPartSurface<DrawerViewportState>(
    // Functional selector for downstream CSS — lives in `props`, not state.
    () => ({ 'data-drawer-viewport': '' }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** Overlay (backdrop): state only; the body scroll lock and inline style stay in the SFC. */
export function getDrawerOverlaySurface(
  context: Pick<DrawerRootContext, 'open' | 'swipeDirection' | 'isSwiping'>,
): PartSurface<DrawerOverlayState> {
  return createPartSurface<DrawerOverlayState>(
    () => ({}),
    () => ({
      state: disclosureState(context.open.value),
      swipeDirection: context.swipeDirection.value,
      swiping: context.isSwiping.value,
    }),
  )
}

/** Content (popup): `id`/`role="dialog"`/aria links + the swipe/nesting state. `swiping` is the popup's own gesture. */
export function getDrawerContentSurface(
  context: Pick<DrawerRootContext, 'open' | 'contentId' | 'titleId' | 'descriptionId' | 'swipeDirection' | 'hasNestedDrawer'>,
  isSwiping: Readonly<Ref<boolean>> = ref(false),
): PartSurface<DrawerContentState> {
  return createPartSurface<DrawerContentState>(
    () => ({
      'id': context.contentId,
      'role': 'dialog',
      'aria-describedby': context.descriptionId,
      'aria-labelledby': context.titleId,
    }),
    () => ({
      state: disclosureState(context.open.value),
      swipeDirection: context.swipeDirection.value,
      swiping: isSwiping.value,
      nestedDrawerOpen: context.hasNestedDrawer.value,
    }),
  )
}

// -----------------------------------------------------------------------------
// useDrawer — state-only root
// -----------------------------------------------------------------------------

export interface UseDrawerProps {
  /** Controlled open state; a getter resolving to `undefined` is uncontrolled. */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /** @defaultValue `true` */
  modal?: MaybeRefOrGetter<DrawerModal | undefined>
  /** @defaultValue `'down'` */
  swipeDirection?: MaybeRefOrGetter<SwipeDirection | undefined>
  snapPoints?: MaybeRefOrGetter<DrawerSnapPoint[] | undefined>
  /** @defaultValue `false` */
  snapToSequentialPoints?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Controlled active snap point; a getter that has only resolved to `undefined`
   * is uncontrolled. A writable `Ref` with no `emit` / `onSnapPointUpdate` is
   * the model's single store (written back).
   */
  snapPoint?: MaybeRefOrGetter<DrawerSnapPoint | null | undefined>
  /** @deprecated Use `snapPoint`; a writable ref here is written back as before. */
  activeSnapPoint?: Ref<DrawerSnapPoint | null | undefined>
  /** Initial snap point when uncontrolled. @defaultValue `null` */
  defaultSnapPoint?: DrawerSnapPoint | null
  /**
   * Base id the content/title/description ids derive from. Defaults to
   * `reka-drawer-<n>` from a per-call counter, which is NOT stable across server
   * and client: SSR consumers must pass a stable `baseId` (the SFC hands its `useId`).
   */
  baseId?: string
  /**
   * Component `emit`; receives `beforeUpdate:open` then `update:open`, and
   * `beforeUpdate:snapPoint` then `update:snapPoint`.
   */
  emit?: (event: any, ...args: any[]) => void
  /**
   * Called before an open change commits (Base UI's `onOpenChange`); calling
   * `details.cancel()` keeps the current state.
   */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason>) => void
  /** Called after an open change committed. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason>) => void
  /**
   * Called before the active snap point changes (Base UI's `onSnapPointChange`);
   * calling `details.cancel()` keeps the current snap point. Cancelling the
   * `null` a swipe past the last snap point requests keeps the drawer open.
   */
  onBeforeSnapPointUpdate?: (value: DrawerSnapPoint | null, details: ChangeEventDetails<DrawerSnapPointChangeReason>) => void
  /** Called after the active snap point changed. */
  onSnapPointUpdate?: (value: DrawerSnapPoint | null, details: ChangeEventDetails<DrawerSnapPointChangeReason>) => void
  /** Called after the popup's enter/exit transition finishes (`update:openComplete`). */
  onOpenComplete?: (value: boolean) => void
  /** The parent drawer's context, for nested drawers. */
  parentContext?: DrawerRootContext | null
  /** The `DrawerProvider` context, when rendered inside one. */
  providerContext?: DrawerProviderContext | null
}

export interface UseDrawerReturn {
  open: ComputedRef<boolean>
  modal: ComputedRef<DrawerModal>
  swipeDirection: ComputedRef<SwipeDirection>
  activeSnapPoint: ComputedRef<DrawerSnapPoint | null | undefined>
  /** Returns `false` when cancelled via `beforeUpdate:open`; an unchanged value returns `true`. */
  onOpenChange: (value: boolean, reason?: DrawerOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when cancelled via `beforeUpdate:snapPoint`; an unchanged value returns `true`. */
  setActiveSnapPoint: (point: DrawerSnapPoint | null, reason?: DrawerSnapPointChangeReason | BaseChangeReason, event?: Event) => boolean
  onOpenToggle: () => void
  trigger: PartSurface<DrawerTriggerState>
  close: PartSurface<Record<string, never>>
  title: PartSurface<Record<string, never>>
  description: PartSurface<Record<string, never>>
  grabber: PartSurface<DrawerGrabberState>
  viewport: PartSurface<DrawerViewportState>
  overlay: PartSurface<DrawerOverlayState>
  content: PartSurface<DrawerContentState>
  /** The `DrawerRootContext` value — the SFC provides this verbatim. */
  context: DrawerRootContext
}

/**
 * Headless Drawer root. Owns the open model with Base UI's cancellable
 * `onOpenChange(value, details)` contract, the snap-point model, the nested-
 * drawer bookkeeping and the ids, and returns the per-part surfaces.
 *
 * A standalone consumer gets state, ids and aria/`data-*` surfaces; swipe
 * gestures, snap-point geometry, focus trapping and dismissal need
 * `useDrawerContent()` inside a mounted popup plus `FocusScope` /
 * `DismissableLayer` (or their own equivalents).
 *
 * SSR-safe and callable outside `setup()` — refs and computeds only.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useDrawer(props: UseDrawerProps = {}): UseDrawerReturn {
  const baseId = props.baseId ?? `reka-drawer-${++drawerCount}`
  const { parentContext, providerContext } = props

  // Base UI's cancellable `onOpenChange` maps onto the v3 contract (#2828):
  // `beforeUpdate:open` can cancel, `update:open` reports the committed change.
  const { state: open, setState: setOpen } = useControllableState<boolean, DrawerOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  // Base UI's `onSnapPointChange(snapPoint, eventDetails)` is cancellable too.
  const { state: activeSnapPoint, setState: setSnapPoint } = useControllableState<DrawerSnapPoint | null | undefined, DrawerSnapPointChangeReason>({
    prop: props.snapPoint ?? props.activeSnapPoint,
    defaultValue: props.defaultSnapPoint ?? null,
    name: 'snapPoint',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeSnapPointUpdate as ((value: DrawerSnapPoint | null | undefined, details: ChangeEventDetails<DrawerSnapPointChangeReason>) => void) | undefined,
    onUpdate: props.onSnapPointUpdate as ((value: DrawerSnapPoint | null | undefined, details: ChangeEventDetails<DrawerSnapPointChangeReason>) => void) | undefined,
  })

  const modal = computed<DrawerModal>(() => toValue(props.modal) ?? true)
  const swipeDirection = computed<SwipeDirection>(() => toValue(props.swipeDirection) ?? 'down')
  const snapPoints = computed(() => toValue(props.snapPoints))
  const snapToSequentialPoints = computed<boolean>(() => toValue(props.snapToSequentialPoints) ?? false)

  const triggerElement = ref<HTMLElement>()
  const contentElement = ref<HTMLElement>()
  const viewportElement = ref<HTMLElement>()
  const overlayElement = ref<HTMLElement>()
  const popupHeight = ref(0)
  const frontmostHeight = ref(0)
  const hasNestedDrawer = ref(false)
  const nestedOpenDrawerCount = ref(0)
  const nestedSwiping = ref(false)
  const isSwiping = ref(false)
  const nestedSwipeProgressStore = createNestedSwipeProgressStore()

  // Base UI parity: an unchanged request reports `true` and emits nothing.
  function onOpenChange(value: boolean, reason?: DrawerOpenChangeReason | BaseChangeReason, event?: Event) {
    if (open.value === value)
      return true
    if (!setOpen(value, reason, event))
      return false
    // Base UI parity (`DrawerRoot` `handleOpenChange`): a close resets the
    // snap point to the default (`defaultSnapPoint`, else the first snap
    // point), so the drawer reopens where it started.
    const points = toValue(props.snapPoints)
    if (!value && points && points.length > 0)
      setActiveSnapPoint(props.defaultSnapPoint !== undefined ? props.defaultSnapPoint : points[0] ?? null, reason, event)
    return true
  }

  function setActiveSnapPoint(point: DrawerSnapPoint | null, reason?: DrawerSnapPointChangeReason | BaseChangeReason, event?: Event) {
    if (Object.is(activeSnapPoint.value ?? null, point))
      return true
    return setSnapPoint(point, reason, event)
  }

  function onOpenToggle() {
    onOpenChange(!open.value, 'trigger-press')
  }

  const context: DrawerRootContext = {
    open,
    modal: modal as Ref<DrawerModal>,
    swipeDirection: swipeDirection as Ref<SwipeDirection>,
    snapPoints: snapPoints as Ref<DrawerSnapPoint[] | undefined>,
    activeSnapPoint,
    snapToSequentialPoints: snapToSequentialPoints as Ref<boolean>,
    popupHeight,
    frontmostHeight,
    hasNestedDrawer,
    nestedOpenDrawerCount,
    nestedSwiping,
    isSwiping,
    nestedSwipeProgressStore,
    onOpenChange,
    onOpenToggle,
    notifyOpenComplete(value) {
      props.onOpenComplete?.(value)
    },
    setActiveSnapPoint,
    onPopupHeightChange(h) {
      popupHeight.value = h
      providerContext?.visualStateStore.set({ frontmostHeight: h })
    },
    onNestedFrontmostHeightChange(h) { frontmostHeight.value = h },
    onNestedDrawerPresenceChange(present) {
      if (present)
        nestedOpenDrawerCount.value++
      else
        nestedOpenDrawerCount.value = Math.max(0, nestedOpenDrawerCount.value - 1)
      hasNestedDrawer.value = nestedOpenDrawerCount.value > 0
      parentContext?.notifyParentHasNestedDrawer?.(present)
    },
    onNestedSwipingChange(swiping) {
      nestedSwiping.value = swiping
      parentContext?.notifyParentSwipingChange?.(swiping)
    },
    onNestedSwipeProgressChange(progress) {
      nestedSwipeProgressStore.set(progress)
      parentContext?.notifyParentSwipeProgressChange?.(progress)
      providerContext?.visualStateStore.set({ swipeProgress: progress })
    },
    onSwipingChange(swiping) {
      isSwiping.value = swiping
    },
    notifyParentFrontmostHeight: parentContext?.onNestedFrontmostHeightChange,
    notifyParentSwipingChange: parentContext?.onNestedSwipingChange,
    notifyParentSwipeProgressChange: parentContext?.onNestedSwipeProgressChange,
    notifyParentHasNestedDrawer: parentContext?.onNestedDrawerPresenceChange,
    triggerElement,
    contentElement,
    viewportElement,
    overlayElement,
    contentId: `${baseId}-content`,
    titleId: `${baseId}-title`,
    descriptionId: `${baseId}-description`,
  }

  return {
    open,
    modal,
    swipeDirection,
    activeSnapPoint,
    onOpenChange,
    setActiveSnapPoint,
    onOpenToggle,
    trigger: getDrawerTriggerSurface(context),
    close: getDrawerCloseSurface(context),
    title: getDrawerTitleSurface(context),
    description: getDrawerDescriptionSurface(context),
    grabber: getDrawerGrabberSurface(context),
    viewport: getDrawerViewportSurface(context),
    overlay: getDrawerOverlaySurface(context),
    content: getDrawerContentSurface(context),
    context,
  }
}

// -----------------------------------------------------------------------------
// useDrawerContent — the popup brain (DrawerContentImpl)
// -----------------------------------------------------------------------------

export interface UseDrawerContentOptions {
  rootContext: DrawerRootContext
  /** The popup element (the SFC's `useForwardElement` `currentElement`). */
  contentElement: Ref<HTMLElement | null | undefined>
  /**
   * Initial focus target when the drawer opens: `true` focuses the first
   * focusable element, `false` nothing, an element that element.
   * @defaultValue `true`
   */
  initialFocus?: MaybeRefOrGetter<boolean | HTMLElement | null | undefined>
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void
  onFocusOutside?: (event: FocusOutsideEvent) => void
  onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
  onOpenAutoFocus?: (event: Event) => void
}

export interface UseDrawerContentReturn {
  /** The popup surface; bind on the `DismissableLayer`. */
  content: PartSurface<DrawerContentState>
  /** The popup's own swipe gesture is in progress. */
  isSwiping: Readonly<Ref<boolean>>
  /** `DismissableLayer` `@dismiss`. */
  onDismiss: () => void
  /** `DismissableLayer` `@escape-key-down`. */
  onEscapeKeyDown: (event: KeyboardEvent) => void
  /** `DismissableLayer` `@pointer-down-outside`. */
  onPointerDownOutside: (event: PointerDownOutsideEvent) => void
  /** `DismissableLayer` `@focus-outside`. */
  onFocusOutside: (event: FocusOutsideEvent) => void
  /** `DismissableLayer` `@interact-outside`. */
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
  /** `FocusScope` `@mount-auto-focus`; honours `initialFocus`. */
  onMountAutoFocus: (event: Event) => void
}

/**
 * Headless Drawer popup — snap points, swipe-to-dismiss, dismiss reasons, the
 * `openComplete` transition wiring and the nested-drawer CSS variables, moved
 * verbatim from `DrawerContentImpl`. Owns watchers, a resize observer and
 * mount hooks, so it runs inside the mounted popup's `setup()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useDrawerContent(options: UseDrawerContentOptions): UseDrawerContentReturn {
  const { rootContext, contentElement: currentElement } = options

  // Snap points
  const { activeSnapPointOffset, snapToNearest } = useDrawerSnapPoints({
    snapPoints: rootContext.snapPoints,
    activeSnapPoint: rootContext.activeSnapPoint,
    popupHeight: rootContext.popupHeight,
    viewportRef: currentElement,
    onSnapPointChange: (point) => {
      // Base UI parity (`DrawerViewport`): a release past the last snap point
      // first requests the `null` snap point; cancelling it keeps the drawer
      // open where it was. A cancelled close then restores the previous point.
      const previous = rootContext.activeSnapPoint.value ?? null
      if (!rootContext.setActiveSnapPoint(point, 'swipe'))
        return
      if (point === null && !rootContext.onOpenChange(false, 'swipe'))
        rootContext.setActiveSnapPoint(previous, 'swipe')
    },
  })

  // Write the active snap offset to the popup's inline style. Called both via a
  // watcher (for live updates as the snap point or popup height changes) and
  // explicitly from onMounted (to set the initial value — a lazy watcher would
  // only fire on CHANGE, which may never happen on a reopen where popupHeight
  // is already measured from a previous open and activeSnapPoint is unchanged).
  //
  // BaseUI parity: snap points are applied purely via a translate using
  // --drawer-snap-point-offset. The popup's height is independent (consumers
  // should set max-height: 100dvh or similar and let the transform slide the
  // popup visually).
  function writeSnapPointOffset() {
    const el = currentElement.value
    if (!el)
      return
    const offset = activeSnapPointOffset.value
    if (offset != null) {
      const dir = rootContext.swipeDirection.value
      const signedOffset = (dir === 'up' || dir === 'left') ? -offset : offset
      el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, `${signedOffset}px`)
    }
    else {
      el.style.setProperty(DRAWER_CSS_VARS.snapPointOffset, '0px')
    }
  }

  watch(activeSnapPointOffset, writeSnapPointOffset)

  // Measure popup height via ResizeObserver. BaseUI parity: skip writes while a
  // nested drawer is open and we already have a measured height, to keep the
  // parent's snap-point geometry stable while the child drawer animates.
  useResizeObserver(currentElement as Ref<HTMLElement | undefined>, ([entry]) => {
    if (!entry)
      return
    if (rootContext.hasNestedDrawer.value && rootContext.popupHeight.value > 0)
      return
    const h = entry.contentRect.height
    rootContext.onPopupHeightChange(h)
    currentElement.value?.style.setProperty(DRAWER_CSS_VARS.height, `${h}px`)
  })

  // Watch frontmostHeight -> set CSS var
  watch(() => rootContext.frontmostHeight.value, (h) => {
    currentElement.value?.style.setProperty(DRAWER_CSS_VARS.frontmostHeight, `${h}px`)
  })

  // Swipe directions: when snap points exist, allow both dismiss AND expand directions
  const hasSnapPoints = computed(() => (rootContext.snapPoints.value?.length ?? 0) > 0)
  const swipeDirections = computed<SwipeDirection[]>(() => {
    const dismiss = rootContext.swipeDirection.value
    if (!hasSnapPoints.value)
      return [dismiss]
    // Allow swiping in both directions for snap point navigation
    const opposite: Record<string, SwipeDirection> = { up: 'down', down: 'up', left: 'right', right: 'left' }
    return [dismiss, opposite[dismiss]]
  })

  // Track the latest raw signed delta for snap release (BaseUI parity: the
  // release math needs the delta as of the last move, not the accumulated
  // CSS offset).
  let lastRawDelta = { x: 0, y: 0 }

  // Swipe dismiss
  const { isSwiping, restore: restoreSwipe } = useSwipeDismiss({
    enabled: computed(() => rootContext.open.value),
    elementRef: currentElement,
    directions: swipeDirections,
    movementCssVars: {
      x: DRAWER_CSS_VARS.swipeMovementX,
      y: DRAWER_CSS_VARS.swipeMovementY,
    },
    ignoreSelectorWhenTouch: false,
    canStart: () => !rootContext.nestedSwiping.value,
    onDismiss() {
      // With snap points, onRelease handles snapping
      if (hasSnapPoints.value)
        return
      if (!rootContext.onOpenChange(false, 'swipe'))
        return false
      // BaseUI parity: a controlled parent may ignore `update:open`. Its `open`
      // prop settles by the next tick; if it is still open, undo the dismissal.
      nextTick(() => {
        if (rootContext.open.value)
          restoreSwipe()
      })
    },
    onRelease(velocity) {
      // Write the `--drawer-swipe-strength` CSS var so consumer transitions can
      // scale their duration with release velocity. Ported from BaseUI
      // `DrawerViewport.tsx:resolveSwipeRelease`.
      const el = currentElement.value
      if (el) {
        const dir = rootContext.swipeDirection.value
        const size = (dir === 'left' || dir === 'right') ? el.offsetWidth : el.offsetHeight
        const axisDelta = (dir === 'left' || dir === 'right') ? lastRawDelta.x : lastRawDelta.y
        const releaseVelocity = (dir === 'left' || dir === 'right') ? velocity.x : velocity.y
        const scalar = computeSwipeReleaseScalar({
          direction: dir,
          size,
          axisDelta,
          snapPointOffset: activeSnapPointOffset.value ?? 0,
          releaseVelocity,
        })
        if (scalar != null)
          el.style.setProperty(DRAWER_CSS_VARS.swipeStrength, `${scalar}`)
        else
          el.style.setProperty(DRAWER_CSS_VARS.swipeStrength, '1')
      }

      if (hasSnapPoints.value) {
        // Convert the latest signed delta to a dismiss-direction-positive scalar
        // (BaseUI: `dragDelta = direction==='down' ? deltaY : direction==='up' ? -deltaY : ...`).
        // getDisplacement handles the sign flip per direction.
        const dir = rootContext.swipeDirection.value
        const dragDelta = getDisplacement(dir, lastRawDelta.x, lastRawDelta.y)
        snapToNearest(dragDelta, velocity, dir, rootContext.snapToSequentialPoints.value)

        // Sequencing matters for smooth drag-to-next-snap animation.
        //
        // After snapToNearest, activeSnapPoint has updated synchronously (Vue
        // refs are synchronous) but the `watch(activeSnapPointOffset, ...)`
        // runs on the next microtask. If we cleared --drawer-swipe-movement-y
        // first, the transform would visually jump from the drag position
        // (e.g. translateY(50)) back to the OLD snap offset (translateY(400))
        // for a single frame, then the watch would fire and CSS would
        // transition from 400 down to the new snap offset (translateY(0)) —
        // the user sees a snap-back-then-animate instead of a continuous
        // motion from their finger to the new snap.
        //
        // Fix: write the new snap offset CSS var synchronously FIRST (via
        // writeSnapPointOffset, which reads activeSnapPointOffset.value — the
        // computed recalculates on access), then clear the movement vars.
        // Both writes happen in the same animation frame, and the CSS
        // transition on `transform` smoothly interpolates from the current
        // rendered transform (drag position) to the new snap target.
        if (el) {
          writeSnapPointOffset()
          el.style.setProperty(DRAWER_CSS_VARS.swipeMovementX, '0px')
          el.style.setProperty(DRAWER_CSS_VARS.swipeMovementY, '0px')
        }
      }

      // For snap-point drawers, this callback fully decides the open/close +
      // transform outcome above, so tell finishSwipe to skip its own
      // dismiss-vs-cancel branch.
      return hasSnapPoints.value
    },
    onSwipingChange(swiping) {
      rootContext.onSwipingChange(swiping)
      rootContext.onNestedSwipingChange(swiping)
    },
    onProgress(progress, details) {
      if (details) {
        lastRawDelta = { x: details.deltaX, y: details.deltaY }
      }
      rootContext.onNestedSwipeProgressChange(progress)
    },
  })

  // Track the source of the next dismiss so we can attach a reason.
  // DismissableLayer fires `escape-key-down` / `pointer-down-outside` / `focus-outside`
  // before it fires `dismiss`, so we capture the reason in those handlers and read
  // it here.
  let pendingDismissReason: 'escape-key' | 'outside-press' | undefined

  function onDismiss() {
    if (isSwiping.value)
      return
    rootContext.onOpenChange(false, pendingDismissReason ?? 'outside-press')
    pendingDismissReason = undefined
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    pendingDismissReason = 'escape-key'
    options.onEscapeKeyDown?.(event)
  }

  function onPointerDownOutside(event: PointerDownOutsideEvent) {
    if (isSwiping.value) {
      event.preventDefault()
      return
    }
    pendingDismissReason = 'outside-press'
    options.onPointerDownOutside?.(event)
  }

  function onFocusOutside(event: FocusOutsideEvent) {
    if (isSwiping.value) {
      event.preventDefault()
      return
    }
    options.onFocusOutside?.(event)
  }

  function onInteractOutside(event: PointerDownOutsideEvent | FocusOutsideEvent) {
    if (isSwiping.value) {
      event.preventDefault()
      return
    }
    options.onInteractOutside?.(event)
  }

  function onMountAutoFocus(event: Event) {
    options.onOpenAutoFocus?.(event)
    if (event.defaultPrevented)
      return
    const initialFocus = toValue(options.initialFocus) ?? true
    if (initialFocus === false) {
      event.preventDefault()
    }
    else if (isHTMLElement(initialFocus)) {
      event.preventDefault()
      focus(initialFocus, { select: true })
    }
  }

  // --- update:openComplete wiring ---
  // Base UI `useOpenChangeComplete` / `useAnimationsFinished`: one frame after
  // the open state changes (and when the popup mounts open), wait for every
  // animation and transition running on the popup itself, then report. With
  // none running, or without `getAnimations` (jsdom), it reports right away, so
  // a popup with no CSS animation still completes. A newer change supersedes a
  // pending one; an aborted animation counts as finished.
  let openCompleteRun = 0
  let pendingCloseComplete = false

  function scheduleOpenComplete(isOpen: boolean) {
    const run = ++openCompleteRun
    pendingCloseComplete = !isOpen
    const complete = () => {
      if (run !== openCompleteRun)
        return
      pendingCloseComplete = false
      rootContext.notifyOpenComplete(isOpen)
    }
    const el = currentElement.value
    if (!el || typeof el.getAnimations !== 'function') {
      complete()
      return
    }
    requestAnimationFrame(() => {
      if (run !== openCompleteRun)
        return
      const animations = el.getAnimations()
      if (!animations.length) {
        complete()
        return
      }
      Promise.all(animations.map(animation => animation.finished)).then(complete, complete)
    })
  }

  watch(() => rootContext.open.value, scheduleOpenComplete)

  // Sync nestedOpenDrawerCount onto the popup CSS var so nested scale effects
  // can read it. BaseUI uses a running count, not a boolean.
  watch(() => rootContext.nestedOpenDrawerCount.value, (n) => {
    currentElement.value?.style.setProperty(DRAWER_CSS_VARS.nestedDrawers, `${n}`)
  })

  // Subscribe to the nested swipe progress store: when a CHILD drawer reports
  // dismiss-swipe progress, the parent popup reads it and writes the value onto
  // its own `--drawer-swipe-progress` CSS var so consumer CSS can animate the
  // parent "in reverse" while the child swipes away. Ported from BaseUI
  // `DrawerPopup.tsx` (useIsoLayoutEffect subscribing to nestedSwipeProgressStore).
  let unsubscribeNestedProgress: (() => void) | undefined

  onMounted(() => {
    rootContext.contentElement.value = currentElement.value as HTMLElement | undefined
    rootContext.notifyParentHasNestedDrawer?.(true)

    // Initial nested-drawer count
    currentElement.value?.style.setProperty(
      DRAWER_CSS_VARS.nestedDrawers,
      `${rootContext.nestedOpenDrawerCount.value}`,
    )

    // Initial snap-point offset. Required on reopen when popupHeight is already
    // measured and activeSnapPoint is unchanged — the lazy watcher would never
    // fire and the drawer would render at offset 0 (appearing as snap=1.0).
    writeSnapPointOffset()

    unsubscribeNestedProgress = rootContext.nestedSwipeProgressStore.subscribe(() => {
      const progress = rootContext.nestedSwipeProgressStore.getSnapshot()
      currentElement.value?.style.setProperty(DRAWER_CSS_VARS.swipeProgress, `${progress}`)
    })

    // The popup mounts when the drawer opens (or mounted open): its enter
    // animation is the one `openComplete(true)` waits for.
    if (rootContext.open.value)
      scheduleOpenComplete(true)
  })

  onUnmounted(() => {
    rootContext.notifyParentHasNestedDrawer?.(false)
    unsubscribeNestedProgress?.()
    // `Presence` unmounts the popup once its exit animation ends; a close still
    // waiting on the next frame completes now instead of being dropped.
    const closePending = pendingCloseComplete
    openCompleteRun++
    pendingCloseComplete = false
    if (closePending)
      rootContext.notifyOpenComplete(false)
  })

  // Dev warning for missing DrawerTitle
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    onMounted(() => {
      if (!getElementByIdFrom(currentElement.value, rootContext.titleId)) {
        console.warn(
          `Warning: \`DrawerContent\` requires a \`DrawerTitle\` for accessibility.`,
        )
      }
    })
  }

  return {
    content: getDrawerContentSurface(rootContext, isSwiping),
    isSwiping,
    onDismiss,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    onMountAutoFocus,
  }
}

// -----------------------------------------------------------------------------
// useDrawerContentModality — DrawerContent's modality tiers and final focus
// -----------------------------------------------------------------------------

export interface UseDrawerContentModalityOptions {
  rootContext: Pick<DrawerRootContext, 'modal' | 'open' | 'triggerElement'> & Partial<Pick<DrawerRootContext, 'overlayElement'>>
  /**
   * The content element. With it, a modal drawer only dismisses on a press on
   * its own backdrop (internal backdrop or `DrawerOverlay`), as in Base UI.
   */
  contentElement?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /**
   * Final focus target when the drawer closes: `true` focuses the trigger,
   * `false` nothing, an element that element. @defaultValue `true`
   */
  finalFocus?: MaybeRefOrGetter<boolean | HTMLElement | null | undefined>
}

export interface UseDrawerContentModalityReturn {
  /** `modal === true`: focus trap + hide others + outside pointer events blocked. */
  isFullModal: ComputedRef<boolean>
  /** Focus is trapped while open for `modal: true` and `modal: 'trap-focus'`. */
  shouldTrapFocus: ComputedRef<boolean>
  /** The element focus returns to on close, per `finalFocus`. */
  finalFocusElement: () => HTMLElement | undefined
  /** Full-modal `@close-auto-focus`. */
  onCloseAutoFocusModal: (event: Event) => void
  /** Full-modal `@pointer-down-outside`: right clicks never dismiss. */
  onPointerDownOutsideModal: (event: PointerDownOutsideEvent) => void
  /** Full-modal `@focus-outside`: never dismisses. */
  onFocusOutsideModal: (event: Event) => void
  /** Non-modal `@close-auto-focus`. */
  onCloseAutoFocusNonModal: (event: Event) => void
  /** Non-modal `@interact-outside`. */
  onInteractOutsideNonModal: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
  /**
   * Returns focus when the drawer closes but its content stays mounted
   * (`forceMount`), where `FocusScope` never unmounts and `close-auto-focus`
   * never fires. Same rules as the close-auto-focus handlers; mirrors
   * `DialogContentModal` / `DialogContentNonModal`.
   */
  onCloseWhileMounted: () => void
}

/**
 * The modality tiers of `DrawerContent` (`true` / `'trap-focus'` / `false`) and
 * their focus-return and outside-interaction handlers. Refs and closures only.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useDrawerContentModality(options: UseDrawerContentModalityOptions): UseDrawerContentModalityReturn {
  const { rootContext } = options
  const hasInteractedOutside = ref(false)
  const hasPointerDownOutside = ref(false)

  // Modality tiers:
  //   true           → full modal (focus trap + hide others + outside pointer events blocked)
  //   'trap-focus'   → traps focus but does NOT block outside pointer events
  //   false          → non-modal
  const isFullModal = computed(() => rootContext.modal.value === true)
  const isTrapFocusOnly = computed(() => rootContext.modal.value === 'trap-focus')
  const shouldTrapFocus = computed(() => (isFullModal.value || isTrapFocusOnly.value) && rootContext.open.value)

  function finalFocusElement() {
    const finalFocus = toValue(options.finalFocus) ?? true
    if (finalFocus === false)
      return undefined
    if (isHTMLElement(finalFocus))
      return finalFocus
    return rootContext.triggerElement.value
  }

  return {
    isFullModal,
    shouldTrapFocus,
    finalFocusElement,
    onCloseAutoFocusModal(e) {
      if (!e.defaultPrevented) {
        e.preventDefault()
        finalFocusElement()?.focus()
      }
    },
    onPointerDownOutsideModal(e) {
      const orig = e.detail.originalEvent
      const isRightClick = orig.button === 2 || (orig.button === 0 && orig.ctrlKey)
      // Only a press on the drawer's own backdrop dismisses it (Base UI `useDialogRoot`, #2822).
      const content = toValue(options.contentElement)
      if (isRightClick || (content && !isOwnBackdropPress(e.target, content, rootContext.overlayElement?.value)))
        e.preventDefault()
    },
    onFocusOutsideModal(e) {
      e.preventDefault()
    },
    onCloseAutoFocusNonModal(e) {
      if (!e.defaultPrevented) {
        if (!hasInteractedOutside.value)
          finalFocusElement()?.focus()
        e.preventDefault()
      }
      hasInteractedOutside.value = false
      hasPointerDownOutside.value = false
    },
    onInteractOutsideNonModal(e) {
      if (!e.defaultPrevented) {
        hasInteractedOutside.value = true
        if (e.detail.originalEvent.type === 'pointerdown')
          hasPointerDownOutside.value = true
      }
      const target = e.target as HTMLElement
      if (rootContext.triggerElement.value?.contains(target))
        e.preventDefault()
      if (e.detail.originalEvent.type === 'focusin' && hasPointerDownOutside.value)
        e.preventDefault()
    },
    onCloseWhileMounted() {
      // Base UI (`FloatingFocusManager`) returns focus only while it is still
      // inside the popup or was lost to `<body>`; focus the app already moved
      // elsewhere stays there.
      const content = toValue(options.contentElement)
      const active = getActiveElement(content)
      const focusIsOurs = !active || active === active.ownerDocument.body || !!content?.contains(active)
      if (focusIsOurs && (isFullModal.value || !hasInteractedOutside.value))
        finalFocusElement()?.focus()
      hasInteractedOutside.value = false
      hasPointerDownOutside.value = false
    },
  }
}

// -----------------------------------------------------------------------------
// useDrawerSwipeArea — swipe-to-open
// -----------------------------------------------------------------------------

const OPPOSITE: Record<string, string> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export interface UseDrawerSwipeAreaOptions {
  /** The swipe area element (the SFC's `useForwardElement` `currentElement`). */
  element: Ref<HTMLElement | null | undefined>
  /** Override the open swipe direction (defaults to opposite of the root's `swipeDirection`). */
  swipeDirection?: MaybeRefOrGetter<SwipeDirection | undefined>
  /** Disable swipe-to-open. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDrawerSwipeAreaReturn {
  /** The resolved open direction. */
  openDirection: ComputedRef<SwipeDirection>
  /** `data-state` + `data-swipe-direction`. */
  swipeArea: PartSurface<DrawerSwipeAreaState>
}

/**
 * Swipe-to-open for `DrawerSwipeArea`: a swipe in the open direction (opposite
 * the dismiss direction by default) requests `onOpenChange(true, 'swipe')`.
 * Binds pointer/touch listeners through `useSwipeDismiss`, so it runs inside a
 * component `setup()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useDrawerSwipeArea(
  rootContext: DrawerRootContext,
  options: UseDrawerSwipeAreaOptions,
): UseDrawerSwipeAreaReturn {
  const openDirection = computed<SwipeDirection>(() => {
    const override = toValue(options.swipeDirection)
    if (override)
      return override
    return (OPPOSITE[rootContext.swipeDirection.value] ?? 'up') as SwipeDirection
  })

  const enabled = computed(() => !toValue(options.disabled) && !rootContext.open.value)

  // Keep the directions array reactive — `[openDirection.value]` would capture
  // the initial value only and ignore prop/state updates.
  const directions = computed<SwipeDirection[]>(() => [openDirection.value])

  const { restore: restoreSwipe } = useSwipeDismiss({
    enabled,
    elementRef: options.element,
    directions,
    movementCssVars: {
      x: DRAWER_CSS_VARS.swipeMovementX,
      y: DRAWER_CSS_VARS.swipeMovementY,
    },
    onDismiss() {
      if (!rootContext.onOpenChange(true, 'swipe'))
        return false
      nextTick(() => {
        if (!rootContext.open.value)
          restoreSwipe()
      })
    },
    onSwipingChange(swiping) {
      rootContext.onNestedSwipingChange(swiping)
    },
  })

  const swipeArea = createPartSurface<DrawerSwipeAreaState>(
    () => ({}),
    () => ({ state: disclosureState(rootContext.open.value), swipeDirection: openDirection.value }),
  )

  return { openDirection, swipeArea }
}
