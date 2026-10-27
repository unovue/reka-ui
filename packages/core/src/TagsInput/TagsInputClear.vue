<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'

export interface TagsInputClearProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<TagsInputClearProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const context = injectTagsInputRootContext()

function handleCancel() {
  if (context.disabled.value)
    return
  context.modelValue.value = []
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
    :type="as === 'button' ? 'button' : undefined"
    :data-disabled="context.disabled.value ? '' : undefined"
    @click="handleCancel"
  >
    <slot />
  </Primitive>
</template>
