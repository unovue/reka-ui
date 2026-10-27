<script lang="ts">
import type { Ref } from 'vue'
import type { ToastObject } from './createToastManager'
import type { ToastOpenChangeReason } from './useToast'
import type { SwipeEvent } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason } from '@/shared'
import { useCollection } from '@/Collection'
import { createContext, getActiveElement, useForwardElement } from '@/shared'

export type ToastRootImplEmits = {
  /** Event handler called when the escape key is down. It can be prevented by calling `event.preventDefault`. */
  escapeKeyDown: [event: KeyboardEvent]
  /** Event handler called when the dismiss timer is paused. This occurs when the pointer is moved over the viewport, the viewport is focused or when the window is blurred. */
  pause: []
  /** Event handler called when the dismiss timer is resumed. This occurs when the pointer is moved away from the viewport, the viewport is blurred or when the window is focused. */
  resume: []
  /** Event handler called when starting a swipe interaction. It can be prevented by calling `event.preventDefault`. */
  swipeStart: [event: SwipeEvent]
  /** Event handler called during a swipe interaction. It can be prevented by calling `event.preventDefault`. */
  swipeMove: [event: SwipeEvent]
  /** Event handler called when swipe interaction is cancelled. It can be prevented by calling `event.preventDefault`. */
  swipeCancel: [event: SwipeEvent]
  /** Event handler called at the end of a swipe interaction. It can be prevented by calling `event.preventDefault`. */
  swipeEnd: [event: SwipeEvent]
}

export interface ToastRootImplProps extends PrimitiveProps {
  /**
   * Control the sensitivity of the toast for accessibility purposes.
   *
   * For toasts that are the result of a user action, choose `foreground`. Toasts generated from background tasks should use `background`.
   */
  type?: 'foreground' | 'background'
  /**
   * The controlled open state of the dialog. Can be bind as `v-model:open`.
   */
  open?: boolean
  /**
   * Time in milliseconds that toast should remain visible for. Overrides value
   * given to `ToastProvider`.
   */
  duration?: number
  /**
   * A toast from `useToastManager()`. Its `open`, `duration`, `type` and `status` drive the toast,
   * and `ToastTitle`, `ToastDescription` and `ToastAction` render its content.
   */
  toast?: ToastObject
}

/** Internal: the close of `useToastRoot()`, handed down by `ToastRoot`. */
interface ToastRootImplInternalProps {
  requestClose?: (reason: ToastOpenChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface ToastRootContext {
  /**
   * Closes the toast. `reason` defaults to `'imperative-action'`; a click with an
   * empty `pointerType` (a keyboard activation) moves focus to the viewport.
   * Returns `false` when the toast was already closed or the close was cancelled.
   */
  onClose: (event?: Event, reason?: ToastOpenChangeReason | BaseChangeReason) => boolean
  toast: Ref<ToastObject | undefined>
}

export const [injectToastRootContext, provideToastRootContext]
  = createContext<ToastRootContext>('ToastRoot')
</script>

<script setup lang="ts">
import { onKeyStroke, useResizeObserver } from '@vueuse/core'
import { computed, mergeProps, onMounted, onUnmounted, reactive, shallowRef, toRef, watch, watchEffect } from 'vue'
import { Primitive } from '@/Primitive'
import ToastAnnounce from './ToastAnnounce.vue'
import { injectToastPositionerContext } from './ToastPositioner.vue'
import { injectToastProviderContext } from './ToastProvider.vue'
import { getToastSurface, useToastSwipe, useToastTimer } from './useToast'
import { getAnnounceTextContent, VIEWPORT_PAUSE, VIEWPORT_RESUME } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastRootImplProps & ToastRootImplInternalProps>(), {
  open: false,
  as: 'li',
})

const emits = defineEmits<ToastRootImplEmits>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const { CollectionItem } = useCollection()

const providerContext = injectToastProviderContext()
const duration = computed(
  () => typeof props.duration === 'number'
    ? props.duration
    : providerContext.duration.value,
)

function handleClose(event?: Event, reason: ToastOpenChangeReason | BaseChangeReason = 'imperative-action') {
  const isNonPointerEvent = (event as PointerEvent | undefined)?.pointerType === ''
  const isFocusInToast = currentElement.value?.contains(getActiveElement())

  // A cancelled close (`beforeUpdate:open`) leaves focus and the pause state alone.
  if (!props.requestClose?.(reason, event))
    return false

  // reka: update to only perform focus when user focus via keyboard
  // focus viewport if focus is within toast to read the remaining toast
  // count to SR users and ensure focus isn't lost
  if (isFocusInToast && isNonPointerEvent)
    providerContext.viewport.value?.focus()

  if (isNonPointerEvent) {
    // when manually close the toast, we reset isClosePausedRef
    providerContext.isClosePausedRef.value = false
  }
  return true
}

const positionerContext = injectToastPositionerContext(null)

// Read after the DOM updates, and again when a managed toast changes, so that an
// updated toast (e.g. a promise going from loading to success) is announced again.
const announceTextContent = shallowRef<string[] | null>(null)
watch([currentElement, () => props.toast?.updateKey], ([element]) => {
  announceTextContent.value = element ? getAnnounceTextContent(element) : null
}, { flush: 'post', immediate: true })

const stackEntry = reactive({ seq: 0, height: 0, open: props.open })
const stack = computed(() => providerContext.getToastStack(stackEntry))

function measureHeight() {
  const element = currentElement.value
  if (!element)
    return
  // Measure the natural height, even when styles collapse the toast to the frontmost height.
  const previousHeight = element.style.height
  element.style.height = 'auto'
  stackEntry.height = element.offsetHeight
  element.style.height = previousHeight
}

useResizeObserver(currentElement, measureHeight)
watch(() => props.toast?.updateKey, measureHeight, { flush: 'post' })

watch(() => props.open, (open, wasOpen) => {
  stackEntry.open = open
  if (open && !wasOpen)
    providerContext.reopenToast(stackEntry)
})

if (props.type && !['foreground', 'background'].includes(props.type)) {
  const error = 'Invalid prop `type` supplied to `Toast`. Expected `foreground | background`.'
  throw new Error(error)
}

// The auto-dismiss timer (re)starts when the toast opens, its duration changes
// or a managed toast is added again with the same id. A timeout whose close is
// cancelled expires the timer instead of asking again every `duration`.
const restartKey = computed(() => props.toast ? providerContext.toastStore.getRestartKey(props.toast.id) : 0)
const { remaining: remainingTime, pause, resume } = useToastTimer({
  open: () => props.open,
  duration,
  restartKey,
  isPaused: () => providerContext.isClosePausedRef.value,
  onTimeout: () => handleClose(undefined, 'timeout'),
  onPause: () => emits('pause'),
  onResume: () => emits('resume'),
})

watchEffect((cleanupFn) => {
  const viewport = providerContext.viewport.value
  if (viewport) {
    viewport.addEventListener(VIEWPORT_PAUSE, pause)
    viewport.addEventListener(VIEWPORT_RESUME, resume)
    cleanupFn(() => {
      viewport.removeEventListener(VIEWPORT_PAUSE, pause)
      viewport.removeEventListener(VIEWPORT_RESUME, resume)
    })
  }
})

const { swipe } = useToastSwipe({
  swipeDirection: providerContext.swipeDirection,
  swipeThreshold: providerContext.swipeThreshold,
  disabled: providerContext.disableSwipe,
  emit: emits,
  onSwipeEnd: event => handleClose(event, 'swipe'),
})

const toastSurface = getToastSurface({
  providerContext,
  open: () => props.open,
  status: () => props.toast?.status,
  stack: () => stack.value,
  height: () => stackEntry.height,
})

onKeyStroke('Escape', (event) => {
  emits('escapeKeyDown', event)
  if (!event.defaultPrevented && handleClose(event, 'escape-key'))
    providerContext.isFocusedToastEscapeKeyDownRef.value = true
})

let unregisterToast: (() => void) | undefined
onMounted(() => {
  providerContext.onToastAdd()
  unregisterToast = providerContext.registerToast(stackEntry)
  measureHeight()
})
onUnmounted(() => {
  providerContext.onToastRemove()
  unregisterToast?.()
})

provideToastRootContext({ onClose: handleClose, toast: toRef(props, 'toast') })
</script>

<template>
  <ToastAnnounce
    v-if="announceTextContent"
    :key="toast?.updateKey ?? 0"
    role="alert"
    :aria-live="type === 'foreground' ? 'assertive' : 'polite'"
  >
    <!--
      Render each chunk as its own text node so screen readers get the
      natural pause break between nodes (see comment in utils.ts).
      Interpolating the array directly with `{{ announceTextContent }}`
      would route through Vue's `toDisplayString`, which JSON-stringifies
      arrays — the live region would then announce literal `[`, quotes
      and commas instead of the toast title and description.
    -->
    <template
      v-for="(text, i) in announceTextContent"
      :key="i"
    >
      {{ text }}
    </template>
  </ToastAnnounce>

  <Teleport
    v-if="providerContext.viewport.value || positionerContext"
    :to="providerContext.viewport.value ?? 'body'"
    :disabled="!!positionerContext"
  >
    <CollectionItem>
      <Primitive
        v-bind="mergeProps($attrs, toastSurface.attrs.value, swipe.attrs.value, { tabindex: $attrs.tabindex ?? '0' })"
        :ref="forwardRef"
        :as="as"
        :as-child="asChild"
      >
        <slot
          :remaining="remainingTime"
          :duration="duration"
        />
      </Primitive>
    </CollectionItem>
  </Teleport>
</template>
