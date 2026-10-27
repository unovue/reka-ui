<script lang="ts">
import type { Ref } from 'vue'
import type {
  DrawerSnapPoint,
  NestedSwipeProgressStore,
  SwipeDirection,
} from './utils'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useId } from '@/shared'

export type DrawerModal = boolean | 'trap-focus'

/**
 * Why the Drawer opened or closed; carried as `details.reason` (#2828).
 *
 * - `'trigger-press'`: `DrawerTrigger` was pressed.
 * - `'close-press'`: `DrawerClose` (or the slot's `close`) was pressed.
 * - `'escape-key'`: Escape dismissed the drawer.
 * - `'outside-press'`: a press outside (or on the backdrop) dismissed it.
 * - `'swipe'`: a swipe on the popup dismissed it, or one on `DrawerSwipeArea` opened it.
 * - `'click'`, `'cancel'`: never reported; kept so existing type guards compile.
 */
export type DrawerOpenChangeReason
  = | 'swipe'
    | 'escape-key'
    | 'outside-press'
    | 'click'
    | 'cancel'
    | 'trigger-press'
    | 'close-press'

/**
 * Why the active snap point changed (Base UI uses the open reasons). A swipe
 * reports `'swipe'`; the reset to the default snap point when the drawer closes
 * reports the reason of the close.
 */
export type DrawerSnapPointChangeReason = DrawerOpenChangeReason

/** @deprecated Use `ChangeEventDetails<DrawerOpenChangeReason>`. */
export type DrawerOpenChangeDetails = ChangeEventDetails<DrawerOpenChangeReason>

export interface DrawerRootProps {
  /** v-model:open */
  open?: boolean
  defaultOpen?: boolean
  /**
   * Modality of the drawer.
   * - `true` (default): modal with focus trap, scroll lock, and outside-press dismiss
   * - `'trap-focus'`: traps focus but allows outside pointer events (non-modal side panels)
   * - `false`: non-modal
   */
  modal?: DrawerModal
  /** Direction to swipe to dismiss. @default 'down' */
  swipeDirection?: SwipeDirection
  /** Preset snap positions (fractions 0-1, pixels >1, or '148px'/'30rem' strings) */
  snapPoints?: DrawerSnapPoint[]
  /** v-model:snapPoint */
  snapPoint?: DrawerSnapPoint | null
  defaultSnapPoint?: DrawerSnapPoint | null
  /**
   * When true, snaps to the next sequential snap point (one step at a time).
   * When false, snaps to the nearest snap point by distance.
   * @default false
   */
  snapToSequentialPoints?: boolean
}

export type DrawerRootEmits = {
  /** Called before the open state changes (Base UI `onOpenChange`); `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason>]
  /** Called when the open state changed. */
  'update:open': [value: boolean, details: ChangeEventDetails<DrawerOpenChangeReason>]
  /**
   * Called once the popup's open (`true`) or close (`false`) transitions and animations have finished; on close, right
   * before the popup unmounts. Infinite and cancelled animations are not waited for, and with none running it fires
   * without waiting. A newer open change supersedes a pending one.
   */
  'update:openComplete': [value: boolean]
  /**
   * Called before the active snap point changes (Base UI `onSnapPointChange`); `details.cancel()` keeps the current
   * snap point. Cancelling the `null` a swipe past the last snap point requests keeps the drawer open.
   */
  'beforeUpdate:snapPoint': [value: DrawerSnapPoint | null, details: ChangeEventDetails<DrawerSnapPointChangeReason>]
  /** Called when the active snap point changed. */
  'update:snapPoint': [value: DrawerSnapPoint | null, details: ChangeEventDetails<DrawerSnapPointChangeReason>]
}

export interface DrawerRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<DrawerModal>
  swipeDirection: Ref<SwipeDirection>
  snapPoints: Ref<DrawerSnapPoint[] | undefined>
  activeSnapPoint: Readonly<Ref<DrawerSnapPoint | null | undefined>>
  snapToSequentialPoints: Ref<boolean>
  popupHeight: Ref<number>
  frontmostHeight: Ref<number>
  hasNestedDrawer: Ref<boolean>
  nestedOpenDrawerCount: Ref<number>
  nestedSwiping: Ref<boolean>
  isSwiping: Ref<boolean>
  nestedSwipeProgressStore: NestedSwipeProgressStore
  /** Returns `false` when cancelled via `beforeUpdate:open`; an unchanged value returns `true`. */
  onOpenChange: (value: boolean, reason?: DrawerOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  onOpenToggle: () => void
  /** Called by the popup once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
  /** Returns `false` when cancelled via `beforeUpdate:snapPoint`; an unchanged value returns `true`. */
  setActiveSnapPoint: (point: DrawerSnapPoint | null, reason?: DrawerSnapPointChangeReason | BaseChangeReason, event?: Event) => boolean
  onPopupHeightChange: (height: number) => void
  onNestedFrontmostHeightChange: (height: number) => void
  onNestedDrawerPresenceChange: (present: boolean) => void
  onNestedSwipingChange: (swiping: boolean) => void
  onNestedSwipeProgressChange: (progress: number) => void
  onSwipingChange: (swiping: boolean) => void
  notifyParentFrontmostHeight?: (height: number) => void
  notifyParentSwipingChange?: (swiping: boolean) => void
  notifyParentSwipeProgressChange?: (progress: number) => void
  notifyParentHasNestedDrawer?: (present: boolean) => void
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  viewportElement: Ref<HTMLElement | undefined>
  /** The mounted `DrawerOverlay` element; a press on it dismisses a modal drawer. */
  overlayElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
}

export const [injectDrawerRootContext, provideDrawerRootContext]
  = createContext<DrawerRootContext>('DrawerRoot')
</script>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { injectDrawerProviderContext } from './DrawerProvider.vue'
import { useDrawer } from './useDrawer'

const props = withDefaults(defineProps<DrawerRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  swipeDirection: 'down',
  snapPoints: undefined,
  snapPoint: undefined,
  defaultSnapPoint: undefined,
  snapToSequentialPoints: false,
})
const emit = defineEmits<DrawerRootEmits>()

defineSlots<{
  default?: (props: { open: boolean, close: () => void }) => any
}>()

// Optional parent context for nested drawer support
const parentContext = injectDrawerRootContext(null)

// Optional provider context for drawer state tracking
const providerContext = injectDrawerProviderContext(null)

// The composable owns the open and snap-point models (cancellable
// `beforeUpdate:*`, then `update:*`), the nested-drawer bookkeeping and the context value; `useId`
// (SSR-stable) stays in the shell and seeds the content/title/description ids.
const { open, onOpenChange, context } = useDrawer({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  swipeDirection: () => props.swipeDirection,
  snapPoints: () => props.snapPoints,
  snapToSequentialPoints: () => props.snapToSequentialPoints,
  snapPoint: () => props.snapPoint,
  defaultSnapPoint: props.defaultSnapPoint,
  baseId: useId(undefined, 'reka-drawer'),
  emit,
  onOpenComplete: value => emit('update:openComplete', value),
  parentContext,
  providerContext,
})

provideDrawerRootContext(context)

function handleClose() {
  onOpenChange(false, 'close-press')
}

// Sync open state with DrawerProvider (provider coupling stays in the shell).
watch(open, (isOpen) => {
  if (isOpen) {
    providerContext?.setDrawerOpen(context.contentId, true)
  }
  else {
    providerContext?.setDrawerOpen(context.contentId, false)
  }
}, { immediate: true })

// `update:openComplete` is emitted once `DrawerContent`'s `Presence` reports
// that the popup's enter/exit transitions and animations finished (#2827).

onUnmounted(() => {
  providerContext?.removeDrawer(context.contentId)
})
</script>

<template>
  <slot
    :open="open"
    :close="handleClose"
  />
</template>
