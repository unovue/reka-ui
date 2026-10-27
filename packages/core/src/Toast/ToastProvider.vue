<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { GlobalToastManager } from './createToastManager'
import type { ToastStore } from './useToastStore'
import type { SwipeDirection } from './utils'
import { useCollection } from '@/Collection'
import { createContext } from '@/shared'

export interface ToastProviderContext {
  label: Readonly<Ref<string>>
  duration: Readonly<Ref<number>>
  disableSwipe: Readonly<Ref<boolean>>
  swipeDirection: Readonly<Ref<SwipeDirection>>
  swipeThreshold: Readonly<Ref<number>>
  toastCount: Ref<number>
  viewport: Ref<HTMLElement | undefined>
  onViewportChange: (viewport: HTMLElement) => void
  onToastAdd: () => void
  onToastRemove: () => void
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
import { useToastProvider } from './useToast'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastProviderProps>(), {
  label: 'Notification',
  duration: 5000,
  swipeDirection: 'right',
  swipeThreshold: 50,
})
useCollection({ isProvider: true })

if (props.label && typeof props.label === 'string' && !props.label.trim()) {
  const error = 'Invalid prop `label` supplied to `ToastProvider`. Expected non-empty `string`.'
  throw new Error(error)
}

// The provider is a thin bridge: shared settings, stacking and the
// `createToastManager()` subscription live in the composable.
const { context } = useToastProvider({
  label: () => props.label,
  duration: () => props.duration,
  disableSwipe: () => props.disableSwipe,
  swipeDirection: () => props.swipeDirection,
  swipeThreshold: () => props.swipeThreshold,
  limit: () => props.limit,
  toastManager: () => props.toastManager,
})

provideToastProviderContext(context)
</script>

<template>
  <slot />
</template>
