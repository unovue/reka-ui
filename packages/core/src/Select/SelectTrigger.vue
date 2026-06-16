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

const isDisabled = computed(() => rootContext.disabled?.value || props.disabled)

rootContext.contentId ||= useId(undefined, 'reka-select-content')
onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
})

const { getItems } = useCollection()
const { search, handleTypeaheadSearch, resetTypeahead } = useTypeahead()
function handleOpen() {
  if (!isDisabled.value) {
    rootContext.onOpenChange(true)
    // reset typeahead when we open
    resetTypeahead()
  }
}

function handlePointerOpen(event: PointerEvent) {
  handleOpen()
  rootContext.triggerPointerDownPosRef.value = {
    x: Math.round(event.pageX),
    y: Math.round(event.pageY),
  }
}

function isPlainLeftClick(event: MouseEvent) {
  return event.button === 0 && event.ctrlKey === false
}

// Tracks direct mouse presses handled in `pointerdown` so the Safari label
// `click` workaround below does not re-focus the trigger after opening.
let openedFromPointerDown = false

function onTriggerPointerDown(event: PointerEvent) {
  // Prevent opening on touch down.
  // https://github.com/unovue/reka-ui/issues/804
  if (event.pointerType === 'touch')
    return event.preventDefault()

  // prevent implicit pointer capture
  // https://www.w3.org/TR/pointerevents3/#implicit-pointer-capture
  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId))
    target.releasePointerCapture(event.pointerId)

  // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
  // but not when the control key is pressed (avoiding MacOS right click)
  if (isPlainLeftClick(event)) {
    handlePointerOpen(event)
    openedFromPointerDown = true
  }
}

function onTriggerMouseDown(event: MouseEvent) {
  // Prevent trigger from stealing focus from the active item after opening.
  // We avoid calling `preventDefault` in `pointerdown` because that suppresses
  // compatibility mouse events (`mousedown`, `mouseup`, `click`).
  if (isPlainLeftClick(event))
    event.preventDefault()
}

function onTriggerClick(event: MouseEvent) {
  // Safari: label-associated clicks may not run `pointerdown` on the trigger.
  // Direct mouse clicks open in `pointerdown` and must not re-focus the trigger
  // here — `mousedown` `preventDefault` does not suppress `click`.
  if (!openedFromPointerDown)
    (event.currentTarget as HTMLElement)?.focus()

  openedFromPointerDown = false
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
      @click="onTriggerClick"
      @pointerdown="onTriggerPointerDown"
      @mousedown="onTriggerMouseDown"
      @pointerup.prevent="
        (event: PointerEvent) => {
          // Only open on pointer up when using touch devices
          // https://github.com/unovue/reka-ui/issues/804
          if (event.pointerType === 'touch')
            handlePointerOpen(event)
        }
      "
      @keydown="
        (event: KeyboardEvent) => {
          const isTypingAhead = search !== '';
          const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
          if (!isModifierKey && event.key.length === 1)
            if (isTypingAhead && event.key === ' ') return;

          handleTypeaheadSearch(event.key, getItems());
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
