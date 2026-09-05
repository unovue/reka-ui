<script lang="ts">
import type { DisclosureState } from '@/shared'
import { useForwardExpose, useId } from '@/shared'

export type TooltipTriggerDataState = DisclosureState

export interface TooltipTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { computed, onMounted, ref } from 'vue'
import { PopperAnchor } from '@/Popper'
import {
  Primitive,
} from '@/Primitive'
import { injectTooltipProviderContext } from './TooltipProvider.vue'
import { injectTooltipRootContext } from './TooltipRoot.vue'

const props = withDefaults(defineProps<TooltipTriggerProps>(), {
  as: 'button',
})
const rootContext = injectTooltipRootContext()
const providerContext = injectTooltipProviderContext()

rootContext.contentId ||= useId(undefined, 'reka-tooltip-content')

const { forwardRef, currentElement: triggerElement } = useForwardExpose()

const isPointerDown = ref(false)
const hasPointerMoveOpened = ref(false)

const tooltipListeners = computed(() => {
  if (rootContext.disabled.value)
    return {}

  return {
    click: handleClick,
    focus: handleFocus,
    pointermove: handlePointerMove,
    pointerleave: handlePointerLeave,
    pointerdown: handlePointerDown,
    blur: handleBlur,
  }
})

onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
})

function handlePointerUp() {
  setTimeout(() => {
    isPointerDown.value = false
  }, 1)
}

function handlePointerDown(event: PointerEvent) {
  if (rootContext.open.value && !rootContext.disableClosingTrigger.value) {
    rootContext.onClose('trigger-press', event)
  }
  isPointerDown.value = true
  document.addEventListener('pointerup', handlePointerUp, { once: true })
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch')
    return
  if (
    !hasPointerMoveOpened.value && !providerContext.isPointerInTransitRef.value
  ) {
    rootContext.onTriggerEnter(event)
    hasPointerMoveOpened.value = true
  }
}

function handlePointerLeave(event: PointerEvent) {
  rootContext.onTriggerLeave(event)
  hasPointerMoveOpened.value = false
}

function handleFocus(event: FocusEvent) {
  if (isPointerDown.value)
    return

  if (rootContext.ignoreNonKeyboardFocus.value && !(event.target as HTMLElement).matches?.(':focus-visible'))
    return

  rootContext.onOpen('trigger-focus', event)
}

function handleBlur(event: FocusEvent) {
  rootContext.onClose('trigger-blur', event)
}

function handleClick(event: MouseEvent) {
  if (!rootContext.disableClosingTrigger.value)
    rootContext.onClose('trigger-press', event)
}
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      :aria-describedby="
        rootContext.open.value ? rootContext.contentId : undefined
      "
      :data-state="rootContext.stateAttribute.value"
      :data-delayed="rootContext.isDelayed.value ? '' : undefined"
      :as="as"
      :as-child="props.asChild"
      data-grace-area-trigger
      v-on="tooltipListeners"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
