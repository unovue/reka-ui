<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { resolveElement, useEmitAsProps, useForwardExpose } from '@/shared'
import DialogContentImpl from './DialogContentImpl.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = defineProps<DialogContentImplProps & { present: boolean }>()
const emits = defineEmits<DialogContentImplEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()

const rootContext = injectDialogRootContext()
const resolveContainer = () => resolveElement(rootContext.container.value)

const hasInteractedOutsideRef = ref(false)
const hasPointerDownOutsideRef = ref(false)

function resetOutsideFlags() {
  hasInteractedOutsideRef.value = false
  hasPointerDownOutsideRef.value = false
}

const forwardedProps = computed(() => {
  const { present: _, ...rest } = props
  return rest
})

// When `unmountOnHide` is `false` the content stays mounted on close, so
// `close-auto-focus` never fires. Restore focus to the trigger manually once
// the content is no longer present, unless the user interacted outside.
watch(() => props.present, (isPresent, wasPresent) => {
  if (!isPresent && wasPresent) {
    if (!hasInteractedOutsideRef.value)
      rootContext.triggerElement.value?.focus()
    resetOutsideFlags()
  }
})
</script>

<template>
  <DialogContentImpl
    v-bind="{ ...forwardedProps, ...emitsAsProps }"
    :present="present"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    @focusin="resetOutsideFlags"
    @pointerdown="resetOutsideFlags"
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented) {
          if (!hasInteractedOutsideRef) rootContext.triggerElement.value?.focus();
          // Always prevent auto focus because we either focus manually or want user agent focus
          event.preventDefault();
        }

        resetOutsideFlags()
      }
    "
    @interact-outside="(event) => {
      const target = event.target as HTMLElement;
      const container = resolveContainer()
      const isOutsideContainer = !!container && !container.contains(target)

      if (!event.defaultPrevented) {
        // skip focus restore, when we are working elsewhere
        if (isOutsideContainer) hasInteractedOutsideRef = true;
        if (event.detail.originalEvent.type === 'pointerdown') {
          hasPointerDownOutsideRef = true;
        }
      }

      // allow working outside of the container
      if (isOutsideContainer) {
        event.preventDefault()
        return
      }

      // Prevent dismissing when clicking the trigger.
      // As the trigger is already setup to close, without doing so would
      // cause it to close and immediately open.
      const targetIsTrigger = rootContext.triggerElement.value?.contains(target);
      if (targetIsTrigger) event.preventDefault();

      // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
      // we will get the pointer down outside event on the trigger, but then a subsequent
      // focus outside event on the container, we ignore any focus outside event when we've
      // already had a pointer down outside event.
      if (event.detail.originalEvent.type === 'focusin' && hasPointerDownOutsideRef) {
        event.preventDefault();
      }

      if (!event.defaultPrevented) hasInteractedOutsideRef = false;
    }"
    @escape-key-down="(event) => {
      if (hasInteractedOutsideRef) event.preventDefault();
    }"
    @keydown.escape="() => {
      // DismissableLayer relies on stacking, so the the most recently opened dialog
      // swallows the other Escape when focused on other dialogs, which is incorrect,
      // since our Dialogs are not actually stacked. The proper solution is to modify
      // DismissableLayer directly, which could be a breaking change (or at the very
      // least will require a separate discussion), so this is a quick fix for now:

      // Note: due to this fix, the escapeKeyDown and dismiss events are not sent properly.
      rootContext.onOpenChange(false)
    }"
  >
    <slot />
  </DialogContentImpl>
</template>
