<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps, onBeforeUnmount, onMounted, watch } from 'vue'
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
// Its focus and blur are the combobox's, as the input's are: with no input,
// it's the part the field focuses and the one that touches it.
const fieldContext = injectComboboxFieldContext(null)

onMounted(() => {
  if (currentElement.value)
    rootContext.onTriggerElementChange(currentElement.value)
})

if (fieldContext) {
  // Followed, not read once: an as-child swap replaces the element, and an
  // unmounted trigger must not stay the element the field focuses.
  watch(currentElement, (element, previous) => {
    if (element)
      rootContext.onTriggerElementChange(element)
    else if (rootContext.triggerElement.value === previous)
      rootContext.onTriggerElementChange(undefined)
  }, { flush: 'post' })
  onBeforeUnmount(() => {
    if (rootContext.triggerElement.value === currentElement.value)
      rootContext.onTriggerElementChange(undefined)
  })
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :id="fieldContext ? `${fieldContext.field.context.fieldId.value}-trigger` : undefined"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="fieldContext ? mergeProps(surface.attrs.value, { onFocus: fieldContext.onFocus, onBlur: fieldContext.onBlur }) : surface.attrs.value"
  >
    <slot />
  </component>
</template>
