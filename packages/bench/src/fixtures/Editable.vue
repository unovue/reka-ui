<script setup>
// Editable: N instances of a typical composition (closed/default state)
import { EditableArea, EditableCancelTrigger, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <EditableRoot default-value="Click to edit">
      <EditableArea><EditablePreview /><EditableInput /></EditableArea>
      <EditableEditTrigger class="edit">
        Edit
      </EditableEditTrigger>
      <EditableSubmitTrigger>Save</EditableSubmitTrigger>
      <EditableCancelTrigger>Cancel</EditableCancelTrigger>
    </EditableRoot>
  </div>
</template>
