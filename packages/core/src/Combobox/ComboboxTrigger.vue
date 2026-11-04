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
import { injectComboboxFieldContext } from './useComboboxField'

const props = withDefaults(defineProps<ComboboxTriggerProps>(), {
  as: 'button',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectComboboxRootContext()
const surface = getComboboxTriggerSurface(rootContext, () => props.disabled)
// Inside a Field, an id of its own: the field's label points at the trigger
// once there's no input to take focus (a consumer `id` falls through and wins).
const fieldContext = injectComboboxFieldContext(null)

onMounted(() => {
  if (currentElement.value)
    rootContext.onTriggerElementChange(currentElement.value)
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :id="fieldContext ? `${fieldContext.field.context.fieldId.value}-trigger` : undefined"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
