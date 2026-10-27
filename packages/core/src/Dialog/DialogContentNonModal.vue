<script setup lang="ts">
import type { DialogContentImplEmits, DialogContentImplProps } from './DialogContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { useEmitAsProps, useForwardElement } from '@/shared'
import { getPopupRootStore } from '@/shared/popupHandle'
import DialogContentImpl from './DialogContentImpl.vue'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = defineProps<DialogContentImplProps & { present: boolean }>()
const emits = defineEmits<DialogContentImplEmits>()

const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectDialogRootContext()
const handleStore = getPopupRootStore(rootContext)
const hasInteractedOutsideRef = ref(false)
const hasPointerDownOutsideRef = ref(false)

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
    hasInteractedOutsideRef.value = false
    hasPointerDownOutsideRef.value = false
  }
})
</script>

<template>
  <DialogContentImpl
    :ref="forwardRef"
    v-bind="{ ...forwardedProps, ...emitsAsProps }"
    :present="present"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented) {
          if (!hasInteractedOutsideRef) rootContext.triggerElement.value?.focus();
          // Always prevent auto focus because we either focus manually or want user agent focus
          event.preventDefault();
        }

        hasInteractedOutsideRef = false;
        hasPointerDownOutsideRef = false;
      }
    "
    @interact-outside="(event) => {
      if (!event.defaultPrevented) {
        hasInteractedOutsideRef = true;
        if (event.detail.originalEvent.type === 'pointerdown') {
          hasPointerDownOutsideRef = true;
        }
      }

      // Prevent dismissing when clicking the trigger.
      // As the trigger is already setup to close, without doing so would
      // cause it to close and immediately open.
      const target = event.target as HTMLElement;
      const targetIsTrigger = rootContext.triggerElement.value?.contains(target);
      if (targetIsTrigger) event.preventDefault();

      // Another detached trigger of the same handle: its click moves the open
      // dialog there (Base UI), so this press is not a dismissal.
      if (handleStore?.handle.value && handleStore.containsTrigger(target)) {
        event.preventDefault();
        hasInteractedOutsideRef = false;
      }

      // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
      // we will get the pointer down outside event on the trigger, but then a subsequent
      // focus outside event on the container, we ignore any focus outside event when we've
      // already had a pointer down outside event.
      if (event.detail.originalEvent.type === 'focusin' && hasPointerDownOutsideRef) {
        event.preventDefault();
      }
    }"
  >
    <slot />
  </DialogContentImpl>
</template>
