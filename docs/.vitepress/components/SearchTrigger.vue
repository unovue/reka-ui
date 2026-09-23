<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { defineAsyncComponent, ref } from 'vue'

const SearchCommandBox = defineAsyncComponent(() => import('./SearchCommandBox.vue'))

const open = ref(false)
const { meta_k } = useMagicKeys()

whenever(meta_k, (n) => {
  if (n)
    open.value = true
})

function handleClose() {
  requestAnimationFrame(() => {
    open.value = false
  })
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="flex items-center space-x-2 text-md md:text-sm py-[7px] px-3 rounded-lg md:border border-muted md:bg-card hover:bg-muted text-muted-foreground">
      <Icon icon="lucide:search" />
      <span class="hidden md:inline-flex w-24 lg:w-40 text-left">Search</span>
      <span class="hidden md:inline-flex text-xs">
        <kbd>⌘ K</kbd>
      </span>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay
        class="bg-background/50 fixed inset-0 z-30 backdrop-blur"
      />
      <DialogContent
        class="fixed top-[10%] left-[50%] max-h-[85vh] w-[90vw] max-w-[750px] translate-x-[-50%] rounded-xl bg-card shadow-xl overflow-hidden focus:outline-none z-[100] border border-muted"
      >
        <DialogTitle class="sr-only">
          Search documentation
        </DialogTitle>
        <DialogDescription class="sr-only">
          Show related results based on search term
        </DialogDescription>

        <SearchCommandBox
          @close="handleClose"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
