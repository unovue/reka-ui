<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '..'

const people = ref([
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
])

function displayValue(value: { id: number, name: string }) {
  return `123${value.name}`
}

function convertValue(value: string) {
  return { id: people.value.length + 1, name: value }
}
</script>

<template>
  <Story
    title="TagsInput/Object"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      {{ JSON.stringify(people) }}
      <TagsInputRoot
        v-model="people"
        :convert-value="convertValue"
        :display-value="displayValue"
        class="flex gap-2 items-center border p-2 rounded-lg bg-blackA7 w-[300px] flex-wrap border-blackA7 mt-6"
      >
        <TagsInputItem
          v-for="(item, i) in people"
          :key="i"
          :value="item"
          class=" data-[disabled]:opacity-50 flex items-center justify-center gap-2 bg-green8 aria-[current=true]:bg-green9 rounded px-2 py-1"
        >
          <TagsInputItemText class="text-sm" />
          <TagsInputItemDelete>
            <Icon icon="lucide:x" />
          </TagsInputItemDelete>
        </TagsInputItem>

        <TagsInputInput
          placeholder="Anything..."
          class="focus:outline-none flex-1 rounded bg-transparent text-white placeholder:text-mauve10 px-1"
        />
      </TagsInputRoot>
    </Variant>
  </Story>
</template>
