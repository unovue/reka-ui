<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface FieldDescriptionProps extends PrimitiveProps {
  /** Id of the element. Auto-generated when not provided. */
  id?: string
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement, useId } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = withDefaults(defineProps<FieldDescriptionProps>(), {
  as: 'p',
})

const fieldContext = injectFieldRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const descriptionId = ref(useId(props.id))

let unregister: (() => void) | undefined
onMounted(() => {
  unregister = fieldContext.registerDescription(descriptionId.value)
})
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="fieldContext.dataAttributes.value"
    :id="descriptionId"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
