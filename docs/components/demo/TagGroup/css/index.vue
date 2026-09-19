<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from 'reka-ui'
import { ref } from 'vue'

const modelValue = ref(['Apple', 'Banana', 'Blueberry'])
</script>

<template>
  <TagGroupRoot
    v-model="modelValue"
    aria-label="Selected fruits"
    class="flex w-[380px] flex-wrap items-center gap-2"
  >
    <TagGroupItem
      v-for="item in modelValue"
      :key="item"
      :value="item"
      class="flex items-center justify-center gap-1.5 rounded-lg bg-green8 px-2 py-1 text-sm font-medium text-white shadow-md outline-none data-[state=checked]:bg-green9 data-[disabled]:opacity-50 focus-visible:ring-2 focus-visible:ring-green7"
    >
      <TagGroupItemText>{{ item }}</TagGroupItemText>
      <TagGroupItemDelete
        class="rounded bg-transparent p-0.5 hover:bg-blackA4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Icon
          icon="lucide:x"
          class="size-3"
        />
      </TagGroupItemDelete>
    </TagGroupItem>
  </TagGroupRoot>
</template>
