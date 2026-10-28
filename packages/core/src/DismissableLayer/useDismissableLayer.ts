import type { Ref } from 'vue'
import type { DismissableLayerDismissDetails } from './DismissableLayer.vue'
import type { StackLayer } from './layerStack'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from './utils'
import type { SplitWrapperAttrs, WrapperSpec } from '@/shared/splitWrapperAttrs'
import { computed, nextTick, watch } from 'vue'
import { containsComposed } from '@/shared'
import { createWrapperEmit } from '@/shared/splitWrapperAttrs'
import { blockPositioningWrapper, mountInternalBackdrop } from './internalBackdrop'
import {
  branches,
  highestDisabledIndex,
  indexOfLayer,
  registerStackLayer,
} from './layerStack'
import {
  useFocusOutside,
  usePointerDownOutside,
} from './utils'

export interface UseDismissableLayerOptions {
  /** The layer's element: the part's own element. */
  element: Readonly<Ref<HTMLElement | null | undefined>>
  /** `DismissableLayer`'s `disableOutsidePointerEvents`. @defaultValue `false` */
  disableOutsidePointerEvents?: () => boolean | undefined
  /** Whether the layer is currently active (`DismissableLayer`'s `present`). @defaultValue `true` */
  present?: () => boolean | undefined
  /** Element left interactive through the internal backdrop (`DismissableLayer`'s `backdropCutout`). */
  backdropCutout?: () => HTMLElement | null | undefined
  /** The `escapeKeyDown` event; can be prevented. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** The `pointerDownOutside` event; can be prevented. */
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void
  /** The `focusOutside` event; can be prevented. */
  onFocusOutside?: (event: FocusOutsideEvent) => void
  /** The `interactOutside` event; can be prevented. */
  onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
  /** The layer should be dismissed, with the reason and the interaction's event. */
  onDismiss?: (details: DismissableLayerDismissDetails) => void
}

/**
 * A `DismissableLayer`, as a composable: the part's own element joins the
 * layer stack and dismisses on Escape and outside interactions. A part that
 * wrapped its element in `<DismissableLayer as-child>` binds `attrs()` on it
 * instead.
 *
 * @internal
 * @lifecycle setup
 */
export function useDismissableLayer(options: UseDismissableLayerOptions) {
  const element = options.element
  // A computed, because a part's getter reads what its wrapper received, an
  // object rebuilt on any attr change. The outside listeners' effects follow this
  // value only: re-running them disarms the listener and drops a pending touch
  // dismissal.
  const isPresent = computed(() => options.present?.() ?? true)
  const present = () => isPresent.value
  const disableOutsidePointerEvents = () => !!options.disableOutsidePointerEvents?.()

  // Participation in the shared stack manager. The manager routes Escape to the
  // top *present* layer only (replacing the per-layer `window` keydown listener),
  // so `onEscapeKeyDown` here just carries the emit + dismiss. Membership is driven
  // by the presence watch below.
  const stackLayer: StackLayer = {
    element: () => element.value,
    isPresent: present,
    disableOutsidePointerEvents,
    onEscapeKeyDown: (event) => {
      options.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented)
        options.onDismiss?.({ reason: 'escape-key', event })
    },
  }

  // Read from the shared manager (array `indexOf`, no per-read `Array.from`).
  // `-1` when this layer is not in the stack (not present) — same as before.
  const index = computed(() => indexOfLayer(stackLayer))

  const hasModalLayer = computed(() => highestDisabledIndex() >= 0)

  const isPointerEventsEnabled = computed(() => index.value >= highestDisabledIndex())

  // A layer that stays mounted while hidden (e.g. a Dialog with `unmountOnHide: false`)
  // must not listen while it is not present, hence the `present` guard passed as
  // `enabled` (it unsubscribes from the shared manager, which also cancels any
  // pending touch deferral). On touch the dispatch is deferred to the `click`
  // event, so a `pointerdown` captured while hidden would be delivered right after
  // the layer opened and dismiss it on the very interaction that opened it.
  const pointerDownOutside = usePointerDownOutside(async (event) => {
    const isPointerDownOnBranch = [...branches].some(branch =>
      containsComposed(branch, event.target as Node),
    )

    if (!present() || !isPointerEventsEnabled.value || isPointerDownOnBranch)
      return
    options.onPointerDownOutside?.(event)
    options.onInteractOutside?.(event)
    await nextTick()
    if (!event.defaultPrevented)
      options.onDismiss?.({ reason: 'outside-press', event })
  }, element, () => present())

  useFocusOutside((event) => {
    const isFocusInBranch = [...branches].some(branch =>
      containsComposed(branch, event.target as Node),
    )

    if (!present() || isFocusInBranch)
      return
    options.onFocusOutside?.(event)
    options.onInteractOutside?.(event)
    if (!event.defaultPrevented)
      options.onDismiss?.({ reason: 'focus-outside', event })
  }, element, () => present())

  // Internal backdrop (#2822, replaces the body `pointer-events: none` lock of
  // #2674/#2867). `watch` with explicit sources (not `watchEffect`) so it re-runs
  // only when this layer's `element` / `disableOutsidePointerEvents` / `present`
  // / cutout change, never on other layers' membership churn. Each modal layer
  // owns its own backdrop, so the cleanup (prop toggle or unmount) is
  // order-independent, and nothing is ever mounted during SSR (`element`
  // only resolves on the client).
  watch(
    [element, disableOutsidePointerEvents, present, () => options.backdropCutout?.()],
    ([element, disableOutsidePointerEvents, present, cutout], _, onCleanup) => {
      if (!element || !present || !disableOutsidePointerEvents)
        return
      onCleanup(mountInternalBackdrop(element, cutout))
    },
    { immediate: true },
  )

  // A layer below a modal one is inert (`pointer-events: none` on the layer,
  // see the template). Its positioning wrapper, which sits outside the layer
  // element, must not stay hit-testable over the modal layer's backdrop.
  watch(
    [element, () => hasModalLayer.value && !isPointerEventsEnabled.value],
    ([element, blocked], _, onCleanup) => {
      if (element && blocked)
        onCleanup(blockPositioningWrapper(element))
    },
    { immediate: true },
  )

  // Membership in the layer stack follows presence, not mount: a hidden layer
  // (e.g. a closed Dialog with `unmountOnHide: false`) must leave the stack so
  // Escape and outside interactions target the layer that is actually visible.
  // Kept separate from the backdrop watch above so a
  // `disableOutsidePointerEvents` toggle alone never re-orders the stack.
  watch(
    [element, present],
    ([element, present], _, onCleanup) => {
      if (!element || !present)
        return
      // `registerStackLayer`'s unregister (fired on prop toggle or unmount) is the
      // sole stack-membership cleanup — no separate unmount safety-net needed, as
      // this watch already keys on `element` (handles forwardRef swaps).
      onCleanup(registerStackLayer(stackLayer))
    },
    { immediate: true },
  )

  const attrs = computed(() => ({
    'data-dismissable-layer': '',
    'style': {
      pointerEvents: hasModalLayer.value
        ? isPointerEventsEnabled.value
          ? 'auto'
          : 'none'
        : undefined,
    },
    'onPointerdownCapture': pointerDownOutside.onPointerDownCapture,
  }))
  return {
    /** What `DismissableLayer` rendered on its element: its marker, the pointer-events style and the capture listeners. */
    attrs: () => attrs.value,
  }
}

/** `DismissableLayer`'s props and events, for `splitWrapperAttrs`. @internal */
export const DISMISSABLE_LAYER_WRAPPER: WrapperSpec = {
  props: { as: false, asChild: true, disableOutsidePointerEvents: true, present: true, backdropCutout: false },
  emits: ['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside', 'dismiss'],
}

/**
 * `useDismissableLayer` options from what a `<DismissableLayer>` wrapper
 * received (its vnode props, split by `splitWrapperAttrs`). @internal
 */
export function dismissableLayerOptions(element: UseDismissableLayerOptions['element'], wrapper: () => SplitWrapperAttrs): UseDismissableLayerOptions {
  const emit = createWrapperEmit(wrapper)
  return {
    element,
    disableOutsidePointerEvents: () => wrapper().props.disableOutsidePointerEvents as boolean | undefined,
    present: () => wrapper().props.present as boolean | undefined,
    backdropCutout: () => wrapper().props.backdropCutout as HTMLElement | null | undefined,
    onEscapeKeyDown: event => emit('onEscapeKeyDown', event),
    onPointerDownOutside: event => emit('onPointerDownOutside', event),
    onFocusOutside: event => emit('onFocusOutside', event),
    onInteractOutside: event => emit('onInteractOutside', event),
    onDismiss: details => emit('onDismiss', details),
  }
}
