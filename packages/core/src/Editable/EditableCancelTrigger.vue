<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface EditableCancelTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { disabledAttr } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'

const props = withDefaults(defineProps<EditableCancelTriggerProps>(), { as: 'button' })

const context = injectEditableRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    aria-label="cancel"
    :aria-disabled="context.disabled.value ? '' : undefined"
    :data-disabled="context.disabled.value ? '' : undefined"
    :disabled="disabledAttr(context.disabled.value, props.as, props.asChild)"
    :type="as === 'button' ? 'button' : undefined"
    :hidden="context.isEditing.value ? undefined : ''"
    @click="context.cancel"
  >
    <slot>Cancel</slot>
  </Primitive>
</template>
