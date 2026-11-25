<script setup vapor lang="ts">
import { EditableArea, EditableCancelTrigger, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from '#reka'
import { ref } from 'vue'

const value = ref('Hello')
defineExpose({ value })
</script>

<template>
  <EditableRoot
    id="editable"
    v-slot="{ isEditing }"
    v-model="value"
    placeholder="Type…"
    submit-mode="enter"
  >
    <EditableArea id="area">
      <EditablePreview id="preview" />
      <EditableInput
        id="input"
        aria-label="Greeting"
      />
    </EditableArea>
    <EditableEditTrigger
      v-if="!isEditing"
      id="edit"
    >
      Edit
    </EditableEditTrigger>
    <template v-else>
      <!-- asChild, both forms -->
      <EditableSubmitTrigger as-child>
        <button
          id="submit-adopted"
          aria-label="Save"
          data-state="mine"
        >
          Save
        </button>
      </EditableSubmitTrigger>
      <EditableCancelTrigger
        v-slot="{ props }"
        as-child
      >
        <button
          v-bind="props"
          id="cancel-slotted"
        >
          Cancel
        </button>
      </EditableCancelTrigger>
    </template>
  </EditableRoot>
  <span id="value">{{ value }}</span>
</template>
