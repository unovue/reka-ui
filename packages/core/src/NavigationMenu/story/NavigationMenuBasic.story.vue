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
} from '..'
import LinkGroup from './_LinkGroup.vue'
import StoryFrame from './_StoryFrame.vue'

const currentTrigger = ref('')
// Refs, not a `reactive` object: vue-tsc reports a bogus `.value` access on a reactive `state` read in this Variant's `#controls` slot.
const delayDuration = ref(600)
const skipDelayDuration = ref(1000)
</script>

<template>
  <Story title="Navigation Menu/Basic">
    <Variant title="Default">
      <StoryFrame>
        <NavigationMenuRoot
          v-model="currentTrigger"
          :delay-duration="delayDuration"
          :skip-delay-duration="skipDelayDuration"
          class="relative z-[1] flex w-full justify-center"
        >
          <NavigationMenuList
            class="center shadow-blackA7 m-0 flex list-none rounded-[6px] bg-white p-1 shadow-[0_2px_10px]"
          >
            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Products
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[popup-open]:-rotate-180"
                />
              </NavigationMenuTrigger>

              <NavigationMenuContent
                class="absolute top-10 left-0 bg-white rounded-xl w-full sm:w-auto"
              >
                <LinkGroup
                  :items="[
                    'Fusce pellentesque',
                    'Aliquam porttitor',
                    'Pellentesque',
                    'Fusce pellentesque',
                    'Aliquam porttitor',
                    'Pellentesque',
                  ]"
                />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Company
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[popup-open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-10 left-0 bg-white rounded-xl w-full sm:w-auto"
              >
                <LinkGroup
                  :items="[
                    'Fusce pellentesque',
                    'Aliquam porttitor',
                    'Pellentesque',
                  ]"
                />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Developers
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[popup-open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-10 left-0 bg-white rounded-xl w-full sm:w-auto"
              >
                <LinkGroup :items="['Aliquam porttitor', 'Pellentesque']" />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                class="text-grass11 hover:bg-green3 focus:shadow-green7 block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline outline-none focus:shadow-[0_0_0_2px]"
                href="https://github.com/unovue"
              >
                Link
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuIndicator
              class="absolute bg-green10 left-0 h-[2px] bottom-0 w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] rounded-full transition-[width,transform] duration-300"
            />
          </NavigationMenuList>
        </NavigationMenuRoot>
      </StoryFrame>

      <template #controls>
        <HstNumber
          v-model="delayDuration"
          title="Delay Duration"
        />
        <HstNumber
          v-model="skipDelayDuration"
          title="Skip Delay Duration"
        />
      </template>
    </Variant>
  </Story>
</template>
