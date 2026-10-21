<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useMediaQuery } from '@vueuse/core'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger, DrawerClose, DrawerContent, DrawerDescription, DrawerHandle, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport, VisuallyHidden } from 'reka-ui'
import { ref } from 'vue'
import { sections } from './nav'

// Below the breakpoint the horizontal menu has nowhere to go, so the same
// sections become an accordion inside a drawer instead of a hover flyout.
const isDesktop = useMediaQuery('(min-width: 640px)')
const open = ref(false)
const current = ref('')
</script>

<template>
  <div class="w-full max-w-[560px] rounded-xl border border-muted bg-card">
    <header class="flex items-center justify-between gap-4 px-4 py-3">
      <span class="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon
          icon="lucide:hexagon"
          class="size-4 text-primary"
        />
        Acme
      </span>

      <NavigationMenuRoot
        v-if="isDesktop"
        v-model="current"
        class="relative flex justify-center"
      >
        <NavigationMenuList class="m-0 flex list-none items-center gap-1 p-0">
          <NavigationMenuItem
            v-for="section in sections"
            :key="section.value"
            :value="section.value"
          >
            <NavigationMenuTrigger class="group flex select-none items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-primary/40">
              {{ section.label }}
              <Icon
                icon="lucide:chevron-down"
                class="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:-rotate-180"
              />
            </NavigationMenuTrigger>
            <NavigationMenuContent class="absolute left-0 top-0 w-full data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight sm:w-auto">
              <ul class="m-0 grid list-none gap-1 p-2 sm:w-[280px]">
                <li
                  v-for="link in section.links"
                  :key="link.title"
                >
                  <NavigationMenuLink as-child>
                    <a
                      href="#"
                      class="block select-none rounded-lg p-2.5 no-underline outline-none hover:bg-muted focus:ring-2 focus:ring-primary/40"
                    >
                      <span class="block text-sm font-medium text-foreground">{{ link.title }}</span>
                      <span class="block text-xs leading-snug text-muted-foreground">{{ link.description }}</span>
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>

        <div class="absolute right-0 top-full flex justify-end">
          <NavigationMenuViewport class="relative mt-2 h-[var(--reka-navigation-menu-viewport-height)] w-[var(--reka-navigation-menu-viewport-width)] origin-[top_center] overflow-hidden rounded-xl border border-muted bg-card shadow-lg transition-[width,height] duration-300 data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut" />
        </div>
      </NavigationMenuRoot>

      <DrawerRoot
        v-else
        v-model:open="open"
      >
        <DrawerTrigger
          class="rounded-md p-1.5 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Open navigation"
        >
          <Icon
            icon="lucide:menu"
            class="size-5"
          />
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="MobileNavOverlay fixed inset-0 z-30 bg-background/80" />
          <DrawerContent class="MobileNavContent fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-h-[80vh] max-w-[500px] flex-col rounded-t-2xl border-t border-muted bg-card outline-none">
            <DrawerHandle class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/40" />
            <VisuallyHidden>
              <DrawerTitle>Navigation</DrawerTitle>
              <DrawerDescription>Browse the site sections</DrawerDescription>
            </VisuallyHidden>

            <!-- The drawer scrolls, so the accordion can be as tall as it likes. -->
            <AccordionRoot
              class="overflow-y-auto p-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
              type="single"
              collapsible
            >
              <AccordionItem
                v-for="section in sections"
                :key="section.value"
                :value="section.value"
                class="border-b border-muted last:border-0"
              >
                <AccordionHeader class="flex">
                  <AccordionTrigger class="group flex flex-1 items-center justify-between px-2 py-3.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    {{ section.label }}
                    <Icon
                      icon="lucide:chevron-down"
                      class="size-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180"
                    />
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent class="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  <ul class="flex list-none flex-col gap-1 px-2 pb-3">
                    <li
                      v-for="link in section.links"
                      :key="link.title"
                    >
                      <!-- Navigating has to dismiss the sheet; the desktop
                           flyout closes itself, a controlled drawer does not. -->
                      <DrawerClose as-child>
                        <a
                          href="#"
                          class="block rounded-lg px-2 py-2 no-underline hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <span class="block text-sm text-foreground">{{ link.title }}</span>
                          <span class="block text-xs leading-snug text-muted-foreground">{{ link.description }}</span>
                        </a>
                      </DrawerClose>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </AccordionRoot>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </header>

    <p class="border-t border-muted px-4 py-3 text-xs text-muted-foreground">
      {{ isDesktop ? 'Hover the triggers — resize below 640px for the drawer.' : 'Tap the menu — resize above 640px for the flyout.' }}
    </p>
  </div>
</template>

<!-- Not scoped: DrawerPortal teleports these to `body`. -->
<style>
.MobileNavOverlay[data-state="open"] { animation: mobile-nav-overlay-in 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.MobileNavOverlay[data-state="closed"] { animation: mobile-nav-overlay-out 450ms cubic-bezier(0.32, 0.72, 0, 1); }

.MobileNavContent {
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.MobileNavContent[data-state="open"] { animation: mobile-nav-slide-in 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.MobileNavContent[data-state="closed"] { animation: mobile-nav-slide-out 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.MobileNavContent[data-swiping] { transition-duration: 0ms; user-select: none; }

@keyframes mobile-nav-overlay-in { from { opacity: 0; } }
@keyframes mobile-nav-overlay-out { to { opacity: 0; } }
@keyframes mobile-nav-slide-in { from { translate: 0 100%; } }
@keyframes mobile-nav-slide-out { to { translate: 0 100%; } }
</style>
