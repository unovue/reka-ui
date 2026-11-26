<script setup vapor lang="ts">
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger, MenubarContent, MenubarItem, MenubarMenu, MenubarRoot, MenubarTrigger } from '#reka'
import { ref } from 'vue'

const open = ref(false)
const menubar = ref('')
defineExpose({ open, menubar })
</script>

<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger
      id="prevented-trigger"
      @click="(event: MouseEvent) => event.preventDefault()"
      @keydown="(event: KeyboardEvent) => event.preventDefault()"
    >
      Menu
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Item</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuRoot>

  <MenubarRoot v-model="menubar">
    <MenubarMenu value="file">
      <MenubarTrigger
        id="prevented-menubar-trigger"
        @pointerdown="(event: PointerEvent) => event.preventDefault()"
        @keydown="(event: KeyboardEvent) => event.preventDefault()"
      >
        File
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>Item</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </MenubarRoot>
</template>
