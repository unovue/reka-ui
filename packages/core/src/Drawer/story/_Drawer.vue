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
    <DrawerTrigger class="drawer-button">
      Open Drawer
    </DrawerTrigger>
    <DrawerPortal>
      <Transition name="drawer-overlay">
        <DrawerOverlay class="drawer-overlay" />
      </Transition>
      <Transition name="drawer-slide-bottom">
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
      </Transition>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.2);
}

.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-overlay-enter-from,
.drawer-overlay-leave-to {
  opacity: 0;
}

.drawer-content-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: auto;
  flex-direction: column;
  background: white;
  border-radius: 1rem 1rem 0 0;
  outline: none;
  overflow-y: auto;
  overscroll-behavior: contain;
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.drawer-content-bottom[data-swiping] {
  transition-duration: 0ms;
  user-select: none;
}

.drawer-slide-bottom-enter-active,
.drawer-slide-bottom-leave-active {
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-slide-bottom-enter-from,
.drawer-slide-bottom-leave-to {
  transform: translateY(100%);
}

.drawer-handle {
  width: 3rem;
  height: 0.25rem;
  margin: 1rem auto 0;
  border-radius: 9999px;
  background-color: #d1d5db;
  flex-shrink: 0;
}

.drawer-button {
  display: inline-flex;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #f9fafb;
  font-size: 1rem;
  cursor: pointer;
}
.drawer-button:hover {
  background: #f3f4f6;
}
</style>
