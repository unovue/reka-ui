<script setup lang="ts">
import { computed, ref } from 'vue'
import { countryList } from '@/shared/constant'
import { ListboxContent, ListboxItem, ListboxRoot } from '..'

const filterText = ref('')
const filteredOptions = computed(() => {
  const options = countryList.map(a => ({ label: a, value: a }))
  return filterText.value ? options.filter(item => item.label.toLowerCase().includes(filterText.value.toLowerCase())) : options
})
</script>

<template>
  <Story
    title="Listbox/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <ListboxRoot class="w-48 h-72 flex flex-col rounded-lg border bg-white text-green9 mx-auto overflow-auto">
      <ListboxContent class="p-1">
        <ListboxItem
          v-for="i in filteredOptions.map(i => i.label).slice(0, 50)"
          :key="i"
          :value="i"
          class="w-full py-1 px-2 text-green9 select-none text-sm outline-none data-[highlighted]:ring-green9 data-[highlighted]:ring-1 focus:ring-green9 focus:ring-1  data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
        >
          {{ i }}
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </Story>
</template>
