<script setup lang="ts">
import { EditableArea, EditableCancelTrigger, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div style="width: 250px;">
    <EditableRoot
      v-slot="{ isEditing }"
      placeholder="Enter text..."
      class="EditableRoot"
      default-value="Click to edit 'Reka UI'"
      auto-resize
    >
      <EditableArea class="EditableArea">
        <EditablePreview />
        <EditableInput />
      </EditableArea>
      <EditableEditTrigger
        v-if="!isEditing"
        class="EditableTrigger"
      />
      <div
        v-else
        class="EditableWrapper"
      >
        <EditableSubmitTrigger
          class="EditableSubmitTrigger"
        />
        <EditableCancelTrigger
          class="EditableTrigger"
        />
      </div>
    </EditableRoot>
  </div>
</template>
