<script setup lang="ts">
import { Content, useData, useRoute } from 'vitepress'
import { computed, toRefs } from 'vue'
import { withBase } from 'ufo'
import DocOutline from '../components/DocOutline.vue'
import DocSidebar from '../components/DocSidebar.vue'
import DocTopbar from '../components/DocTopbar.vue'
import DocFooter from '../components/DocFooter.vue'
import DocCommunity from '../components/DocCommunity.vue'
import DocCarbonAds from '../components/DocCarbonAds.vue'
import type { DefaultTheme } from 'vitepress/theme'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { flatten } from '../functions/flatten'

const { theme, frontmatter } = useData()
const { path } = toRefs(useRoute())

const sidebar = computed(() => theme.value.sidebar as DefaultTheme.SidebarItem[])
const activeSection = computed(() => sidebar.value.find(section => flatten(section.items ?? [], 'items')?.find(item => (section.base && item.link ? withBase(item.link, section.base) : item.link) === path.value.replace('.html', ''))))

const isExamplePage = computed(() => path.value.includes('examples'))
</script>

<template>
  <div class="w-full">
    <div
      class="z-0 w-full h-max absolute top-0 left-0 inset-0 pointer-events-none flex justify-center overflow-hidden"
    >
      <div class="w-[108rem] flex-none flex justify-end">
        <img
          class="w-[90rem] flex-none max-w-none"
          decoding="async"
          src="/new-bg.png"
          alt="backdrop"
        >
      </div>
    </div>

    <DocTopbar />

    <main class="flex">
      <aside class="hidden md:block w-[17rem] flex-shrink-0 py-4 pl-4 pr-4 sticky top-[7.25rem] h-full overflow-y-auto max-h-[calc(100vh-7.25rem)]">
        <div
          v-if="activeSection"
          class="h-full"
        >
          <DocSidebar
            :items="activeSection.items ?? []"
            :base="activeSection.base"
          />
        </div>
        <div class="h-6 w-full" />
      </aside>

      <div class="px-6 md:px-24 py-6 md:py-12 overflow-x-hidden flex-1 ">
        <CollapsibleRoot
          :key="path"
          class="block xl:hidden mb-4"
        >
          <CollapsibleTrigger class="text-sm rounded-lg border border-muted px-4 py-2 mb-2 bg-card data-[state=open]:bg-muted">
            {{ theme.outline?.label || 'On this page' }}
          </CollapsibleTrigger>

          <CollapsibleContent class="ml-4 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
            <DocOutline collapsible />
          </CollapsibleContent>
        </CollapsibleRoot>

        <div class="font-bold text-primary mb-2 text-sm">
          {{ activeSection?.text }}
        </div>
        <article class="w-full prose prose-stone dark:prose-invert max-w-none">
          <Content />
        </article>

        <DocFooter v-if="!isExamplePage" />
      </div>

      <div
        v-if="!isExamplePage"
        class="hidden xl:flex w-64 flex-shrink-0 py-12 pl-2 sticky top-[7.25rem] overflow-y-auto md:overflow-x-hidden h-[calc(100vh-7.25rem)] flex-col space-y-6 no-scrollbar"
      >
        <DocOutline />
        <DocCommunity />
        <div class="grow" />
        <DocCarbonAds />

        <div class="fixed bottom-0 z-10 w-64 h-12 bg-gradient-to-b from-transparent to-background" />
      </div>
    </main>
  </div>
</template>
