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
    <Variant title="Default">
      <DrawerDemo />
    </Variant>

    <Variant title="Position - Bottom">
      <DrawerRoot
        v-model:open="positionBottomOpen"
        swipe-direction="down"
      >
        <DrawerTrigger class="drawer-button">
          Bottom Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-bottom">
            <DrawerHandle class="drawer-handle" />
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

    <Variant title="Position - Top">
      <DrawerRoot
        v-model:open="positionTopOpen"
        swipe-direction="up"
      >
        <DrawerTrigger class="drawer-button">
          Top Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-top">
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
            <DrawerHandle class="drawer-handle drawer-handle-bottom" />
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </Variant>

    <Variant title="Position - Left">
      <DrawerRoot
        v-model:open="positionLeftOpen"
        swipe-direction="left"
      >
        <DrawerTrigger class="drawer-button">
          Left Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-left">
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

    <Variant title="Position - Right">
      <DrawerRoot
        v-model:open="positionRightOpen"
        swipe-direction="right"
      >
        <DrawerTrigger class="drawer-button">
          Right Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-right">
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

    <Variant title="Snap Points">
      <DrawerRoot
        v-model:open="snapOpen"
        v-model:snap-point="snapPoint"
        :snap-points="[0.5, 1]"
      >
        <DrawerTrigger class="drawer-button">
          Open Snap Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-snap">
            <DrawerHandle class="drawer-handle drawer-snap-handle" />
            <div class="drawer-snap-scroll">
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

    <Variant title="Non-modal">
      <div class="relative min-h-[300px]">
        <p class="mb-4 text-sm text-gray-600">
          Click the button below. The drawer opens without blocking the background.
        </p>
        <DrawerRoot
          v-model:open="nonModalOpen"
          :modal="false"
        >
          <DrawerTrigger class="drawer-button">
            Open Non-modal Drawer
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerContent class="drawer-content-bottom drawer-content-nonmodal">
              <DrawerHandle class="drawer-handle" />
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

    <Variant title="Swipe to Open">
      <div class="relative min-h-[300px]">
        <p class="mb-4 text-sm text-gray-600">
          Swipe up from the bottom edge to open the drawer, or use the button.
        </p>
        <DrawerRoot v-model:open="swipeToOpen">
          <DrawerTrigger class="drawer-button">
            Open Drawer
          </DrawerTrigger>
          <DrawerSwipeArea class="fixed bottom-0 left-0 right-0 h-8 bg-gray-200/50" />
          <DrawerPortal>
            <DrawerOverlay class="drawer-overlay" />
            <DrawerContent class="drawer-content-bottom">
              <DrawerHandle class="drawer-handle" />
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

    <Variant title="Nested Drawers">
      <DrawerRoot v-model:open="outerOpen">
        <DrawerTrigger class="drawer-button">
          Open Outer Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-bottom">
            <DrawerHandle class="drawer-handle" />
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
                    <DrawerOverlay class="drawer-overlay" />
                    <DrawerContent class="drawer-content-bottom drawer-content-inner">
                      <DrawerHandle class="drawer-handle" />
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

    <Variant title="Indent Effect">
      <DrawerProvider>
        <div class="indent-root">
          <DrawerIndentBackground class="indent-background" />
          <DrawerIndent class="indent-content">
            <div class="min-h-[300px] p-6">
              <p class="mb-4 text-sm text-gray-600">
                When the drawer opens, this content will scale down with an indent effect.
              </p>
              <DrawerRoot v-model:open="indentOpen">
                <DrawerTrigger class="drawer-button">
                  Open with Indent
                </DrawerTrigger>
                <DrawerPortal>
                  <DrawerOverlay class="drawer-overlay" />
                  <DrawerContent class="drawer-content-bottom">
                    <DrawerHandle class="drawer-handle" />
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
        </div>
      </DrawerProvider>
    </Variant>

    <Variant title="Mobile Navigation">
      <DrawerRoot v-model:open="mobileNavOpen">
        <DrawerTrigger class="drawer-button">
          Open Navigation
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="drawer-overlay" />
          <DrawerContent class="drawer-content-bottom drawer-content-fullheight">
            <DrawerHandle class="drawer-handle" />
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

<style>
/* === Keyframes === */
@keyframes drawer-overlay-in { from { opacity: 0; } }
@keyframes drawer-overlay-out { to { opacity: 0; } }
@keyframes drawer-slide-bottom-in { from { transform: translateY(100%); } }
@keyframes drawer-slide-bottom-out { to { transform: translateY(100%); } }
@keyframes drawer-slide-top-in { from { transform: translateY(-100%); } }
@keyframes drawer-slide-top-out { to { transform: translateY(-100%); } }
@keyframes drawer-slide-left-in { from { transform: translateX(-100%); } }
@keyframes drawer-slide-left-out { to { transform: translateX(-100%); } }
@keyframes drawer-slide-right-in { from { transform: translateX(100%); } }
@keyframes drawer-slide-right-out { to { transform: translateX(100%); } }

/* === Overlay === */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.2);
}
.drawer-overlay[data-state="open"] {
  animation: drawer-overlay-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-overlay[data-state="closed"] {
  animation: drawer-overlay-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* === Bottom Drawer === */
.drawer-content-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
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

/* === Snap Points Drawer ===
 * Fills the viewport vertically so popupHeight measures the full viewport,
 * then the snap-point-offset transform slides the popup down to visually
 * reveal only the active snap point's portion. Ported from BaseUI's
 * snap-points demo CSS.
 *
 * Enter/exit animations use the independent `translate` CSS property so
 * they compose with the inline `transform` (which carries the snap point
 * offset) instead of replacing it. If we used `transform` in the keyframes,
 * the enter animation would clobber the snap-point transform and the drawer
 * would briefly slide up to fully-open (snap 1.0) before settling at the
 * active snap point — a visible flicker.
 */
.drawer-content-snap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  background: white;
  border-radius: 1rem 1rem 0 0;
  outline: none;
  overflow: visible;
  /* Clamp the translate to max(0px, ...) so an aggressive drag past the
   * top snap point cannot push the drawer above the viewport. The swipe
   * movement is a negative delta when dragging up, so a raw sum can go
   * negative past the fully-expanded (snap=1.0, offset=0) position. */
  transform: translateY(max(0px, calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px))));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform, translate;
}
.drawer-content-snap[data-state="open"] {
  animation: drawer-snap-slide-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-snap[data-state="closed"] {
  animation: drawer-snap-slide-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-snap[data-swiping] {
  animation: none;
  transition-duration: 0ms;
  user-select: none;
}
@keyframes drawer-snap-slide-in {
  from { translate: 0 100dvh; }
}
@keyframes drawer-snap-slide-out {
  to { translate: 0 100dvh; }
}
.drawer-snap-handle {
  flex-shrink: 0;
}
.drawer-snap-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 1.5rem 1.5rem;
}
.drawer-content-bottom[data-state="open"] {
  animation: drawer-slide-bottom-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-bottom[data-state="closed"] {
  animation: drawer-slide-bottom-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-bottom[data-swiping] {
  animation: none;
  transition-duration: 0ms;
  user-select: none;
}

/* === Top Drawer === */
.drawer-content-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  height: auto;
  flex-direction: column;
  background: white;
  border-radius: 0 0 1rem 1rem;
  outline: none;
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  will-change: transform;
}
.drawer-content-top[data-state="open"] {
  animation: drawer-slide-top-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-top[data-state="closed"] {
  animation: drawer-slide-top-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-top[data-swiping] {
  animation: none;
  user-select: none;
}

/* === Left Drawer === */
.drawer-content-left {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  width: 20rem;
  flex-direction: column;
  background: white;
  border-radius: 0 1rem 1rem 0;
  outline: none;
  transform: translateX(var(--drawer-swipe-movement-x, 0px));
  will-change: transform;
}
.drawer-content-left[data-state="open"] {
  animation: drawer-slide-left-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-left[data-state="closed"] {
  animation: drawer-slide-left-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-left[data-swiping] {
  animation: none;
  user-select: none;
}

/* === Right Drawer === */
.drawer-content-right {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  width: 20rem;
  flex-direction: column;
  background: white;
  border-radius: 1rem 0 0 1rem;
  outline: none;
  transform: translateX(var(--drawer-swipe-movement-x, 0px));
  will-change: transform;
}
.drawer-content-right[data-state="open"] {
  animation: drawer-slide-right-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-right[data-state="closed"] {
  animation: drawer-slide-right-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-content-right[data-swiping] {
  animation: none;
  user-select: none;
}

/* === Variants === */
.drawer-content-nonmodal {
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
}
.drawer-content-inner {
  background: #f9fafb;
}
.drawer-content-fullheight {
  height: 100%;
}

/* === Indent Effect === */
.indent-root {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.indent-background {
  position: absolute;
  inset: 0;
  background-color: black;
}
.indent-content {
  /*
   * --drawer-swipe-progress is written on this element by DrawerIndent and
   * ticks from 0 (at-rest-open) toward 1 as the user swipes the drawer away.
   * --indent-progress inverts that so the transform can lerp from the
   * "scaled down" state (progress 0) back toward the "neutral" state
   * (progress 1) as the user drags the drawer off-screen.
   *
   * --indent-transition is a clever 1-or-0 switch: at rest, swipeProgress is
   * 0 so clamp(0, 0*100000, 1) = 0 and the value is 1 (transitions on). The
   * moment any swipe starts, clamp(...) saturates to 1 and the value drops
   * to 0 — which we multiply into transition-duration to silence transitions
   * during the drag so the transform tracks the pointer in real time.
   */
  --indent-progress: var(--drawer-swipe-progress);
  --indent-radius: calc(1rem * (1 - var(--indent-progress)));
  --indent-transition: calc(1 - clamp(0, calc(var(--drawer-swipe-progress) * 100000), 1));

  position: relative;
  min-height: 320px;
  background-color: white;
  contain: layout;
  transform-origin: center top;
  transition:
    transform 400ms cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 250ms cubic-bezier(0.32, 0.72, 0, 1);
  transition-duration:
    calc(400ms * var(--indent-transition)),
    calc(250ms * var(--indent-transition));
  will-change: transform;
}
.indent-content[data-active] {
  transform:
    scale(calc(0.96 + (0.04 * var(--indent-progress))))
    translateY(calc(0.5rem * (1 - var(--indent-progress))));
  border-top-left-radius: var(--indent-radius);
  border-top-right-radius: var(--indent-radius);
}

/* === Handle === */
.drawer-handle {
  width: 3rem;
  height: 0.25rem;
  margin: 1rem auto 0;
  border-radius: 9999px;
  background-color: #d1d5db;
  flex-shrink: 0;
}
.drawer-handle-bottom {
  margin: 0 auto 1rem;
}

/* === Button === */
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
