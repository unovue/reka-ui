<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { getComboboxTriggerSurface } from './useCombobox'

const props = withDefaults(defineProps<ComboboxTriggerProps>(), {
  as: 'button',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectComboboxRootContext()
const surface = getComboboxTriggerSurface(rootContext, () => props.disabled)

onMounted(() => {
  if (currentElement.value)
    rootContext.onTriggerElementChange(currentElement.value)
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
