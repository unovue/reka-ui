<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxCancelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { useAgentItem } from '@/shared/useAgentRegistration'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { getComboboxCancelSurface } from './useCombobox'

const props = withDefaults(defineProps<ComboboxCancelProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
// Clears the value (reason `'clear-press'`, unless `resetModelValueOnClear` is `false`), then the input and the search term.
const rootContext = injectComboboxRootContext()
const surface = getComboboxCancelSurface(rootContext)
useAgentItem(rootContext, props, undefined, 'clear')
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
