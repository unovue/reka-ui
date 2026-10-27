<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import type { PointerDownOutsideEvent } from '@/DismissableLayer'
import { computed, watch } from 'vue'
import { isOwnBackdropPress } from '@/DismissableLayer/internalBackdrop'
import { useEmitAsProps, useForwardElement, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import DialogContentImpl from './DialogContentImpl.vue'
import { injectDialogOverlayElementContext, injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogContentImplProps & { present: boolean }>(), {
  disableOutsidePointerEvents: true,
})
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const overlayElement = injectDialogOverlayElementContext(null)

const emitsAsProps = useEmitAsProps(emits)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const ariaHiddenTarget = computed(() => props.present ? currentElement.value : undefined)
useHideOthers(ariaHiddenTarget)

// A modal dialog locks page scroll whether or not it renders a `DialogOverlay`
// (Base UI `useDialogRoot`: `useScrollLock(open && modal === true)`).
const scrollLocked = useBodyScrollLock(props.present && rootContext.open.value)
watch(() => props.present && rootContext.open.value, (locked) => {
  scrollLocked.value = locked
})

const forwardedProps = computed(() => {
  const { present: _, ...rest } = props
  return rest
})

function onPointerDownOutside(event: PointerDownOutsideEvent) {
  const originalEvent = event.detail.originalEvent
  const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true
  const isRightClick = originalEvent.button === 2 || ctrlLeftClick

  // If the event is a right-click, we shouldn't close because
  // it is effectively as if we right-clicked the `Overlay`.
  if (isRightClick)
    event.preventDefault()
  // Only a press on this dialog's own backdrop (the internal one or the
  // `DialogOverlay`) dismisses it, not one on an element stacked above the
  // backdrop such as a third-party widget (Base UI `useDialogRoot`, #2822).
  else if (!isOwnBackdropPress(event.target, currentElement.value, overlayElement?.value))
    event.preventDefault()
}

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
    @pointer-down-outside="onPointerDownOutside"
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
