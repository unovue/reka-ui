<script setup lang="ts">
import { ref } from 'vue'
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerOverlay,
  DrawerPortal,
  DrawerProvider,
  DrawerRoot,
  DrawerSwipeArea,
  DrawerTitle,
  DrawerTrigger,
} from '..'
import DrawerDemo from './_Drawer.vue'

const positionBottomOpen = ref(false)
const positionTopOpen = ref(false)
const positionLeftOpen = ref(false)
const positionRightOpen = ref(false)

const snapOpen = ref(false)
const snapPoint = ref<number | null>(0.5)

const nonModalOpen = ref(false)

const outerOpen = ref(false)
const innerOpen = ref(false)

const indentOpen = ref(false)

const mobileNavOpen = ref(false)

const swipeToOpen = ref(false)

const navLinks = [
  'Home',
  'Dashboard',
  'Projects',
  'Tasks',
  'Reports',
  'Team',
  'Settings',
  'Notifications',
  'Billing',
  'Integrations',
  'API Keys',
  'Support',
  'Documentation',
  'Changelog',
  'Profile',
]
</script>

<template>
  <Story
    title="Drawer"
    :layout="{ type: 'single', iframe: true }"
  >
    <!-- Default -->
    <Variant title="Default">
      <DrawerDemo />
    </Variant>

    <!-- Position - Bottom -->
    <Variant title="Position - Bottom">
      <DrawerRoot
        v-model:open="positionBottomOpen"
        swipe-direction="down"
      >
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Bottom Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
            <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Bottom Drawer
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                Swipe direction: down (default). Swipe down to dismiss.
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
    </Variant>

    <!-- Position - Top -->
    <Variant title="Position - Top">
      <DrawerRoot
        v-model:open="positionTopOpen"
        swipe-direction="up"
      >
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Top Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed top-0 left-0 right-0 flex h-auto flex-col rounded-b-[10px] bg-white outline-none">
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Top Drawer
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                Swipe direction: up. Swipe up to dismiss.
              </DrawerDescription>
              <div class="mt-6 flex justify-end">
                <DrawerClose class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                  Close
                </DrawerClose>
              </div>
            </div>
            <DrawerHandle class="mx-auto mb-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </Variant>

    <!-- Position - Left -->
    <Variant title="Position - Left">
      <DrawerRoot
        v-model:open="positionLeftOpen"
        swipe-direction="left"
      >
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Left Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed left-0 top-0 bottom-0 flex w-80 flex-col rounded-r-[10px] bg-white outline-none">
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Left Drawer
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                Swipe direction: left. Swipe left to dismiss.
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
    </Variant>

    <!-- Position - Right -->
    <Variant title="Position - Right">
      <DrawerRoot
        v-model:open="positionRightOpen"
        swipe-direction="right"
      >
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Right Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed right-0 top-0 bottom-0 flex w-80 flex-col rounded-l-[10px] bg-white outline-none">
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Right Drawer
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                Swipe direction: right. Swipe right to dismiss.
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
    </Variant>

    <!-- Snap Points -->
    <Variant title="Snap Points">
      <DrawerRoot
        v-model:open="snapOpen"
        v-model:snap-point="snapPoint"
        :snap-points="[0.5, 1]"
      >
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Open Snap Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
            <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Snap Points
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                This drawer snaps to 50% and 100% of the viewport height.
              </DrawerDescription>
              <div class="mt-4 rounded-md bg-gray-100 p-3 text-sm text-gray-700">
                Active snap point: <strong>{{ snapPoint ?? 'none' }}</strong>
              </div>
              <div class="mt-4 flex gap-2">
                <button
                  class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                  @click="snapPoint = 0.5"
                >
                  Snap to 50%
                </button>
                <button
                  class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                  @click="snapPoint = 1"
                >
                  Snap to 100%
                </button>
              </div>
              <div class="mt-6 flex justify-end">
                <DrawerClose class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                  Close
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </Variant>

    <!-- Non-modal -->
    <Variant title="Non-modal">
      <div class="relative min-h-[300px]">
        <p class="mb-4 text-sm text-gray-600">
          Click the button below. The drawer opens without blocking the background.
        </p>
        <DrawerRoot
          v-model:open="nonModalOpen"
          :modal="false"
        >
          <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
            Open Non-modal Drawer
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] outline-none">
              <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
              <div class="p-6">
                <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                  Non-modal Drawer
                </DrawerTitle>
                <DrawerDescription class="text-sm text-gray-600">
                  This drawer does not block background interaction. No overlay is shown.
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
      </div>
    </Variant>

    <!-- Swipe to Open -->
    <Variant title="Swipe to Open">
      <div class="relative min-h-[300px]">
        <p class="mb-4 text-sm text-gray-600">
          Swipe up from the bottom edge to open the drawer, or use the button.
        </p>
        <DrawerRoot v-model:open="swipeToOpen">
          <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
            Open Drawer
          </DrawerTrigger>
          <DrawerSwipeArea class="fixed bottom-0 left-0 right-0 h-8 bg-gray-200/50" />
          <DrawerPortal>
            <DrawerOverlay class="fixed inset-0 bg-black/40" />
            <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
              <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
              <div class="p-6">
                <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                  Swipe to Open
                </DrawerTitle>
                <DrawerDescription class="text-sm text-gray-600">
                  This drawer can be opened by swiping up from the bottom edge area.
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
      </div>
    </Variant>

    <!-- Nested Drawers -->
    <Variant title="Nested Drawers">
      <DrawerRoot v-model:open="outerOpen">
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Open Outer Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
            <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
            <div class="p-6">
              <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                Outer Drawer
              </DrawerTitle>
              <DrawerDescription class="text-sm text-gray-600">
                This is the outer drawer. Open the inner drawer below.
              </DrawerDescription>
              <div class="mt-6">
                <DrawerRoot v-model:open="innerOpen">
                  <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
                    Open Inner Drawer
                  </DrawerTrigger>
                  <DrawerPortal>
                    <DrawerOverlay class="fixed inset-0 bg-black/40" />
                    <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-gray-50 outline-none">
                      <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-400" />
                      <div class="p-6">
                        <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                          Inner Drawer
                        </DrawerTitle>
                        <DrawerDescription class="text-sm text-gray-600">
                          This is the nested inner drawer. Swipe down to dismiss.
                        </DrawerDescription>
                        <div class="mt-6 flex justify-end">
                          <DrawerClose class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                            Close Inner
                          </DrawerClose>
                        </div>
                      </div>
                    </DrawerContent>
                  </DrawerPortal>
                </DrawerRoot>
              </div>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </Variant>

    <!-- Indent Effect -->
    <Variant title="Indent Effect">
      <DrawerProvider>
        <DrawerIndentBackground class="fixed inset-0 bg-black transition-opacity duration-300 data-[active]:opacity-30" />
        <DrawerIndent class="transition-transform duration-300 data-[active]:scale-[0.96] data-[active]:rounded-lg">
          <div class="min-h-[300px] bg-white p-6">
            <p class="mb-4 text-sm text-gray-600">
              When the drawer opens, this content will scale down with an indent effect.
            </p>
            <DrawerRoot v-model:open="indentOpen">
              <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
                Open with Indent
              </DrawerTrigger>
              <DrawerPortal>
                <DrawerOverlay class="fixed inset-0 bg-black/40" />
                <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-auto flex-col rounded-t-[10px] bg-white outline-none">
                  <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
                  <div class="p-6">
                    <DrawerTitle class="mb-2 text-xl font-semibold text-gray-900">
                      Indent Effect
                    </DrawerTitle>
                    <DrawerDescription class="text-sm text-gray-600">
                      Notice how the background content scales down when this drawer is open.
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
          </div>
        </DrawerIndent>
      </DrawerProvider>
    </Variant>

    <!-- Mobile Navigation -->
    <Variant title="Mobile Navigation">
      <DrawerRoot v-model:open="mobileNavOpen">
        <DrawerTrigger class="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-gray-50">
          Open Navigation
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/40" />
          <DrawerContent class="fixed bottom-0 left-0 right-0 flex h-full flex-col bg-white outline-none">
            <DrawerHandle class="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <DrawerTitle class="text-lg font-semibold text-gray-900">
                Navigation
              </DrawerTitle>
              <DrawerClose class="rounded-md p-1 text-gray-400 hover:text-gray-600">
                &times;
              </DrawerClose>
            </div>
            <nav class="flex-1 overflow-y-auto px-6 py-4">
              <ul class="space-y-1">
                <li
                  v-for="link in navLinks"
                  :key="link"
                >
                  <a
                    href="#"
                    class="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    @click.prevent="mobileNavOpen = false"
                  >
                    {{ link }}
                  </a>
                </li>
              </ul>
            </nav>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </Variant>
  </Story>
</template>
