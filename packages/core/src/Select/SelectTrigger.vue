<script lang="ts">
import { useCollection } from '@/Collection'

export interface SelectTriggerProps extends PopperAnchorProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { computed, onMounted } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId, useTypeahead } from '@/shared'
import {
  injectSelectRootContext,
} from './SelectRoot.vue'
import { OPEN_KEYS, shouldShowPlaceholder } from './utils'

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  as: 'button',
})
const rootContext = injectSelectRootContext()
const { forwardRef, currentElement: triggerElement } = useForwardExpose()

// eslint-disable-next-line prefer-const
let pointerTypeRef: PointerEvent['pointerType'] = 'touch'

const isDisabled = computed(() => rootContext.disabled?.value || props.disabled)

rootContext.contentId ||= useId(undefined, 'reka-select-content')
onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
})

const { getItems } = useCollection()
const { search, handleTypeaheadSearch, resetTypeahead } = useTypeahead()
function handleOpen(pointerEvent?: MouseEvent | PointerEvent) {
  if (!isDisabled.value) {
    rootContext.onOpenChange(true)
    // reset typeahead when we open
    resetTypeahead()
  }

  if (pointerEvent) {
    rootContext.triggerPointerDownPosRef.value = {
      x: Math.round(pointerEvent.pageX),
      y: Math.round(pointerEvent.pageY),
    }
  }
}
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      role="combobox"
      :type="as === 'button' ? 'button' : undefined"
      :aria-controls="rootContext.contentId"
      :aria-expanded="rootContext.open.value || false"
      :aria-required="rootContext.required?.value"
      aria-autocomplete="none"
      :disabled="isDisabled"
      :dir="rootContext?.dir.value"
      :data-state="rootContext?.open.value ? 'open' : 'closed'"
      :data-disabled="isDisabled ? '' : undefined"
      :data-placeholder="shouldShowPlaceholder(rootContext.modelValue?.value) ? '' : undefined"
      :as-child="asChild"
      :as="as"
      @click="
        (event: PointerEvent) => {
          // Whilst browsers generally have no issue focusing the trigger when clicking
          // on a label, Safari seems to struggle with the fact that there's no `onClick`.
          // We force `focus` in this case. Note: this doesn't create any other side-effect
          // because we are preventing default in `onPointerDown` so effectively
          // this only runs for a label 'click'
          (event?.currentTarget as HTMLElement)?.focus();

          if (pointerTypeRef !== 'mouse') {
            handleOpen(event);
          }
        }
      "
      @pointerdown="
        (event: PointerEvent) => {
          pointerTypeRef = event.pointerType;

          // prevent implicit pointer capture
          // https://www.w3.org/TR/pointerevents3/#implicit-pointer-capture
          const target = event.target as HTMLElement;
          if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
          }

          // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
          // but not when the control key is pressed (avoiding MacOS right click)
          if (event.button === 0 && event.ctrlKey === false && event.pointerType === 'mouse') {
            handleOpen(event)
            // prevent trigger from stealing focus from the active item after opening.
            event.preventDefault();
          }
        }
      "
      @keydown="
        (event) => {
          const isTypingAhead = search !== '';
          const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
          if (!isModifierKey && event.key.length === 1) handleTypeaheadSearch(event.key, getItems() ?? []);
          if (isTypingAhead && event.key === ' ') return;
          if (OPEN_KEYS.includes(event.key)) {
            handleOpen();
            event.preventDefault();
          }
        }
      "
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
