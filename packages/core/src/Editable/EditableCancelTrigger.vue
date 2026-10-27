<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface EditableCancelTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'
import { getEditableTriggerSurface } from './useEditable'

const props = withDefaults(defineProps<EditableCancelTriggerProps>(), { as: 'button' })

const context = injectEditableRootContext()
// Same derivation as `useEditable().cancelTrigger`.
const trigger = getEditableTriggerSurface(context, 'cancel')

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
    <slot>Cancel</slot>
  </Primitive>
</template>
