<script setup lang="ts">
import type { TooltipContentImplProps } from './TooltipContentImpl.vue'
import { useEventListener } from '@vueuse/core'
import { useForwardExpose, useForwardProps, useGraceArea } from '@/shared'
import TooltipContentImpl from './TooltipContentImpl.vue'
import { injectTooltipProviderContext } from './TooltipProvider.vue'
import { injectTooltipRootContext } from './TooltipRoot.vue'

const props = defineProps<TooltipContentImplProps>()
const forwardedProps = useForwardProps(props)
const { forwardRef, currentElement } = useForwardExpose()

const { trigger, onClose } = injectTooltipRootContext()
const providerContext = injectTooltipProviderContext()

const { isPointerInTransit, onPointerExit } = useGraceArea(trigger, currentElement)

providerContext.isPointerInTransitRef = isPointerInTransit
onPointerExit(() => {
  onClose()
})

// Tooltip content is not interactive, so it must not block the hover triggers it
// covers (e.g. stacked triggers in a table, where a tooltip opens over the row
// above). Close as soon as the pointer, while over the content, sits above
// another grace-area trigger so that trigger becomes reachable.
useEventListener(currentElement, 'pointermove', (event: PointerEvent) => {
  const content = currentElement.value
  if (!content || event.pointerType === 'touch')
    return

  const coversAnotherTrigger = content.ownerDocument
    .elementsFromPoint?.(event.clientX, event.clientY)
    .some((el) => {
      if (content.contains(el))
        return false
      const coveredTrigger = el.closest('[data-grace-area-trigger]')
      return !!coveredTrigger && coveredTrigger !== trigger.value
    })

  if (coversAnotherTrigger)
    onClose()
})
</script>

<template>
  <TooltipContentImpl
    :ref="forwardRef"
    v-bind="forwardedProps"
  >
    <slot />
  </TooltipContentImpl>
</template>
