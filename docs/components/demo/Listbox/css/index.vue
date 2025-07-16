<script setup lang="ts">
import { ListboxContent, ListboxItem, ListboxRoot } from 'reka-ui'
</script>

<template>
  <ListboxRoot class="w-48 h-72 flex flex-col p-1 rounded-lg border bg-white text-green9 mx-auto overflow-auto">
    <ListboxContent>
      <ListboxItem
        v-for="i in 20"
        :key="i"
        :value="i"
        class="w-full py-1 px-2 text-green9 select-none text-sm focus:ring-0 data-[highlighted]:outline-green9 data-[highlighted]:outline-1 data-[highlighted]:outline focus:outline-green9 data-[state=checked]:bg-green9 data-[state=checked]:text-white data-[disabled]:opacity-50 rounded"
      >
        {{ i }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
