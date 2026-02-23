<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from '..'

const filterText = ref('')
const filteredOptions = computed(() => {
  const options = countryList.map(a => ({ label: a, value: a }))
  return filterText.value ? options.filter(item => item.label.toLowerCase().includes(filterText.value.toLowerCase())) : options
})

const { Story } = defineMeta({
  title: 'Listbox/Virtual',
})
</script>

<template>
  <Story
    name="Basic"
    as-child
  >
    <ListboxRoot class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxContent class="h-72 overflow-auto">
        <ListboxVirtualizer
          v-slot="{ option }"
          :options="filteredOptions"
          :text-content="(opt) => opt.label"
        >
          <ListboxItem
            :value="option"
            class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
          >
            {{ option.label }}
          </ListboxItem>
        </ListboxVirtualizer>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Filter"
    as-child
  >
    <div class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxRoot>
        <ListboxFilter
          v-model="filterText"
          type="text"
          class="border rounded w-full bg-white"
        />
        <ListboxContent class="w-full h-64 overflow-auto">
          <ListboxVirtualizer
            v-slot="{ option }"
            :text-content="(option) => option.value"
            :options="filteredOptions"
          >
            <ListboxItem
              :value="option"
              class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
            >
              {{ option.label }}
            </ListboxItem>
          </ListboxVirtualizer>
        </ListboxContent>
      </ListboxRoot>
    </div>
  </Story>

  <Story
    name="Single"
    as-child
  >
    <div class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxRoot>
        <ListboxContent class="w-full h-64 overflow-auto">
          <ListboxVirtualizer
            v-slot="{ option }"
            :text-content="(option) => option.value"
            :options="filteredOptions"
          >
            <ListboxItem
              :value="option"
              class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
            >
              {{ option.label }}
            </ListboxItem>
          </ListboxVirtualizer>
        </ListboxContent>
      </ListboxRoot>
    </div>
  </Story>

  <Story
    name="Multiple"
    as-child
  >
    <div class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxRoot multiple>
        <ListboxContent class="w-full h-64 overflow-auto">
          <ListboxVirtualizer
            v-slot="{ option }"
            :text-content="(option) => option.value"
            :options="filteredOptions"
          >
            <ListboxItem
              :value="option"
              class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
            >
              {{ option.label }}
            </ListboxItem>
          </ListboxVirtualizer>
        </ListboxContent>
      </ListboxRoot>
    </div>
  </Story>

  <Story
    name="Replace behavior (Single)"
    as-child
  >
    <div class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxRoot selection-behavior="replace">
        <ListboxContent class="w-full h-64 overflow-auto">
          <ListboxVirtualizer
            v-slot="{ option }"
            :text-content="(option) => option.value"
            :options="filteredOptions"
          >
            <ListboxItem
              :value="option"
              class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
            >
              {{ option.label }}
            </ListboxItem>
          </ListboxVirtualizer>
        </ListboxContent>
      </ListboxRoot>
    </div>
  </Story>

  <Story
    name="Replace behavior (Multiple)"
    as-child
  >
    <div class="w-48 p-1 rounded-lg border bg-white text-green9 mx-auto">
      <ListboxRoot
        multiple
        selection-behavior="replace"
      >
        <ListboxContent class="w-full h-64 overflow-auto">
          <ListboxVirtualizer
            v-slot="{ option }"
            :text-content="(option) => option.value"
            :options="filteredOptions"
          >
            <ListboxItem
              :value="option"
              class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white rounded"
            >
              {{ option.label }}
            </ListboxItem>
          </ListboxVirtualizer>
        </ListboxContent>
      </ListboxRoot>
    </div>
  </Story>
</template>
