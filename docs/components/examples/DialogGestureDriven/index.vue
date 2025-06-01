<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWindowSize } from '@vueuse/core'
import { animate, AnimatePresence, Motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion-v'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { computed, onMounted, ref } from 'vue'

const inertiaTransition = {
  type: 'inertia' as const,
  bounceStiffness: 300,
  bounceDamping: 40,
  timeConstant: 300,
}

const staticTransition = {
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1],
}

const SHEET_MARGIN = 34
const SHEET_RADIUS = 12

let root: HTMLElement

onMounted(() => {
  root = document.body.firstElementChild as HTMLElement
})

const { height, width } = useWindowSize()

const open = ref(false)
const h = computed(() => height.value - SHEET_MARGIN)
const y = useMotionValue(h.value)

// Scale the body down and adjust the border radius when the sheet is open.
const bodyScale = useTransform(
  y,
  [0, h.value],
  [(width.value - SHEET_MARGIN) / width.value, 1],
)
const bodyTranslate = useTransform(y, [0, h.value], [SHEET_MARGIN - SHEET_RADIUS, 0])
const bodyBorderRadius = useTransform(y, [0, h.value], [SHEET_RADIUS, 0])

useMotionValueEvent(bodyScale, 'change', v => root.style.scale = `${v}`)
useMotionValueEvent(
  bodyTranslate,
  'change',
  v => root.style.translate = `0 ${v}px`,
)
useMotionValueEvent(
  bodyBorderRadius,
  'change',
  v => root.style.borderRadius = `${v}px`,
)
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="dark:text-white inline-flex items-center bg-background dark:bg-muted px-3 py-2 rounded-lg text-sm border border-muted-foreground/30">
      Open sheet
    </DialogTrigger>

    <DialogPortal>
      <AnimatePresence
        multiple
        as="div"
      >
        <DialogOverlay as-child>
          <Motion
            class="fixed inset-0 z-10 bg-background/60"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :exit="{ opacity: 0 }"
            :transition="staticTransition"
          />
        </DialogOverlay>

        <DialogContent as-child>
          <Motion
            class="bg-card dark:bg-stone-900 fixed inset-0 z-20 bottom-0 w-full rounded-t-xl shadow-lg will-change-transform"
            :initial="{ y: h }"
            :animate="{ y: 0 }"
            :exit="{ y: h }"
            :transition="staticTransition"
            :style="{
              y,
              top: `${SHEET_MARGIN}px`,
              // Extra padding at the bottom to account for rubber band scrolling.
              paddingBottom: `${height}px`,
            }"
            drag="y"
            :drag-constraints="{ top: 0 }"

            @drag-end="(e, { offset, velocity }) => {
              if (offset.y > height * 0.75 || velocity.y > 10) {
                open = false;
              }
              else {
                animate(y, 0, { ...inertiaTransition, min: 0, max: 0 });
              }
            }"
          >
            <div class="mx-auto w-12 mt-2 h-1.5 rounded-full bg-gray-300 dark:bg-gray-400" />
            <div class="px-4 pb-4 outline-hidden max-w-xl mx-auto">
              <div class="flex justify-end">
                <DialogClose class="dark:text-white inline-flex items-center bg-background dark: p-2 rounded-full text-sm border border-muted-foreground/30">
                  <Icon icon="lucide:x" />
                </DialogClose>
              </div>
              <DialogTitle class="text-3xl font-semibold mb-4">
                Modal sheet
              </DialogTitle>
              <DialogDescription class="text-lg mb-4">
                This is a dialog with a custom modal overlay built with Reka UI and Motion-v.
              </DialogDescription>
              <p class="text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Aenean sit amet nisl blandit, pellentesque eros eu,
                scelerisque eros. Sed cursus urna at nunc lacinia dapibus.
              </p>
            </div>
          </Motion>
        </DialogContent>
      </AnimatePresence>
    </DialogPortal>
  </DialogRoot>
</template>
