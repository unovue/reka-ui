<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { ref } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = defineProps<PopoverContentImplProps>()
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const isRightClickOutsideRef = ref(false)

useBodyScrollLock(true)

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement } = useForwardExpose()
useHideOthers(currentElement)
</script>

<template>
  <PopoverContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="rootContext.open.value"
    disable-outside-pointer-events
    @close-auto-focus.prevent="
      (event) => {
        // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there
        if (!isRightClickOutsideRef && !hasFocusLeftScope(event.target)) rootContext.triggerElement.value?.focus();
      }
    "
    @pointer-down-outside="
      (event) => {
        const originalEvent = event.detail.originalEvent;
        const ctrlLeftClick
          = originalEvent.button === 0 && originalEvent.ctrlKey === true;
        const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

        isRightClickOutsideRef = isRightClick;
      }
    "
    @focus-outside.prevent
  >
    <slot />
  </PopoverContentImpl>
</template>
