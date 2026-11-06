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

// The overlay can finish leaving before the content. Keep a shared lock until
// this content's own Presence completes, including keep-mounted dialogs.
const shouldLockScroll = computed(() => props.present && props.disableOutsidePointerEvents)
const scrollLocked = useBodyScrollLock(shouldLockScroll.value)
watch(shouldLockScroll, value => scrollLocked.value = value)

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
