<script lang="ts" setup>
import type { EditableRootProps } from '..'
import { EditableArea, EditableCancelTrigger, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from '..'

const props = defineProps<{ editableProps?: EditableRootProps, emits?: { 'onUpdate:modelValue'?: (data: string) => void } }>()
</script>

<template>
  <EditableRoot
    data-testid="root"
    v-bind="props.editableProps"
    v-on="{ 'update:modelValue': props.emits?.['onUpdate:modelValue'] }"
  >
    <EditableArea data-testid="area">
      <EditablePreview data-testid="preview" />
      <EditableInput data-testid="input" />
    </EditableArea>
    <EditableEditTrigger data-testid="edit" />
    <EditableSubmitTrigger data-testid="submit" />
    <EditableCancelTrigger data-testid="cancel" />
  </EditableRoot>
</template>
