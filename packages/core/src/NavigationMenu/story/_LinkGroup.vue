<script setup lang="ts">
import { NavigationMenuLink } from '..'

defineProps<{
  items: string[]
}>()
</script>

<template>
  <ul class="m-0 flex flex-col list-none gap-2 p-[22px]">
    <li
      v-for="(item, index) in items"
      :key="index"
    >
      <NavigationMenuLink
        href="#example"
        class="flex items-center hover:bg-gray-200 px-4 py-2 rounded"
      >
        {{ item }}
      </NavigationMenuLink>
    </li>
  </ul>
</template>
