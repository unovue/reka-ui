<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from 'reka-ui'
import { ref } from 'vue'

const tags = ref(['Apple', 'Banana', 'Blueberry', 'Grape'])
const selected = ref<string[]>(['Banana'])

function onRemove(values: string[]) {
  tags.value = tags.value.filter(tag => !values.includes(tag))
}
</script>

<template>
  <TagGroupRoot
    v-model="selected"
    selection-mode="multiple"
    aria-label="Fruits"
    class="flex w-full max-w-[340px] flex-wrap items-center gap-2"
    @remove="onRemove"
  >
    <TagGroupItem
      v-for="tag in tags"
      :key="tag"
      :value="tag"
      class="flex cursor-default items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-1 text-sm font-medium text-grass11 shadow-sm outline-none data-[state=checked]:bg-grass9 data-[state=checked]:text-white data-[disabled]:opacity-50 focus-visible:ring-2 focus-visible:ring-grass7"
    >
      <TagGroupItemText>{{ tag }}</TagGroupItemText>
      <TagGroupItemDelete
        class="rounded bg-transparent p-0.5 hover:bg-blackA4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grass7"
      >
        <Icon
          icon="lucide:x"
          class="size-3"
        />
      </TagGroupItemDelete>
    </TagGroupItem>
    <span
      v-if="!tags.length"
      class="text-sm text-mauve11"
    >No fruits</span>
  </TagGroupRoot>
</template>
