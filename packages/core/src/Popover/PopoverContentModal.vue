<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverContentImplProps & { present?: boolean }>(), { present: true })
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const isRightClickOutsideRef = ref(false)

const scrollLocked = useBodyScrollLock(props.present)
watch(() => props.present, (present) => {
  scrollLocked.value = present
})

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement } = useForwardExpose()
useHideOthers(computed(() => props.present ? currentElement.value : undefined))
</script>

<template>
  <PopoverContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="rootContext.open.value"
    disable-outside-pointer-events
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
      }
    "
    @focus-outside.prevent
  >
    <slot />
  </PopoverContentImpl>
</template>
