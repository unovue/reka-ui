<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from '..'

const searchTerm = ref('')
const options = computed(() => searchTerm.value.trim() ? countryList.slice(0, 20).filter(i => i.toLowerCase().includes(searchTerm.value.toLowerCase().trim())) : countryList.slice(0, 20))

const { Story } = defineMeta({
  title: 'Listbox/Filter',
})
</script>

<template>
  <Story
    name="Filter (Single)"
    as-child
  >
    <ListboxRoot class="w-48  flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto ">
      <ListboxFilter
        v-model="searchTerm"
        class="border rounded"
      />
      <ListboxContent class="h-72 overflow-auto">
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>

  <Story
    name="Filter (Multiple)"
    as-child
  >
    <ListboxRoot
      :multiple="true"
      class="w-48  flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto "
    >
      <ListboxFilter
        v-model="searchTerm"
        class="border rounded"
      />
      <ListboxContent class="h-72 overflow-auto">
        <ListboxItem
          v-for="i in options"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>
</template>
