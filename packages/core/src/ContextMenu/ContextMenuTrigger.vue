<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ContextMenuTriggerProps extends PrimitiveProps {
  /**
   * When `true`, the context menu would not open when right-clicking.
   *
   * Note that this will also restore the native context menu.
   */
  disabled?: boolean
}

const NO_ELEMENT = { value: undefined }
</script>

<script setup lang="ts">
import { mergeProps, onMounted } from 'vue'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectContextMenuRootContext } from './ContextMenuRoot.vue'
import { createContextMenuTriggerSurface } from './useContextMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ContextMenuTriggerProps>(), {
  as: 'span',
  disabled: false,
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectContextMenuRootContext()

// The right-click / long-press machine, the anchor reference and the
// `data-*` state live in the composable. The anchor is the pointer
// position (`reference`), not the trigger.
const trigger = createContextMenuTriggerSurface(rootContext, { disabled: () => props.disabled })
usePopperAnchor({ element: NO_ELEMENT, reference: () => trigger.reference.value })

onMounted(() => {
  if (currentElement.value) {
    rootContext.triggerElement.value = currentElement.value
  }
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(trigger.attrs.value, $attrs)"
  >
    <slot />
  </component>
</template>
