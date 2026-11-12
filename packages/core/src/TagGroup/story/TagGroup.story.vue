<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from '..'

const initialTags = ['News', 'Travel', 'Gaming', 'Shopping', 'Sports']
const tags = ref([...initialTags])
const selected = ref<string[]>([])
const single = ref<string>()

function onRemove(values: string[]) {
  tags.value = tags.value.filter(tag => !values.includes(tag))
}
</script>

<template>
  <Story
    title="TagGroup/Default"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="removable, multiple selection">
      <TagGroupRoot
        v-model="selected"
        selection-mode="multiple"
        aria-label="Categories"
        class="flex gap-2 items-center w-[300px] flex-wrap"
        @remove="onRemove"
      >
        <TagGroupItem
          v-for="tag in tags"
          :key="tag"
          :value="tag"
          :disabled="tag === 'Sports'"
          class="data-[disabled]:opacity-50 data-[state=checked]:bg-green9 flex items-center gap-2 bg-green8 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-green11"
        >
          <TagGroupItemText class="text-sm">
            {{ tag }}
          </TagGroupItemText>
          <TagGroupItemDelete>
            <Icon icon="lucide:x" />
          </TagGroupItemDelete>
        </TagGroupItem>
        <span v-if="!tags.length">No categories</span>
      </TagGroupRoot>

      <p>Selected: {{ selected }}</p>
      <button @click="tags = [...initialTags]">
        Reset
      </button>
    </Variant>

    <Variant title="single selection">
      <TagGroupRoot
        v-model="single"
        selection-mode="single"
        aria-label="Categories"
        class="flex gap-2 items-center w-[300px] flex-wrap"
      >
        <TagGroupItem
          v-for="tag in initialTags"
          :key="tag"
          :value="tag"
          class="data-[state=checked]:bg-green9 flex items-center bg-green8 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-green11"
        >
          <TagGroupItemText class="text-sm">
            {{ tag }}
          </TagGroupItemText>
        </TagGroupItem>
      </TagGroupRoot>

      <p>Selected: {{ single }}</p>
    </Variant>
  </Story>
</template>
