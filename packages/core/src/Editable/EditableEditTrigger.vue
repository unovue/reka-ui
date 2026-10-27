<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface EditableEditTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'
import { getEditableTriggerSurface } from './useEditable'

const props = withDefaults(defineProps<EditableEditTriggerProps>(), { as: 'button' })

const context = injectEditableRootContext()
// Same derivation as `useEditable().editTrigger`.
const trigger = getEditableTriggerSurface(context, 'edit')

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="trigger.attrs.value"
    :as="props.as"
    :as-child="props.asChild"
    :type="as === 'button' ? 'button' : undefined"
  >
    <slot>Edit</slot>
  </Primitive>
</template>
