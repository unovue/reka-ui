<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId, useRenderedContentId } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'
import { recordTriggerPress } from './utils'

const props = withDefaults(defineProps<DialogTriggerProps>(), {
  as: 'button',
})
const rootContext = injectDialogRootContext()
const { forwardRef, currentElement } = useForwardExpose()

rootContext.contentId ||= useId(undefined, 'reka-dialog-content')
const contentId = useRenderedContentId(rootContext)
onMounted(() => {
  rootContext.triggerElement.value = currentElement.value
})

function onClick(event: MouseEvent) {
  // Focus returns to this trigger even when the press did not focus it, e.g. while
  // focus is held in another dialog's trap.
  if (!rootContext.open.value)
    recordTriggerPress(rootContext, event.currentTarget as HTMLElement)
  rootContext.onOpenToggle()
}
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    aria-haspopup="dialog"
    :aria-expanded="rootContext.open.value || false"
    :aria-controls="rootContext.open.value ? contentId : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @click="onClick"
  >
    <slot />
  </Primitive>
</template>
