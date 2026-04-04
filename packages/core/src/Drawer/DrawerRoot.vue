<script lang="ts">
import type { Ref } from 'vue'
import type {
  DrawerSnapPoint,
  NestedSwipeProgressStore,
  SwipeDirection,
} from './utils'
import { createContext, useId } from '@/shared'

export interface DrawerRootProps {
  /** v-model:open */
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
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
   * @default true
   */
  snapToSequentialPoints?: boolean
}

export type DrawerRootEmits = {
  'update:open': [value: boolean]
  'update:snapPoint': [value: DrawerSnapPoint | null]
}

export interface DrawerRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<boolean>
  swipeDirection: Ref<SwipeDirection>
  snapPoints: Ref<DrawerSnapPoint[] | undefined>
  activeSnapPoint: Ref<DrawerSnapPoint | null | undefined>
  snapToSequentialPoints: Ref<boolean>
  popupHeight: Ref<number>
  frontmostHeight: Ref<number>
  hasNestedDrawer: Ref<boolean>
  nestedSwiping: Ref<boolean>
  nestedSwipeProgressStore: NestedSwipeProgressStore
  onOpenChange: (value: boolean) => void
  setActiveSnapPoint: (point: DrawerSnapPoint | null) => void
  onPopupHeightChange: (height: number) => void
  onNestedFrontmostHeightChange: (height: number) => void
  onNestedDrawerPresenceChange: (present: boolean) => void
  onNestedSwipingChange: (swiping: boolean) => void
  onNestedSwipeProgressChange: (progress: number) => void
  notifyParentFrontmostHeight?: (height: number) => void
  notifyParentSwipingChange?: (swiping: boolean) => void
  notifyParentSwipeProgressChange?: (progress: number) => void
  notifyParentHasNestedDrawer?: (present: boolean) => void
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
}

export const [injectDrawerRootContext, provideDrawerRootContext]
  = createContext<DrawerRootContext>('DrawerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onUnmounted, ref, toRefs, watch } from 'vue'
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
  snapToSequentialPoints: true,
})
const emit = defineEmits<DrawerRootEmits>()

defineSlots<{
  default?: (props: { open: boolean, close: () => void }) => any
}>()

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const activeSnapPoint = useVModel(props, 'snapPoint', emit, {
  defaultValue: props.defaultSnapPoint ?? null,
  passive: (props.snapPoint === undefined) as false,
  eventName: 'update:snapPoint',
}) as Ref<DrawerSnapPoint | null | undefined>

const { modal, swipeDirection, snapPoints, snapToSequentialPoints } = toRefs(props)

const triggerElement = ref<HTMLElement>()
const contentElement = ref<HTMLElement>()
const popupHeight = ref(0)
const frontmostHeight = ref(0)
const hasNestedDrawer = ref(false)
const nestedSwiping = ref(false)
const nestedSwipeProgressStore = createNestedSwipeProgressStore()

// Optional parent context for nested drawer support
const parentContext = injectDrawerRootContext(null)

// Optional provider context for drawer state tracking
const providerContext = injectDrawerProviderContext(null)

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
  nestedSwiping,
  nestedSwipeProgressStore,
  onOpenChange(value) { open.value = value },
  setActiveSnapPoint(point) { activeSnapPoint.value = point },
  onPopupHeightChange(h) {
    popupHeight.value = h
    providerContext?.visualStateStore.set({ frontmostHeight: h })
  },
  onNestedFrontmostHeightChange(h) { frontmostHeight.value = h },
  onNestedDrawerPresenceChange(present) {
    hasNestedDrawer.value = present
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
  notifyParentFrontmostHeight: parentContext?.onNestedFrontmostHeightChange,
  notifyParentSwipingChange: parentContext?.onNestedSwipingChange,
  notifyParentSwipeProgressChange: parentContext?.onNestedSwipeProgressChange,
  notifyParentHasNestedDrawer: parentContext?.onNestedDrawerPresenceChange,
  triggerElement,
  contentElement,
  contentId: useId(undefined, 'reka-drawer-content'),
  titleId: useId(undefined, 'reka-drawer-title'),
  descriptionId: useId(undefined, 'reka-drawer-description'),
})

// Sync open state with DrawerProvider
const rootContentId = useId(undefined, 'reka-drawer-content')
watch(open, (isOpen) => {
  if (isOpen) {
    providerContext?.setDrawerOpen(rootContentId, true)
  }
  else {
    providerContext?.setDrawerOpen(rootContentId, false)
  }
}, { immediate: true })

onUnmounted(() => {
  providerContext?.removeDrawer(rootContentId)
})
</script>

<template>
  <slot
    :open="open"
    :close="() => open = false"
  />
</template>
