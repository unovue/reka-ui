<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { GlobalToastManager } from './createToastManager'
import type { ToastStore } from './useToastStore'
import type { SwipeDirection } from './utils'
import { useCollection } from '@/Collection'
import { createContext } from '@/shared'

type ToastProviderContext = {
  label: Ref<string>
  duration: Ref<number>
  disableSwipe: Ref<boolean>
  swipeDirection: Ref<SwipeDirection>
  swipeThreshold: Ref<number>
  pauseOnInteraction: Ref<boolean>
  toastCount: Ref<number>
  viewport: Ref<HTMLElement | undefined>
  onViewportChange: (viewport: HTMLElement) => void
  onToastAdd: () => void
  onToastRemove: () => void
  isFocusedToastEscapeKeyDownRef: Ref<boolean>
  isClosePausedRef: Ref<boolean>
  toastStore: ToastStore
  hovering: Ref<boolean>
  focused: Ref<boolean>
  expanded: ComputedRef<boolean>
  frontmostHeight: ComputedRef<number | undefined>
  closingCount: ComputedRef<number>
  registerToast: (entry: ToastStackEntry) => () => void
  reopenToast: (entry: ToastStackEntry) => void
  getToastStack: (entry: ToastStackEntry) => ToastStackState
}

export interface ToastStackEntry {
  /** Order of the toast; higher is newer. */
  seq: number
  /** Measured natural height in pixels. */
  height: number
  open: boolean
}

export interface ToastStackState {
  /** Position among open toasts, newest first. Closing toasts keep their position in the whole list. */
  index: number
  /** Sum of the heights of the newer open toasts. */
  offsetY: number
  /** Whether the toast is beyond the `limit` of the provider. */
  limited: boolean
}

export interface ToastProviderProps {
  /**
   * An author-localized label for each toast. Used to help screen reader users
   * associate the interruption with a toast.
   * @defaultValue 'Notification'
   */
  label?: string
  /**
   * Time in milliseconds that each toast should remain visible for.
   * @defaultValue 5000
   */
  duration?: number
  /**
   * Whether to disable the ability to swipe to close the toast.
   * @defaultValue false
   */
  disableSwipe?: boolean
  /**
   * Direction of pointer swipe that should close the toast.
   * @defaultValue 'right'
   */
  swipeDirection?: SwipeDirection
  /**
   * Distance in pixels that the swipe must pass before a close is triggered.
   * @defaultValue 50
   */
  swipeThreshold?: number
  /**
   * Whether to pause the toast duration while the viewport is hovered, focused, or the window is blurred.
   * @defaultValue true
   */
  pauseOnInteraction?: boolean
  /**
   * The maximum number of toasts shown at once. Older toasts beyond the limit get
   * `data-limited` and `inert` rather than being removed, so they can be hidden or animated.
   * No limit is applied when unset.
   */
  limit?: number
  /**
   * A manager created with `createToastManager()`, to add toasts from outside
   * components. Its toasts are listed by `useToastManager()`.
   */
  toastManager?: GlobalToastManager
}

export const [injectToastProviderContext, provideToastProviderContext]
  = createContext<ToastProviderContext>('ToastProvider')
</script>

<script setup lang="ts">
import { computed, onMounted, ref, shallowReactive, toRefs, watch } from 'vue'
import { TOAST_MANAGER_SUBSCRIBE } from './createToastManager'
import { useToastStore } from './useToastStore'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastProviderProps>(), {
  label: 'Notification',
  duration: 5000,
  swipeDirection: 'right',
  swipeThreshold: 50,
  pauseOnInteraction: true,
})
const { label, duration, disableSwipe, swipeDirection, swipeThreshold, pauseOnInteraction } = toRefs(props)
useCollection({ isProvider: true })

const viewport = ref<HTMLElement>()
const toastCount = ref(0)
const isFocusedToastEscapeKeyDownRef = ref(false)
const isClosePausedRef = ref(false)

const toastStore = useToastStore()

onMounted(() => {
  // Subscribe on mount only: a module-level manager outlives SSR requests.
  watch(() => props.toastManager, (manager, _, onCleanup) => {
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
  const ordered = [...entries].sort((a, b) => b.seq - a.seq)
  const states = new Map<ToastStackEntry, ToastStackState>()
  let visibleIndex = 0
  let offsetY = 0
  ordered.forEach((entry, index) => {
    const closing = !entry.open
    states.set(entry, {
      index: closing ? index : visibleIndex,
      offsetY,
      limited: !closing && props.limit !== undefined && visibleIndex >= props.limit,
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

if (props.label && typeof props.label === 'string' && !props.label.trim()) {
  const error = 'Invalid prop `label` supplied to `ToastProvider`. Expected non-empty `string`.'
  throw new Error(error)
}

provideToastProviderContext({
  label,
  duration,
  disableSwipe,
  swipeDirection,
  swipeThreshold,
  pauseOnInteraction,
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
  isFocusedToastEscapeKeyDownRef,
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
})
</script>

<template>
  <slot />
</template>
