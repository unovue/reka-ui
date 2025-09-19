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
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '..'
import LinkGroup from './_LinkGroup.vue'
import StoryFrame from './_StoryFrame.vue'

const currentTrigger = ref('')
</script>

<template>
  <Story title="Navigation Menu/Submenus">
    <Variant title="Default">
      <StoryFrame>
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
                Products
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                />
              </NavigationMenuTrigger>

              <NavigationMenuContent
                class="absolute top-0 left-0 bg-white rounded-xl w-full sm:w-auto"
              >
                <NavigationMenuSub
                  default-value="extensibility"
                  class="w-full grid max-w-[800px] gap-4 justify-center"
                >
                  <NavigationMenuList
                    class="center shadow-blackA7 m-0 flex list-none rounded-[6px] bg-white p-1 shadow-[0_2px_10px]"
                  >
                    <NavigationMenuItem value="extensibility">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Extensibility
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>

                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
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

                    <NavigationMenuItem value="security">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Security
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
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

                    <NavigationMenuItem value="authentication">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Authentication
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
                      >
                        <LinkGroup
                          :items="['Aliquam porttitor', 'Pellentesque']"
                        />
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuIndicator
                      class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
                    >
                      <div class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-white border" />
                    </NavigationMenuIndicator>
                  </NavigationMenuList>

                  <NavigationMenuViewport class="w-full" />
                </NavigationMenuSub>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger
                class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
              >
                Company
                <Icon
                  icon="radix-icons:caret-down"
                  class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-0 left-0 bg-white rounded-xl w-full sm:w-auto"
              >
                <NavigationMenuSub
                  default-value="customers"
                  orientation="vertical"
                  class="w-full grid max-w-[800px] gap-4"
                  :style="{ 'grid-template-columns': '0.3fr 1fr' }"
                >
                  <NavigationMenuList
                    class="center shadow-blackA7 m-0 flex flex-col h-full list-none rounded-[6px] bg-white p-1 shadow-[0_2px_10px]"
                  >
                    <NavigationMenuItem value="customers">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Customers
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>

                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
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

                    <NavigationMenuItem value="security">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Security
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
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

                    <NavigationMenuItem value="authentication">
                      <NavigationMenuTrigger
                        class="text-grass11 hover:bg-green3 focus:shadow-green7 group flex select-none items-center justify-between gap-[2px] rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                      >
                        Authentication
                        <Icon
                          icon="radix-icons:caret-down"
                          class="text-green10 relative top-[1px] transition-transform duration-250 ease-in group-data-[state=open]:-rotate-180"
                        />
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        class="absolute top-10 contents left-0 bg-white rounded-xl w-full sm:w-auto"
                      >
                        <LinkGroup
                          :items="['Aliquam porttitor', 'Pellentesque']"
                        />
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuIndicator
                      class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
                    >
                      <div class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-white border" />
                    </NavigationMenuIndicator>
                  </NavigationMenuList>

                  <NavigationMenuViewport class="w-full" />
                </NavigationMenuSub>
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
              class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
            >
              <div class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-white border" />
            </NavigationMenuIndicator>
          </NavigationMenuList>

          <NavigationMenuViewport
            class="absolute top-full border-t origin-[top_center] mt-[10px] w-[var(--reka-navigation-menu-viewport-width)] bg-white h-[var(--reka-navigation-menu-viewport-height)] transition-[height] overflow-hidden shadow-xl"
          />
        </NavigationMenuRoot>
      </StoryFrame>
    </Variant>
  </Story>
</template>
