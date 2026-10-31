<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectValueProps extends PrimitiveProps {
  /** The content that will be rendered inside the `SelectValue` when no `value` or `defaultValue` is set. */
  placeholder?: string
}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectValue } from './useSelect'

const props = withDefaults(defineProps<SelectValueProps>(), {
  as: 'span',
  placeholder: '',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectSelectRootContext()

watch(currentElement, (el) => {
  rootContext.onValueElementChange(el ?? undefined)
}, { immediate: true })

const { value, selectedLabels, text } = useSelectValue({
  context: rootContext,
  placeholder: () => props.placeholder,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="value.attrs.value"
  >
    <slot
      :selected-label="selectedLabels"
      :selected-labels="selectedLabels"
      :model-value="rootContext.modelValue.value"
    >
      {{ text }}
    </slot>
  </component>
</template>
