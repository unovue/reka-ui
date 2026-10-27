<script lang="ts">
import type { ToastRootImplEmits, ToastRootImplProps } from './ToastRootImpl.vue'
import type { ToastOpenChangeReason } from './useToast'
import type { ChangeEventDetails } from '@/shared'
import { useForwardElement } from '@/shared'

export type ToastRootEmits = ToastRootImplEmits & {
  /** Event handler called before the open state changes; `details.cancel()` keeps the toast open. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<ToastOpenChangeReason>]
  /** Event handler called when the open state changes */
  'update:open': [value: boolean, details: ChangeEventDetails<ToastOpenChangeReason>]
  /** Event handler called after the open or close animations of the toast have finished. */
  'update:openComplete': [value: boolean]
}

export interface ToastRootProps extends ToastRootImplProps {
  /** The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Presence } from '@/Presence'
import { injectToastProviderContext } from './ToastProvider.vue'
import ToastRootImpl from './ToastRootImpl.vue'
import { useToastRoot } from './useToast'

const props = withDefaults(defineProps<ToastRootProps>(), {
  type: 'foreground',
  open: undefined,
  defaultOpen: true,
  as: 'li',
})

const emits = defineEmits<ToastRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Remaining time (in ms) */
    remaining: number
    /** Total time the toast will remain visible for (in ms) */
    duration: number
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const providerContext = injectToastProviderContext()

// Every close — timeout, close button, action, swipe, Escape — goes through
// the composable's `useControllableState`, so `beforeUpdate:open` can cancel
// it and `update:open` carries the reason. A managed toast is controlled by
// the manager's store; a committed close is written back to it.
const { open: isOpen, type: resolvedType, duration: resolvedDuration, close } = useToastRoot({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  toast: () => props.toast,
  toastStore: providerContext.toastStore,
  type: () => props.type,
  duration: () => props.duration,
  emit: emits,
})

// A managed toast leaves the list once it is closed and its exit animation has
// unmounted the content (or it closed before the content ever mounted).
const isContentMounted = ref(false)
watch([() => props.toast, isContentMounted], ([toast, mounted]) => {
  if (toast && !toast.open && !mounted)
    providerContext.toastStore.remove(toast.id)
}, { immediate: true })
</script>

<template>
  <!-- A toast mounts open: `appear` stamps `data-starting-style` on its first frame (#2827). -->
  <Presence
    :present="isOpen"
    :force-mount="forceMount"
    appear
    @complete="(value) => emits('update:openComplete', value)"
  >
    <ToastRootImpl
      :ref="forwardRef"
      v-slot="{ remaining, duration: _duration }"
      :open="isOpen"
      :type="resolvedType"
      :as="as"
      :as-child="asChild"
      :duration="resolvedDuration"
      :toast="toast"
      :request-close="close"
      v-bind="$attrs"
      @vue:mounted="isContentMounted = true"
      @vue:unmounted="isContentMounted = false"
      @pause="emits('pause')"
      @resume="emits('resume')"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @swipe-start="emits('swipeStart', $event)"
      @swipe-move="emits('swipeMove', $event)"
      @swipe-cancel="emits('swipeCancel', $event)"
      @swipe-end="emits('swipeEnd', $event)"
    >
      <slot
        :remaining="remaining"
        :duration="_duration"
        :open="isOpen"
      />
    </ToastRootImpl>
  </Presence>
</template>
