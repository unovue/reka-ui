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

// Shared "default" drawer used by the Default story variant. All styles
// (keyframes, .drawer-content-bottom, .drawer-handle, .drawer-overlay,
// .drawer-button) are defined once in Drawer.story.vue's global <style>
// block — do not duplicate them here or both rules compete and the
// enter/exit keyframes collide with the drag transform on release
// (the "bounce" bug).
const open = ref(false)
</script>

<template>
  <DrawerRoot v-model:open="open">
    <DrawerTrigger class="drawer-button">
      Open Drawer
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="drawer-overlay" />
      <DrawerContent class="drawer-content-bottom">
        <DrawerHandle class="drawer-handle" />
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
