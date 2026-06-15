<script setup lang="ts">
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
} from 'reka-ui'
</script>

<template>
  <DrawerRoot>
    <DrawerTrigger
      class="text-grass11 font-semibold hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-md bg-white px-[15px] leading-none shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black dark:focus:shadow-green8 focus:outline-none border"
    >
      Open Drawer
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="DrawerOverlay fixed inset-0 z-30 bg-black/40" />
      <DrawerContent
        class="DrawerContent fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-w-[500px] flex-col rounded-t-[16px] bg-white outline-none"
      >
        <DrawerHandle class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-mauve6" />
        <div class="p-6">
          <DrawerTitle class="text-mauve12 m-0 text-[17px] font-semibold">
            Edit profile
          </DrawerTitle>
          <DrawerDescription class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal">
            Make changes to your profile here. Swipe down or click close when you're done.
          </DrawerDescription>
          <fieldset class="mb-[15px] flex items-center gap-5">
            <label
              class="text-grass11 w-[90px] text-right text-sm"
              for="name"
            > Name </label>
            <input
              id="name"
              class="text-grass11 bg-stone-50 shadow-green7 focus:shadow-green8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-lg px-[10px] text-sm leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              value="Pedro Duarte"
            >
          </fieldset>
          <div class="mt-[25px] flex justify-end">
            <DrawerClose as-child>
              <button
                class="bg-green4 text-green11 text-sm hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-lg px-[15px] font-semibold leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
              >
                Save changes
              </button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<!--
  These styles are not scoped: DrawerContent / DrawerOverlay are teleported to
  `body` by DrawerPortal, so a `scoped` block would not reach them. They drive
  the enter/exit animation and the live swipe-to-dismiss transform — behaviour
  Tailwind utility classes alone cannot express.
-->
<style>
.DrawerOverlay[data-state="open"] {
  animation: drawer-overlay-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerOverlay[data-state="closed"] {
  animation: drawer-overlay-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.DrawerContent {
  /* `--drawer-swipe-movement-y` is written by DrawerContent while dragging. */
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
/* Enter/exit keyframes animate the independent `translate` property so they
   compose with the inline `transform` carrying the live drag offset. */
.DrawerContent[data-state="open"] {
  animation: drawer-slide-bottom-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerContent[data-state="closed"] {
  animation: drawer-slide-bottom-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
/* Silence the transform transition during an active drag so it tracks the
   pointer in real time. */
.DrawerContent[data-swiping] {
  transition-duration: 0ms;
  user-select: none;
}

@keyframes drawer-overlay-in { from { opacity: 0; } }
@keyframes drawer-overlay-out { to { opacity: 0; } }
@keyframes drawer-slide-bottom-in { from { translate: 0 100%; } }
@keyframes drawer-slide-bottom-out { to { translate: 0 100%; } }
</style>
