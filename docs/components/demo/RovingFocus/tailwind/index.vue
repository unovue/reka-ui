<script setup lang="ts">
import { RovingFocusGroup, RovingFocusItem } from 'reka-ui'
</script>

<template>
  <div class="flex flex-col justify-center gap-4">
    <p class="dark:text-stone-200 text-xs">
      Tab to focus
    </p>
    <RovingFocusGroup
      orientation="horizontal"
      class="flex items-center gap-2 "
    >
      <RovingFocusItem
        class="font-medium dark:text-white px-4 py-2 rounded-lg bg-neutral-700 focus:bg-neutral-800 hover:bg-neutral-800 transition"
        as="button"
      >
        Button 1
      </RovingFocusItem>
      <RovingFocusItem
        class="font-medium dark:text-white px-4 py-2 rounded-lg bg-neutral-700 focus:bg-neutral-800 hover:bg-neutral-800 transition"
        as="button"
      >
        Button 2
      </RovingFocusItem>
      <RovingFocusItem
        class="font-medium dark:text-white px-4 py-2 rounded-lg bg-neutral-700 focus:bg-neutral-800 hover:bg-neutral-800 transition"
        as="button"
      >
        Button 3
      </RovingFocusItem>
    </RovingFocusGroup>
  </div>
</template>
