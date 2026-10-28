<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectSelectRootContext } from './SelectRoot.vue'

export interface SelectItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectItemContext } from './SelectItem.vue'
import { useSelectItemText, useSelectItemTextLabel } from './useSelect'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectItemTextProps>(), {
  as: 'span',
})

const rootContext = injectSelectRootContext()
const contentContext = injectSelectContentContext()
const itemContext = injectSelectItemContext()

const { forwardRef, currentElement: itemTextElement, expose } = useForwardElement()
defineExpose(expose)

// Registers the text in the root's sticky label registry on mount and update;
// a closed content's detached item text registers it once, on mount.
const itemText = contentContext.harvest
  ? useSelectItemTextLabel(rootContext, itemContext, itemTextElement)
  : useSelectItemText({
    context: rootContext,
    itemContext,
    contentContext,
    element: itemTextElement,
  }).itemText
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    v-bind="itemText ? mergeProps(itemText.attrs.value, $attrs) : $attrs"
  >
    <slot />
  </component>
</template>
