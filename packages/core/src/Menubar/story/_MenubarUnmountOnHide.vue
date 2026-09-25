<script setup lang="ts">
import { ref } from 'vue'
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRoot,
  MenubarTrigger,
} from '..'

const props = withDefaults(defineProps<{
  unmountOnHide?: boolean
}>(), {
  unmountOnHide: true,
})

const currentMenu = ref('')
</script>

<template>
  <div>
    <MenubarRoot
      v-model="currentMenu"
      :unmount-on-hide="props.unmountOnHide"
    >
      <MenubarMenu value="file">
        <MenubarTrigger>
          File
        </MenubarTrigger>
        <MenubarContent
          align="start"
          :side-offset="5"
        >
          <MenubarItem>
            New Tab
          </MenubarItem>
          <MenubarItem>
            New Window
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu value="edit">
        <MenubarTrigger>
          Edit
        </MenubarTrigger>
        <MenubarContent
          align="start"
          :side-offset="5"
        >
          <MenubarItem>
            Undo
          </MenubarItem>
          <MenubarItem>
            Redo
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </MenubarRoot>
  </div>
</template>
