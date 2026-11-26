<script setup lang="ts">
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from '..'

defineProps<{ options: string[] }>()
</script>

<template>
  <ListboxRoot>
    <ListboxContent>
      <ListboxItem
        v-for="option in options"
        :key="option"
        :value="option"
      >
        {{ option }}<ListboxItemIndicator>x</ListboxItemIndicator>
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
