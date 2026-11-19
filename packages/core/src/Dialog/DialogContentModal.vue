<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { computed, watch } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
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
// Read after rendering, so that a dialog reopened during its exit has its overlay back by then.
watch([() => props.present, rootContext.overlayPresent, rootContext.open], ([present, overlayPresent, open]) => {
  if (!present)
    scrollLocked.value = false
  else if (overlayPresent)
    scrollLocked.value = true
  // An open dialog without an overlay never holds the lock. A closing one keeps what it has.
  else if (open)
    scrollLocked.value = false
}, { immediate: true, flush: 'post' })

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
// focus to the trigger manually once the content is no longer present, unless
// something else took focus meanwhile, e.g. a layer opened while this one was
// animating out.
watch(() => props.present, (isPresent, wasPresent) => {
  if (!isPresent && wasPresent && !hasFocusLeftScope(rootContext.contentElement.value ?? null))
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
          // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there
          if (!hasFocusLeftScope(event.target)) rootContext.triggerElement.value?.focus();
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
