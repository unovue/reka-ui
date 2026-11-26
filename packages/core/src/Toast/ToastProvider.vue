<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { GlobalToastManager } from './createToastManager'
import type { ToastStore } from './useToastStore'
import type { SwipeDirection } from './utils'
import { useCollection } from '@/Collection'
import { createContext, useTranslations } from '@/shared'

export interface ToastProviderContext {
  label: Readonly<Ref<string>>
  duration: Readonly<Ref<number>>
  disableSwipe: Readonly<Ref<boolean>>
  swipeDirection: Readonly<Ref<SwipeDirection>>
  swipeThreshold: Readonly<Ref<number>>
  disableHoverPause: Readonly<Ref<boolean>>
  disableWindowBlurPause: Readonly<Ref<boolean>>
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
   * Defaults to the `toastLabel` message of `ConfigProvider`.
   * @default 'Notification'
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
   * When `true`, toasts keep counting down while the pointer is over the viewport, so a toast
   * can close while a pointer user is still reading it. Best kept to short status toasts
   * without actions. Keyboard focus inside the viewport and a press or swipe on a toast
   * always pause the toasts.
   * @defaultValue false
   */
  disableHoverPause?: boolean
  /**
   * When `true`, toasts keep counting down while the window is not focused, so a toast can
   * close before the user comes back to the page. Keyboard focus inside the viewport still
   * pauses the toasts until the window is focused again.
   * @defaultValue false
   */
  disableWindowBlurPause?: boolean
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
  duration: 5000,
  swipeDirection: 'right',
  swipeThreshold: 50,
})
useCollection({ isProvider: true })
const t = useTranslations()

if (props.label && typeof props.label === 'string' && !props.label.trim()) {
  const error = 'Invalid prop `label` supplied to `ToastProvider`. Expected non-empty `string`.'
  throw new Error(error)
}

// The provider is a thin bridge: shared settings, stacking and the
// `createToastManager()` subscription live in the composable.
const { context } = useToastProvider({
  label: () => props.label ?? t('toastLabel'),
  duration: () => props.duration,
  disableSwipe: () => props.disableSwipe,
  swipeDirection: () => props.swipeDirection,
  swipeThreshold: () => props.swipeThreshold,
  disableHoverPause: () => props.disableHoverPause,
  disableWindowBlurPause: () => props.disableWindowBlurPause,
  limit: () => props.limit,
  toastManager: () => props.toastManager,
})

provideToastProviderContext(context)
</script>

<template>
  <slot />
</template>
