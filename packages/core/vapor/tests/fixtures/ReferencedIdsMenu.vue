<script setup vapor lang="ts">
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger, MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '#reka'
import { ref } from 'vue'

const triggerId = ref('dd-trigger')
const contentId = ref('dd-content')
const mbTriggerId = ref('mb-trigger')
defineExpose({ triggerId, contentId, mbTriggerId })
</script>

<template>
  <DropdownMenuRoot
    :open="true"
    :modal="false"
  >
    <DropdownMenuTrigger
      :id="triggerId"
      data-testid="dd-trigger"
    >
      Open
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :id="contentId"
        data-testid="dd-content"
      >
        <DropdownMenuItem>A</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
  <MenubarRoot model-value="m">
    <MenubarMenu value="m">
      <MenubarTrigger
        :id="mbTriggerId"
        data-testid="mb-trigger"
      >
        File
      </MenubarTrigger>
      <MenubarPortal>
        <MenubarContent data-testid="mb-content">
          <MenubarItem>B</MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
