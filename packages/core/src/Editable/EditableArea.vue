<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { injectEditableRootContext } from './EditableRoot.vue'

export interface EditableAreaProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { getEditableAreaSurface } from './useEditable'

const props = withDefaults(defineProps<EditableAreaProps>(), { as: 'div' })

const context = injectEditableRootContext()
// Same derivation as `useEditable().area`.
const area = getEditableAreaSurface(context)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="area.attrs.value"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
