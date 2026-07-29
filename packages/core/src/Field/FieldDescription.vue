<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface FieldDescriptionProps extends PrimitiveProps {
  /** Id of the element. Auto-generated when not provided. */
  id?: string
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = withDefaults(defineProps<FieldDescriptionProps>(), {
  as: 'p',
})

const fieldContext = injectFieldRootContext()

useForwardExpose()

const descriptionId = ref(useId(props.id))

let unregister: (() => void) | undefined
onMounted(() => {
  unregister = fieldContext.registerDescription(descriptionId.value)
})
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <Primitive
    :id="descriptionId"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
