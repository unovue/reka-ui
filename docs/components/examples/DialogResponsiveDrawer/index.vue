<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, DrawerClose, DrawerContent, DrawerDescription, DrawerHandle, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from 'reka-ui'
import { reactive, ref } from 'vue'
import ProfileForm from './ProfileForm.vue'

// Resize the window across 640px to swap the presentation. `open` and the form
// values live outside both roots, so neither the sheet nor what was typed into
// it is lost when one root is unmounted and the other takes over.
const isDesktop = useMediaQuery('(min-width: 640px)')
const open = ref(false)
const profile = reactive({ name: 'Pedro Duarte', username: '@peduarte' })

const triggerClass = 'inline-flex items-center h-9 px-4 rounded-lg border border-muted bg-card text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40'
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <DialogRoot
      v-if="isDesktop"
      v-model:open="open"
    >
      <DialogTrigger :class="triggerClass">
        Edit profile
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-30 bg-background/80 data-[state=open]:animate-overlayShow" />
        <DialogContent class="fixed z-[100] top-1/2 left-1/2 w-[90vw] max-w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-muted bg-card p-6 focus:outline-none data-[state=open]:animate-contentShow">
          <DialogTitle class="text-base font-semibold text-foreground">
            Edit profile
          </DialogTitle>
          <DialogDescription class="mt-1 mb-4 text-sm text-muted-foreground">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>

          <ProfileForm
            v-model:name="profile.name"
            v-model:username="profile.username"
          />

          <div class="mt-5 flex justify-end">
            <DialogClose :class="triggerClass">
              Save changes
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <DrawerRoot
      v-else
      v-model:open="open"
    >
      <DrawerTrigger :class="triggerClass">
        Edit profile
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay class="ResponsiveDrawerOverlay fixed inset-0 z-30 bg-background/80" />
        <DrawerContent class="ResponsiveDrawerContent fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-w-[500px] flex-col rounded-t-2xl border-t border-muted bg-card outline-none">
          <DrawerHandle class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/40" />
          <div class="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <DrawerTitle class="text-base font-semibold text-foreground">
              Edit profile
            </DrawerTitle>
            <DrawerDescription class="mt-1 mb-4 text-sm text-muted-foreground">
              Make changes to your profile here. Swipe down or tap save when you're done.
            </DrawerDescription>

            <ProfileForm
              v-model:name="profile.name"
              v-model:username="profile.username"
              touch
            />

            <div class="mt-5 flex justify-end">
              <DrawerClose :class="triggerClass">
                Save changes
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>

    <p class="text-xs text-muted-foreground">
      {{ profile.name }} ({{ profile.username }}) — currently a
      {{ isDesktop ? 'dialog' : 'drawer' }}, resize the window to swap.
    </p>
  </div>
</template>

<!--
  Not scoped: DrawerPortal teleports these elements to `body`, out of reach of a
  `scoped` block. They drive the slide animation and the live swipe transform,
  which utility classes cannot express.
-->
<style>
.ResponsiveDrawerOverlay[data-state="open"] {
  animation: responsive-drawer-overlay-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.ResponsiveDrawerOverlay[data-state="closed"] {
  animation: responsive-drawer-overlay-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ResponsiveDrawerContent {
  /* `--drawer-swipe-movement-y` is written by DrawerContent while dragging. */
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
/* Enter/exit animate the independent `translate` property so they compose with
   the inline `transform` carrying the live drag offset. */
.ResponsiveDrawerContent[data-state="open"] {
  animation: responsive-drawer-slide-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.ResponsiveDrawerContent[data-state="closed"] {
  animation: responsive-drawer-slide-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.ResponsiveDrawerContent[data-swiping] {
  transition-duration: 0ms;
  user-select: none;
}

@keyframes responsive-drawer-overlay-in { from { opacity: 0; } }
@keyframes responsive-drawer-overlay-out { to { opacity: 0; } }
@keyframes responsive-drawer-slide-in { from { translate: 0 100%; } }
@keyframes responsive-drawer-slide-out { to { translate: 0 100%; } }
</style>
