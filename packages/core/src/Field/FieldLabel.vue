<script lang="ts">
import type { LabelProps } from '@/Label'

export type FieldLabelProps = LabelProps
</script>

<script setup lang="ts">
import { Label } from '@/Label'
import { useForwardExpose } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = defineProps<FieldLabelProps>()

useForwardExpose()

const fieldContext = injectFieldRootContext()
</script>

<template>
  <Label
    v-bind="props"
    :id="fieldContext.labelId.value"
    :for="fieldContext.fieldId.value"
  >
    <slot />
  </Label>
</template>
