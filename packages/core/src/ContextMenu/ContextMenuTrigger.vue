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
</script>

<script setup lang="ts">
import { mergeProps, onMounted } from 'vue'
import { MenuAnchor } from '@/Menu'
import { Primitive } from '@/Primitive'
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
// `data-*` state live in the composable; `MenuAnchor` stays the wrapper.
const trigger = createContextMenuTriggerSurface(rootContext, { disabled: () => props.disabled })

onMounted(() => {
  if (currentElement.value) {
    rootContext.triggerElement.value = currentElement.value
  }
})
</script>

<template>
  <MenuAnchor
    as="template"
    :reference="trigger.reference.value"
  />

  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="mergeProps(trigger.attrs.value, $attrs)"
  >
    <slot />
  </Primitive>
</template>
