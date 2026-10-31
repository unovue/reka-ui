<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { getComboboxCancelSurface } from './useCombobox'

const props = withDefaults(defineProps<ComboboxCancelProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
// Clears the input, then the value (`resetModelValueOnClear`, reason `'clear-press'`), then the search term.
const surface = getComboboxCancelSurface(injectComboboxRootContext())
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
