<script setup lang="ts">
import { ref } from 'vue'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '..'

const open = ref(false)
</script>

<template>
  <button
    id="open-button"
    @click="open = !open"
  >
    {{ open ? 'Close' : 'Open' }}
  </button>
  <ContextMenuRoot v-model:open="open">
    <ContextMenuTrigger> Right click for contextmenu </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem>Item 1</ContextMenuItem>
      <ContextMenuItem>Item 2</ContextMenuItem>
      <button
        id="close-button"
        @click="open = false"
      >
        close
      </button>
      <ContextMenuItem>Item 3</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenuRoot>
</template>
