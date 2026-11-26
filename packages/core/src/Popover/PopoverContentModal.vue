<script setup lang="ts">
import type { PopoverContentImplEmits, PopoverContentImplProps } from './PopoverContentImpl.vue'
import { computed, ref, watch } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { containsComposed, useForwardElement, useForwardPropsEmits, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import PopoverContentImpl from './PopoverContentImpl.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverContentImplProps & { present?: boolean }>(), { present: true })
const emits = defineEmits<PopoverContentImplEmits>()
const rootContext = injectPopoverRootContext()
const isRightClickOutsideRef = ref(false)

// Base UI `PopoverPositioner`: a `modal` popover locks page scroll.
// Only while open and shown: a content kept mounted while closed (`forceMount`,
// `unmountOnHide: false`) keeps no lock, backdrop or `aria-hidden` siblings.
const isActive = computed(() => props.present && rootContext.open.value)
const scrollLocked = useBodyScrollLock(isActive.value)
watch(isActive, active => scrollLocked.value = active)

const forwarded = useForwardPropsEmits(props, emits)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useHideOthers(computed(() => isActive.value ? currentElement.value : undefined))

// A content kept mounted while closed never unmounts its focus scope, so
// `closeAutoFocus` does not fire on close. Return focus to the trigger once the
// content is no longer present instead, unless something else took focus
// meanwhile, e.g. a layer opened while this one was animating out.
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
    :disable-outside-pointer-events="rootContext.open.value"
    :backdrop-cutout="rootContext.triggerElement.value"
    @close-auto-focus.prevent="
      (event) => {
        // Hidden kept-mounted content returned focus when it hid; its final unmount leaves focus alone.
        // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there.
        if (!isRightClickOutsideRef && present && !hasFocusLeftScope(event.target)) rootContext.triggerElement.value?.focus();
      }
    "
    @pointer-down-outside="
      (event) => {
        const originalEvent = event.detail.originalEvent;
        const ctrlLeftClick
          = originalEvent.button === 0 && originalEvent.ctrlKey === true;
        const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

        isRightClickOutsideRef = isRightClick;

        // The trigger stays interactive through the backdrop (Base UI cuts it
        // out) and already toggles the popover closed; dismissing here too
        // would close it and immediately reopen it.
        const trigger = rootContext.triggerElement.value;
        if (trigger && containsComposed(trigger, event.target as Node)) event.preventDefault();
      }
    "
    @focus-outside.prevent
  >
    <slot />
  </PopoverContentImpl>
</template>
