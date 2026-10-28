<script setup>
// Menubar: N instances of a typical composition (closed/default state)
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <MenubarRoot>
      <MenubarMenu
        v-for="m in ['File', 'Edit', 'View']"
        :key="m"
      >
        <MenubarTrigger :class="{ trg: m === 'File' }">
          {{ m }}
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent>
            <MenubarItem
              v-for="k in 3"
              :key="k"
            >
              {{ m }} {{ k }}
            </MenubarItem>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
    </MenubarRoot>
  </div>
</template>
