<script setup lang="ts">
import { EditableArea, EditableCancelTrigger, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from 'reka-ui'
</script>

<template>
  <div class="w-[250px]">
    <EditableRoot
      v-slot="{ isEditing }"
      default-value="Click to edit 'Reka UI'"
      placeholder="Enter text..."
      class="flex flex-col gap-4"
      auto-resize
    >
      <EditableArea class="text-stone-700 dark:text-white w-[250px]">
        <EditablePreview />
        <EditableInput class="w-full placeholder:text-stone-700 dark:placeholder:text-white" />
      </EditableArea>
      <EditableEditTrigger
        v-if="!isEditing"
        class="w-max inline-flex items-center justify-center rounded-lg font-medium text-sm px-[15px] leading-[35px] h-[35px] bg-white text-green11 shadow-sm border outline-none hover:bg-stone-50 focus:shadow-[0_0_0_2px] focus:shadow-black"
      />
      <div
        v-else
        class="flex gap-2"
      >
        <EditableSubmitTrigger
          class="inline-flex items-center justify-center rounded-lg font-medium text-sm px-[15px] leading-[35px] h-[35px] bg-white text-green11 shadow-sm border outline-none hover:bg-stone-50 focus:shadow-[0_0_0_2px] focus:shadow-black"
        />
        <EditableCancelTrigger
          class="inline-flex items-center justify-center rounded-lg font-medium text-sm px-[15px] leading-[35px] h-[35px] bg-red9 text-white shadow-sm border dark:border-red10 outline-none hover:bg-red10 focus:shadow-[0_0_0_2px] focus:shadow-black"
        />
      </div>
    </EditableRoot>
  </div>
</template>
