<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '..'

export interface TestProps {
  addOnTab?: boolean
  addOnBlur?: boolean
}

withDefaults(defineProps<TestProps>(), {
  addOnBlur: false,
  addOnTab: false,
})

const modelValue = ref(['Test'])
</script>

<template>
  <TagsInputRoot
    v-model="modelValue"
    :add-on-blur="addOnBlur"
    :add-on-tab="addOnTab"
    class="flex gap-2 items-center border p-2 rounded-lg bg-blackA7 w-[300px] flex-wrap border-blackA7"
  >
    <TagsInputItem
      v-for="item in modelValue"
      :key="item"
      :value="item"
      class="flex items-center justify-center gap-2 bg-green8 aria-[selected=true]:bg-green9 rounded px-2 py-1"
    >
      <TagsInputItemText class="text-sm">
        {{ item }}
      </TagsInputItemText>
      <TagsInputItemDelete>
        <Icon icon="lucide:x" />
      </TagsInputItemDelete>
    </TagsInputItem>

    <TagsInputInput
      placeholder="Anything..."
      class="focus:outline-none flex-1 rounded bg-transparent text-white placeholder:text-mauve10 px-1"
    />
  </TagsInputRoot>
</template>
