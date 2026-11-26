<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { ref, watch } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { containsComposed, useForwardElement, useForwardPropsEmits } from '@/shared'
import { getPopupRootStore } from '@/shared/popupHandle'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverContentImplProps & { present?: boolean }>(), { present: true })
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const handleStore = getPopupRootStore(rootContext)
const hasInteractedOutsideRef = ref(false)
const hasPointerDownOutsideRef = ref(false)

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// A content kept mounted while closed never unmounts its focus scope, so
// `closeAutoFocus` does not fire on close. Return focus to the trigger once the
// content is no longer present, unless the user interacted outside or
// something else took focus meanwhile.
watch(() => props.present, (isPresent, wasPresent) => {
  if (!isPresent && wasPresent) {
    if (!hasInteractedOutsideRef.value && !hasFocusLeftScope(currentElement.value ?? null))
      rootContext.triggerElement.value?.focus()
    hasInteractedOutsideRef.value = false
    hasPointerDownOutsideRef.value = false
  }
})
</script>

<template>
  <PopoverContentImpl
    :ref="forwardRef"
    v-bind="forwarded"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented) {
          // Hidden kept-mounted content returned focus when it hid; its final unmount leaves focus alone.
          // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there.
          if (!hasInteractedOutsideRef && present && !hasFocusLeftScope(event.target)) rootContext.triggerElement.value?.focus();
          // Always prevent auto focus because we either focus manually or want user agent focus
          event.preventDefault();
        }

        hasInteractedOutsideRef = false;
        hasPointerDownOutsideRef = false;
      }
    "
    @interact-outside="
      async (event) => {
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
        const trigger = rootContext.triggerElement.value;
        const targetIsTrigger = !!trigger && containsComposed(trigger, target);
        if (targetIsTrigger) event.preventDefault();

        // Another detached trigger of the same handle: its click moves the open
        // popover there (Base UI), so this press is not a dismissal.
        if (handleStore?.handle.value && handleStore.containsTrigger(target)) {
          event.preventDefault();
          hasInteractedOutsideRef = false;
        }

        // On Safari if the trigger is inside a container with tabIndex={0}, when clicked
        // we will get the pointer down outside event on the trigger, but then a subsequent
        // focus outside event on the container, we ignore any focus outside event when we've
        // already had a pointer down outside event.
        if (
          event.detail.originalEvent.type === 'focusin'
          && hasPointerDownOutsideRef
        ) {
          event.preventDefault();
        }
      }
    "
  >
    <slot />
  </PopoverContentImpl>
</template>
