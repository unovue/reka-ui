<script lang="ts">
import type { Ref } from 'vue'
import type {
  DrawerSnapPoint,
  NestedSwipeProgressStore,
  SwipeDirection,
} from './utils'
import { createContext, useId } from '@/shared'

export type DrawerModal = boolean | 'trap-focus'

export type DrawerOpenChangeReason
  = | 'swipe'
    | 'escape-key'
    | 'outside-press'
    | 'click'
    | 'cancel'
    | 'trigger-press'
    | 'close-press'

export interface DrawerOpenChangeDetails {
  reason?: DrawerOpenChangeReason
  /** Keeps the drawer in its current state. Call it while handling `update:open`. */
  cancel: () => void
  /** Whether `cancel()` was called. */
  readonly isCanceled: boolean
}

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
  /** Called before the open state changes, with why it is changing. Calling `details.cancel()` keeps the current state (Base UI `onOpenChange`). */
  'update:open': [value: boolean, details: DrawerOpenChangeDetails]
  /** Called once the popup's enter or exit animations and transitions have finished, or right away when it has none. */
  'update:openComplete': [value: boolean]
  /** Called when the active snap point changes. */
  'update:snapPoint': [value: DrawerSnapPoint | null]
}

export interface DrawerRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<DrawerModal>
  swipeDirection: Ref<SwipeDirection>
  snapPoints: Ref<DrawerSnapPoint[] | undefined>
  activeSnapPoint: Ref<DrawerSnapPoint | null | undefined>
  snapToSequentialPoints: Ref<boolean>
  popupHeight: Ref<number>
  frontmostHeight: Ref<number>
  hasNestedDrawer: Ref<boolean>
  nestedOpenDrawerCount: Ref<number>
  nestedSwiping: Ref<boolean>
  isSwiping: Ref<boolean>
  nestedSwipeProgressStore: NestedSwipeProgressStore
  /** Returns `false` when a listener canceled the change. */
  onOpenChange: (value: boolean, reason?: DrawerOpenChangeReason) => boolean
  onOpenToggle: () => void
  notifyOpenComplete: (value: boolean) => void
  setActiveSnapPoint: (point: DrawerSnapPoint | null) => void
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
import { useVModel } from '@vueuse/core'
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

// The snap-point model keeps `useVModel` (its emit timing is part of the Base
// UI parity contract); the composable takes it as a writable ref.
const activeSnapPoint = useVModel(props, 'snapPoint', emit, {
  defaultValue: props.defaultSnapPoint ?? null,
  passive: (props.snapPoint === undefined) as false,
  eventName: 'update:snapPoint',
}) as Ref<DrawerSnapPoint | null | undefined>

// Optional parent context for nested drawer support
const parentContext = injectDrawerRootContext(null)

// Optional provider context for drawer state tracking
const providerContext = injectDrawerProviderContext(null)

// The composable owns the open model (Base UI's cancellable `update:open`
// contract), the nested-drawer bookkeeping and the context value; `useId`
// (SSR-stable) stays in the shell and seeds the content/title/description ids.
const { open, onOpenChange, context } = useDrawer({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  swipeDirection: () => props.swipeDirection,
  snapPoints: () => props.snapPoints,
  snapToSequentialPoints: () => props.snapToSequentialPoints,
  activeSnapPoint,
  baseId: useId(undefined, 'reka-drawer'),
  onOpenChange: (value, details) => emit('update:open', value, details),
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

// `update:openComplete` is emitted by `useDrawerContent` once the popup's
// enter/exit animations finish (Base UI `useOpenChangeComplete`). DrawerRoot
// just exposes the notify hook through context.

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
