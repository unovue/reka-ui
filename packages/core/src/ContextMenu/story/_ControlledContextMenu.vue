<script setup lang="ts">
import { ref } from 'vue'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '..'

const open = ref(false)
const rejectOpen = ref(false)

function handleOpenChange(value: boolean) {
  if (value && rejectOpen.value)
    return

  open.value = value
}
</script>

<template>
  <button
    id="open-button"
    @click="open = !open"
  >
    {{ open ? 'Close' : 'Open' }}
  </button>
  <button
    id="reject-open-button"
    @click="rejectOpen = true"
  >
    Reject open
  </button>
  <ContextMenuRoot
    :open="open"
    @update:open="handleOpenChange"
  >
    <ContextMenuTrigger id="context-menu-trigger">
      Right click for contextmenu
    </ContextMenuTrigger>

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
