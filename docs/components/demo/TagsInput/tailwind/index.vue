<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'
import { ref } from 'vue'

const modelValue = ref(['Apple', 'Banana'])
</script>

<template>
  <TagsInputRoot
    v-model="modelValue"
    class="flex gap-2 items-center border p-1.5 rounded-lg w-full max-w-[340px] flex-wrap bg-white shadow-sm"
  >
    <TagsInputItem
      v-for="item in modelValue"
      :key="item"
      :value="item"
      class="text-white font-medium flex items-center justify-center gap-2 bg-grass8 aria-[current=true]:bg-grass9 rounded p-0.5"
    >
      <TagsInputItemText class="text-xs pl-1" />
      <TagsInputItemDelete class="p-0.5 rounded bg-transparent hover:bg-blackA4">
        <Icon icon="lucide:x" />
      </TagsInputItemDelete>
    </TagsInputItem>

    <TagsInputInput
      placeholder="Fruits..."
      class="text-xs focus:outline-none flex-1 rounded text-grass9 bg-transparent placeholder:text-mauve9 px-1"
    />
  </TagsInputRoot>
</template>
