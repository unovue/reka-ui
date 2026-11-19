<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from 'reka-ui'
import { ref } from 'vue'
import { sections } from './menu'

const current = ref('')
</script>

<template>
  <NavigationMenuRoot
    v-model="current"
    class="relative z-[1] flex w-full justify-center"
  >
    <NavigationMenuList class="m-0 flex list-none items-center gap-1 rounded-lg border border-muted bg-card p-1">
      <NavigationMenuItem
        v-for="section in sections"
        :key="section.value"
        :value="section.value"
      >
        <NavigationMenuTrigger class="group flex select-none items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-primary/40">
          {{ section.label }}
          <Icon
            icon="lucide:chevron-down"
            class="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:-rotate-180"
          />
        </NavigationMenuTrigger>

        <!-- `data-motion` tells you which direction the previous panel left in,
             so panels slide toward the trigger the user moved to. -->
        <NavigationMenuContent class="absolute left-0 top-0 w-full data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight sm:w-auto">
          <ul
            class="m-0 grid list-none gap-1 p-3 sm:w-[440px]"
            :class="section.columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'"
          >
            <li
              v-for="link in section.links"
              :key="link.title"
            >
              <NavigationMenuLink as-child>
                <a
                  href="#"
                  class="flex select-none items-start gap-3 rounded-lg p-3 no-underline outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-primary/40"
                >
                  <Icon
                    :icon="link.icon"
                    class="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <span>
                    <span class="block text-sm font-medium text-foreground">{{ link.title }}</span>
                    <span class="block text-xs leading-snug text-muted-foreground">{{ link.description }}</span>
                  </span>
                </a>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink
          class="block select-none rounded-md px-3 py-2 text-sm font-medium text-foreground no-underline outline-none hover:bg-muted focus:ring-2 focus:ring-primary/40"
          href="https://github.com/unovue/reka-ui"
        >
          GitHub
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- The indicator reads its own size and offset from the active trigger. -->
      <NavigationMenuIndicator class="absolute top-full z-[100] mt-[3px] flex h-2 w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] items-end justify-center overflow-hidden transition-[width,transform] duration-200 data-[state=hidden]:opacity-0 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut">
        <div class="relative top-1/2 size-2.5 rotate-45 rounded-sm border border-muted bg-card" />
      </NavigationMenuIndicator>
    </NavigationMenuList>

    <div class="absolute left-0 top-full flex w-full justify-center perspective-[2000px]">
      <!-- Height and width animate between panels because the viewport measures
           whichever content is active and exposes it as a CSS variable. -->
      <NavigationMenuViewport class="relative mt-2.5 h-[var(--reka-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-xl border border-muted bg-card shadow-lg transition-[width,height] duration-300 data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut sm:w-[var(--reka-navigation-menu-viewport-width)]" />
    </div>
  </NavigationMenuRoot>
</template>
