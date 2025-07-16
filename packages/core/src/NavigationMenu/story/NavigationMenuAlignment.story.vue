<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '..'
import NavigationMenuListItem from './_NavigationMenuListItem.vue'

const currentTrigger = ref('')
</script>

<template>
  <Story
    title="Navigation Menu/Alignment"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div class="w-full h-[600px]">
        <NavigationMenuRoot
          v-model="currentTrigger"
          class="relative z-[1] flex w-full justify-center"
        >
          <NavigationMenuList
            class="center shadow-blackA7 m-0 flex list-none rounded-[6px] bg-white p-1 shadow-[0_2px_10px]"
          >
            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Learn
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight absolute top-0 left-0 w-full sm:w-auto"
              >
                <ul
                  class="one m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[200px]"
                >
                  <li class="row-span-3 grid">
                    <NavigationMenuLink
                      href="/"
                      target="_blank"
                      class="focus:shadow-green7 from-green9 to-teal9 flex h-full w-full select-none flex-col justify-end rounded-[6px] bg-gradient-to-b p-[25px] no-underline outline-none focus:shadow-[0_0_0_2px]"
                      @select.prevent
                    >
                      <svg
                        aria-hidden="true"
                        width="38"
                        height="38"
                        viewBox="0 0 25 25"
                        fill="white"
                      >
                        <path
                          d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z"
                        />
                        <path d="M12 0H4V8H12V0Z" />
                        <path
                          d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z"
                        />
                      </svg>
                      <div
                        class="mt-4 mb-[7px] text-[18px] font-medium leading-[1.2] text-white"
                      >
                        Reka UI
                      </div>
                      <p class="text-mauve4 text-[14px] leading-[1.3]">
                        Unstyled, accessible components for Vue.
                      </p>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Overview 2
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-0 left-0 w-full sm:w-auto"
              >
                <ul
                  class="m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[300px] sm:grid-flow-col sm:grid-rows-3"
                >
                  <NavigationMenuListItem
                    title="Introduction"
                    href="/docs/primitives/overview/introduction"
                  >
                    Build high-quality, accessible design systems and web apps.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Getting started"
                    href="/docs/primitives/overview/getting-started"
                  >
                    A quick tutorial to get you up and running with Radix
                    Primitives.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Styling"
                    href="/docs/primitives/guides/styling"
                  >
                    Unstyled and compatible with any styling solution.
                  </NavigationMenuListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Overview
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-0 left-0 w-full sm:w-auto"
              >
                <ul
                  class="m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[600px] sm:grid-flow-col sm:grid-rows-3"
                >
                  <NavigationMenuListItem
                    title="Introduction"
                    href="/docs/primitives/overview/introduction"
                  >
                    Build high-quality, accessible design systems and web apps.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Getting started"
                    href="/docs/primitives/overview/getting-started"
                  >
                    A quick tutorial to get you up and running with Radix
                    Primitives.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Styling"
                    href="/docs/primitives/guides/styling"
                  >
                    Unstyled and compatible with any styling solution.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Animation"
                    href="/docs/primitives/guides/animation"
                  >
                    Use CSS keyframes or any animation library of your choice.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Accessibility"
                    href="/docs/primitives/overview/accessibility"
                  >
                    Tested in a range of browsers and assistive technologies.
                  </NavigationMenuListItem>
                  <NavigationMenuListItem
                    title="Releases"
                    href="/docs/primitives/overview/releases"
                  >
                    Reka UI releases and their changelogs.
                  </NavigationMenuListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                class="text-grass11 hover:bg-green3 focus:shadow-green7 block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline outline-none focus:shadow-[0_0_0_2px]"
                href="https://github.com/unovue"
              >
                Github
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuIndicator
              class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
            >
              <div class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-white border" />
            </NavigationMenuIndicator>
          </NavigationMenuList>

          <div
            class="perspective-[2000px] absolute top-full left-0 flex w-full mt-[10px]"
          >
            <div class="relative w-full">
              <NavigationMenuViewport
                class="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut absolute top-0 h-[var(--reka-navigation-menu-viewport-height)] origin-[top_center] w-full overflow-hidden rounded-[6px] bg-white transition-[width,_height,_left] duration-300 sm:w-[var(--reka-navigation-menu-viewport-width)] left-[var(--reka-navigation-menu-viewport-left)]"
              />
            </div>
          </div>
        </NavigationMenuRoot>
      </div>
    </Variant>
  </Story>
</template>
