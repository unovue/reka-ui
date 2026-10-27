<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { useForwardElement, useForwardPropsEmits, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentImplProps>()
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const isRightClickOutsideRef = ref(false)

// Base UI `PopoverPositioner`: a `modal` popover locks page scroll.
// Only while open: a `forceMount`ed content that is closed keeps no lock,
// backdrop or `aria-hidden` siblings.
const scrollLocked = useBodyScrollLock(rootContext.open.value)
watch(rootContext.open, open => scrollLocked.value = open)

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useHideOthers(computed(() => rootContext.open.value ? currentElement.value : undefined))
</script>

<template>
  <PopoverContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="rootContext.open.value"
    :disable-outside-pointer-events="rootContext.open.value"
    :backdrop-cutout="rootContext.triggerElement.value"
    @close-auto-focus.prevent="
      (event) => {
        emits('closeAutoFocus', event);

        if (!isRightClickOutsideRef) rootContext.triggerElement.value?.focus();
      }
    "
    @pointer-down-outside="
      (event) => {
        emits('pointerDownOutside', event);

        const originalEvent = event.detail.originalEvent;
        const ctrlLeftClick
          = originalEvent.button === 0 && originalEvent.ctrlKey === true;
        const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

        isRightClickOutsideRef = isRightClick;

        // The trigger stays interactive through the backdrop (Base UI cuts it
        // out) and already toggles the popover closed; dismissing here too
        // would close it and immediately reopen it.
        if (rootContext.triggerElement.value?.contains(event.target as Node)) event.preventDefault();
      }
    "
    @focus-outside.prevent
  >
    <slot />
  </PopoverContentImpl>
</template>
