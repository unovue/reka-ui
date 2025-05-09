<script setup lang="ts">
import type { DefaultTheme } from 'vitepress'
import { Icon } from '@iconify/vue'
import { useScroll } from '@vueuse/core'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { useData, useRoute } from 'vitepress'
import { computed, ref, toRefs, watch } from 'vue'
import DocSidebarItem from '../components/DocSidebarItem.vue'
import { flatten } from '../functions/flatten'

const { path } = toRefs(useRoute())
const { page, theme } = useData()

const isSidebarOpen = ref(false)
const sidebar = computed(() => (theme.value.sidebar as DefaultTheme.SidebarItem[]))

const sectionTabs = computed(() => sidebar.value.map(val => ({ label: val.text, link: flatten(val.items ?? [], 'items').filter(i => !!i.link)?.[0].link, icon: val.icon })))

const { arrivedState } = useScroll(globalThis.window)
const { top } = toRefs(arrivedState)

watch(path, () => {
  isSidebarOpen.value = false
})
</script>

<template>
  <div
    class="border-y w-full h-12 sticky top-[4.25rem] z-10 transition-all duration-500 px-4 border-muted-foreground/10"
    :class="[top ? 'bg-transparent backdrop-blur-0' : 'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80']"
  >
    <div class="hidden md:flex items-center justify-between h-full">
      <div class="h-full flex items-center">
        <a
          v-for="tab in sectionTabs.filter(i => i.label !== 'Examples')"
          :key="tab.label"
          :href="tab.link"
          :class="{ '!border-b-primary !text-foreground': `/${page.relativePath}`.includes(tab.link.split('/').slice(0, -1).join('/')) }"
          class=" py-2 mx-4 text-sm font-semibold border-b border-b-transparent text-muted-foreground hover:border-b-muted hover:text-foreground h-full inline-flex items-center"
        >
          <Icon
            v-if="tab.icon"
            :icon="tab.icon"
            class="mr-2 text-lg"
          />
          <span>{{ tab.label }}</span>
        </a>
      </div>

      <div class="h-full flex items-center">
        <a
          v-for="tab in sectionTabs.filter(i => i.label === 'Examples')"
          :key="tab.label"
          :href="tab.link"
          :class="{ '!border-b-primary !text-foreground': page.relativePath.includes(tab.label?.toLowerCase() ?? '') }"
          class=" py-2 mx-4 text-sm font-semibold border-b border-b-transparent text-muted-foreground hover:border-b-muted hover:text-foreground h-full inline-flex items-center"
        >
          <Icon
            v-if="tab.icon"
            :icon="tab.icon"
            class="mr-2 text-lg"
          />
          <span>{{ tab.label }}</span>
        </a>
      </div>
    </div>

    <div class="flex md:hidden items-center justify-between h-full">
      <DialogRoot v-model:open="isSidebarOpen">
        <DialogTrigger
          aria-label="Menu button"
          class="p-2  rounded-lg hover:bg-muted flex items-center"
        >
          <Icon
            icon="lucide:menu"
            class="text-lg"
          />
          <span class="ml-2 text-sm">Menu</span>
        </DialogTrigger>

        <DialogPortal>
          <DialogOverlay class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
          <DialogContent class="fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-enterFromLeft data-[state=closed]:animate-exitToLeft inset-y-0 left-0 h-full w-3/4 border-r border-muted data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm pr-0">
            <DialogTitle class="sr-only">
              Sidebar menu
            </DialogTitle>
            <DialogDescription class="sr-only">
              List of navigation item
            </DialogDescription>

            <div class="pt-8 overflow-y-auto h-full">
              <div
                v-for="group in theme.sidebar"
                :key="group.text"
                class="px-4 mb-4 pb-4 border-b border-muted"
              >
                <div class="flex items-center mb-2 ml-2">
                  <Icon
                    v-if="group.icon"
                    :icon="group.icon"
                    class="mx-2 text-lg"
                  />
                  <span class="font-bold">{{ group.text }}</span>
                </div>

                <template
                  v-for="item in group.items"
                  :key="item.text"
                >
                  <ul
                    v-if="item.items?.length"
                    class="[&:not(:last-child)]:mb-6"
                  >
                    <div class="pl-4 font-bold text-sm pb-2">
                      {{ item.text }}
                    </div>
                    <DocSidebarItem
                      v-for="subitem in item.items"
                      :key="subitem.text"
                      :item="subitem"
                    />
                  </ul>

                  <DocSidebarItem
                    v-else
                    :item="item"
                  />
                </template>
              </div>
              <div class="h-12 w-full" />
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>

      <div class="h-full flex items-center">
        <a
          href="/examples"
          :class="{ '!border-b-primary !font-semibold !text-foreground': page.relativePath.includes('examples') }"
          class="py-2 mx-4 text-sm font-medium border-b border-b-transparent text-muted-foreground hover:border-b-muted hover:text-foreground h-full inline-flex items-center gap-2"
        >
          <Icon
            icon="lucide:square-dashed-mouse-pointer"
            class="text-lg"
          />
          Examples
        </a>
      </div>
    </div>
  </div>
</template>
