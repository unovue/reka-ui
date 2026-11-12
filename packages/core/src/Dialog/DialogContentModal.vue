<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { computed, watch } from 'vue'
import { useEmitAsProps, useForwardExpose, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import DialogContentImpl from './DialogContentImpl.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogContentImplProps & { present: boolean }>(), {
  disableOutsidePointerEvents: true,
})
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()

// The overlay is what locks body scroll, and without one the page stays scrollable. Its lock
// ends when it unmounts, which is right away if it has no exit animation of its own, so the
// content takes a share of that lock and keeps it until it has finished leaving as well.
const scrollLocked = useBodyScrollLock(false)
watch([() => props.present, rootContext.overlayPresent], ([present, overlayPresent], previous) => {
  if (!present)
    scrollLocked.value = false
  else if (overlayPresent)
    scrollLocked.value = true
  // An overlay taken away while the dialog stays open gives the scroll back.
  else if (previous?.[1] && rootContext.open.value)
    scrollLocked.value = false
}, { immediate: true })

const emitsAsProps = useEmitAsProps(emits)

const { forwardRef, currentElement } = useForwardExpose()

const ariaHiddenTarget = computed(() => props.present ? currentElement.value : undefined)
useHideOthers(ariaHiddenTarget)

const forwardedProps = computed(() => {
  const { present: _, ...rest } = props
  return rest
})

// When `unmountOnHide` is `false` the content stays mounted on close, so
// `FocusScope` never unmounts and `close-auto-focus` never fires. Restore
// focus to the trigger manually once the content is no longer present.
watch(() => props.present, (isPresent, wasPresent) => {
  if (!isPresent && wasPresent)
    rootContext.triggerElement.value?.focus()
})
</script>

<template>
  <DialogContentImpl
    v-bind="{ ...forwardedProps, ...emitsAsProps }"
    :ref="forwardRef"
    :present="present"
    :trap-focus="rootContext.open.value"
    :disable-outside-pointer-events="props.disableOutsidePointerEvents"
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented) {
          event.preventDefault();
          rootContext.triggerElement.value?.focus();
        }
      }
    "
    @pointer-down-outside="
      (event) => {
        const originalEvent = event.detail.originalEvent;
        const ctrlLeftClick
          = originalEvent.button === 0 && originalEvent.ctrlKey === true;
        const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

        // If the event is a right-click, we shouldn't close because
        // it is effectively as if we right-clicked the `Overlay`.
        if (isRightClick) event.preventDefault();
      }
    "
    @focus-outside="
      (event) => {
        // When focus is trapped, a `focusout` event may still happen.
        // We make sure we don't trigger our `onDismiss` in such case.
        event.preventDefault();
      }
    "
  >
    <slot />
  </DialogContentImpl>
</template>
