<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface EditableSubmitTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { disabledAttr } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'

const props = withDefaults(defineProps<EditableSubmitTriggerProps>(), { as: 'button' })

const context = injectEditableRootContext()
</script>

<template>
  <Primitive
    v-bind="props"
    aria-label="submit"
    :aria-disabled="context.disabled.value ? '' : undefined"
    :data-disabled="context.disabled.value ? '' : undefined"
    :disabled="disabledAttr(context.disabled.value, props.as, props.asChild)"
    :type="as === 'button' ? 'button' : undefined"
    :hidden="context.isEditing.value ? undefined : ''"
    @click="context.submit"
  >
    <slot>Submit</slot>
  </Primitive>
</template>
