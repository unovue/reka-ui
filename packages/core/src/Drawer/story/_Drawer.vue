<script setup lang="ts">
import { ref } from 'vue'
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from '..'

const open = ref(false)
</script>

<template>
  <DrawerRoot v-model:open="open">
    <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
      Open Drawer
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="fixed inset-0 bg-black/40" />
      <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
        <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
        <div class="p-6">
          <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
            Drawer Title
          </DrawerTitle>
          <DrawerDescription class="text-sm text-gray-600">
            This drawer slides up from the bottom. Swipe down to dismiss.
          </DrawerDescription>
          <div class="mt-6 flex justify-end">
            <DrawerClose class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
              Close
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
