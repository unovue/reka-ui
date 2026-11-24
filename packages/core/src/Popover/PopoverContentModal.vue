<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverContentImplProps & { present?: boolean }>(), { present: true })
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const isRightClickOutsideRef = ref(false)

// A content kept mounted while closed (`unmountOnHide: false`) holds the lock only while shown.
const scrollLocked = useBodyScrollLock(props.present)
watch(() => props.present, (present) => {
  scrollLocked.value = present
})

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement } = useForwardExpose()
// A closing content hands Escape, outside interaction and the accessibility tree back
// to the layer below at once, while it animates out.
useHideOthers(computed(() => rootContext.open.value && props.present ? currentElement.value : undefined))

// When `unmountOnHide` is `false` the content stays mounted on close, so
// `FocusScope` never unmounts and `close-auto-focus` never fires. Restore
// focus to the trigger manually once the content is no longer present, unless
// something else took focus meanwhile, e.g. a layer opened while this one was
// animating out.
watch(() => props.present, (isPresent, wasPresent) => {
  if (!isPresent && wasPresent) {
    if (!isRightClickOutsideRef.value && !hasFocusLeftScope(currentElement.value ?? null))
      rootContext.triggerElement.value?.focus()
    isRightClickOutsideRef.value = false
  }
})
</script>

<template>
  <PopoverContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="rootContext.open.value"
    disable-outside-pointer-events
    @close-auto-focus="
      (event) => {
        if (!event.defaultPrevented) {
          event.preventDefault();
          // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there
          if (!isRightClickOutsideRef && !hasFocusLeftScope(event.target)) rootContext.triggerElement.value?.focus();
        }
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
