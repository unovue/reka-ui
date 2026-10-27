<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'

export interface PopoverTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, useAttrs } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { injectPopoverRootContext } from './PopoverRoot.vue'

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
  as: 'button',
})

const rootContext = injectPopoverRootContext()

const { forwardRef, currentElement: triggerElement } = useForwardExpose()

const attrs = useAttrs()

rootContext.triggerId ||= (attrs.id as string | undefined) || useId(undefined, 'reka-popover-trigger')
rootContext.contentId ||= useId(undefined, 'reka-popover-content')
onMounted(() => {
  rootContext.triggerElement.value = triggerElement.value
  // With `asChild`, an id set on the child element wins over the one passed
  // to Primitive (Slot gives child props priority), so `aria-labelledby` must
  // follow the id the trigger actually rendered.
  if (triggerElement.value?.id)
    rootContext.triggerId = triggerElement.value.id
})
</script>

<template>
  <component
    :is="rootContext.hasCustomAnchor.value ? Primitive : PopperAnchor"
    as-child
  >
    <Primitive
      :id="rootContext.triggerId"
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined"
      aria-haspopup="dialog"
      :aria-expanded="rootContext.open.value"
      :aria-controls="rootContext.open.value ? rootContext.contentId : undefined"
      :data-state="rootContext.open.value ? 'open' : 'closed'"
      :as="as"
      :as-child="props.asChild"
      @click="rootContext.onOpenToggle"
    >
      <slot />
    </Primitive>
  </component>
</template>
