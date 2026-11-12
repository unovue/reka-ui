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
  'update:open': [value: boolean, details: DrawerOpenChangeDetails]
  /**
   * Event handler called after any animations complete when the drawer is opened or closed.
   * Emits `true` once the drawer has finished opening and `false` once it has finished closing.
   */
  'update:openComplete': [value: boolean]
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
  contentId: string
  titleId: string
  descriptionId: string
}

export const [injectDrawerRootContext, provideDrawerRootContext]
  = createContext<DrawerRootContext>('DrawerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, onBeforeUnmount, onUnmounted, ref, toRefs, watch } from 'vue'
import { injectDrawerProviderContext } from './DrawerProvider.vue'
import { createNestedSwipeProgressStore } from './utils'

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

// Manual open state management — we need to pass optional details on emit
const uncontrolledOpen = ref(props.defaultOpen)
const open = computed<boolean>({
  get: () => props.open ?? uncontrolledOpen.value,
  set: (value) => { uncontrolledOpen.value = value },
})

const activeSnapPoint = useVModel(props, 'snapPoint', emit, {
  defaultValue: props.defaultSnapPoint ?? null,
  passive: (props.snapPoint === undefined) as false,
  eventName: 'update:snapPoint',
}) as Ref<DrawerSnapPoint | null | undefined>

const { modal, swipeDirection, snapPoints, snapToSequentialPoints } = toRefs(props)

const triggerElement = ref<HTMLElement>()
const contentElement = ref<HTMLElement>()
const viewportElement = ref<HTMLElement>()
const popupHeight = ref(0)
const frontmostHeight = ref(0)
const hasNestedDrawer = ref(false)
const nestedOpenDrawerCount = ref(0)
const nestedSwiping = ref(false)
const isSwiping = ref(false)
const nestedSwipeProgressStore = createNestedSwipeProgressStore()
// Whether a nested drawer currently reports a height, i.e. is the frontmost one.
let isNestedDrawerOpen = false
let isUnmounting = false

// Optional parent context for nested drawer support
const parentContext = injectDrawerRootContext(null)

// Optional provider context for drawer state tracking
const providerContext = injectDrawerProviderContext(null)

const contentId = useId(undefined, 'reka-drawer-content')
const titleId = useId(undefined, 'reka-drawer-title')
const descriptionId = useId(undefined, 'reka-drawer-description')

provideDrawerRootContext({
  open,
  modal,
  swipeDirection,
  snapPoints,
  activeSnapPoint,
  snapToSequentialPoints,
  popupHeight,
  frontmostHeight,
  hasNestedDrawer,
  nestedOpenDrawerCount,
  nestedSwiping,
  isSwiping,
  nestedSwipeProgressStore,
  onOpenChange: handleOpenChange,
  onOpenToggle: handleOpenToggle,
  notifyOpenComplete(value) {
    // A drawer that is being removed altogether has not completed a close.
    if (!isUnmounting)
      emit('update:openComplete', value)
  },
  setActiveSnapPoint(point) { activeSnapPoint.value = point },
  onPopupHeightChange(h) {
    popupHeight.value = h
    // With no nested drawer open, this drawer is the frontmost one.
    if (!isNestedDrawerOpen && h > 0)
      frontmostHeight.value = h
    providerContext?.visualStateStore.set({ frontmostHeight: h })
  },
  onNestedFrontmostHeightChange(h) {
    if (h > 0) {
      isNestedDrawerOpen = true
      frontmostHeight.value = h
      return
    }
    // The nested drawer closed: fall back to this drawer's own height rather
    // than 0, so it keeps its size while the nested drawer animates out.
    isNestedDrawerOpen = false
    if (popupHeight.value > 0)
      frontmostHeight.value = popupHeight.value
  },
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
  contentId,
  titleId,
  descriptionId,
})

function handleClose() {
  handleOpenChange(false, 'close-press')
}

function handleOpenChange(value: boolean, reason?: DrawerOpenChangeReason) {
  if (open.value === value)
    return true
  let isCanceled = false
  const details: DrawerOpenChangeDetails = {
    reason,
    cancel() { isCanceled = true },
    get isCanceled() { return isCanceled },
  }
  emit('update:open', value, details)
  if (isCanceled)
    return false
  uncontrolledOpen.value = value
  return true
}

function handleOpenToggle() {
  handleOpenChange(!open.value, 'trigger-press')
}

// Sync open state with DrawerProvider
watch(open, (isOpen) => {
  if (isOpen) {
    providerContext?.setDrawerOpen(contentId, true)
  }
  else {
    providerContext?.setDrawerOpen(contentId, false)
  }
}, { immediate: true })

// `update:openComplete` is emitted by DrawerContentImpl once the popup's
// animations have finished. DrawerRoot just exposes the notify hook through context.

// Runs before the content unmounts, unlike `onUnmounted`.
onBeforeUnmount(() => {
  isUnmounting = true
})

onUnmounted(() => {
  providerContext?.removeDrawer(contentId)
})
</script>

<template>
  <slot
    :open="open"
    :close="handleClose"
  />
</template>
