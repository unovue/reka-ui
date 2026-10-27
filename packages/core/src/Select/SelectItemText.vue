<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectSelectRootContext } from './SelectRoot.vue'

export interface SelectItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectItemContext } from './SelectItem.vue'
import { useSelectItemText } from './useSelect'

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

// Registers the text in the root's sticky label registry on mount and update.
const { itemText } = useSelectItemText({
  context: rootContext,
  itemContext,
  contentContext,
  element: itemTextElement,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="mergeProps(itemText.attrs.value, props, $attrs)"
  >
    <slot />
  </Primitive>
</template>
