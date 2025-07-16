<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxRoot, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, VisuallyHidden } from 'reka-ui'
import { ref } from 'vue'
import { commandMenuItems } from './list'

const open = ref(false)

const { meta_j } = useMagicKeys()
whenever(meta_j, (n) => {
  if (n)
    open.value = true
})

function handleSelect(ev: CustomEvent) {
  ev.preventDefault()
  open.value = false
  // eslint-disable-next-line no-console
  console.log('Selected: ', ev.detail.value)
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="dark:text-white inline-flex items-center bg-muted px-3 py-2 rounded-lg text-sm border border-muted-foreground/30">
      <span class="inline-flex mr-4">Open with</span>
      <span class="inline-flex text-xs">
        <kbd>⌘ J</kbd>
      </span>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="bg-background/80 fixed inset-0 z-30" />
      <DialogContent
        class="fixed top-[15%] left-[50%] max-h-[85vh] w-[90vw] max-w-[24rem] translate-x-[-50%] text-sm rounded-xl overflow-hidden border border-muted-foreground/30 bg-card focus:outline-none z-[100]"
      >
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
          <DialogDescription>Search for command</DialogDescription>
        </VisuallyHidden>

        <ComboboxRoot :open="true">
          <ComboboxInput
            placeholder="Search..."
            class="bg-transparent w-full px-4 py-3 outline-none placeholder-muted-foreground"
            @keydown.enter.prevent
          />

          <ComboboxContent
            class="border-t border-muted-foreground/30 p-2 max-h-[20rem] overflow-y-auto"
            @escape-key-down="open = false"
          >
            <ComboboxEmpty class="text-center text-muted-foreground p-4">
              No results
            </ComboboxEmpty>

            <ComboboxGroup
              v-for="{ group, items } in commandMenuItems"
              :key="group"
            >
              <ComboboxLabel class="px-4 text-muted-foreground font-semibold mt-3 mb-3">
                {{ group }}
              </ComboboxLabel>
              <ComboboxItem
                v-for="item in items"
                :key="item.id"
                :value="item"
                class="cursor-default px-4 py-2 rounded-md data-[highlighted]:bg-muted inline-flex w-full items-center gap-4"
                @select="handleSelect"
              >
                <Icon :icon="item.icon" />
                <span>{{ item.name }}</span>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxContent>
        </ComboboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
