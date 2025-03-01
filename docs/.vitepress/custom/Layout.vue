<script setup lang="ts">
import Docs from './Docs.vue'
import { useData, useRoute } from 'vitepress'
import SearchTrigger from '../components/SearchTrigger.vue'
import Navbar from '../components/Navbar.vue'
// import HomePageDemo from '../components/HomePageDemo.vue'
import Home from '../components/Home.vue'
import { useScroll } from '@vueuse/core'
import { toRefs, watch } from 'vue'
import { TooltipProvider } from 'reka-ui'
import Showcase from './Showcase.vue'
import { useI18n } from 'vue-i18n'
import { normalizeLink } from '../functions/utils'

const { locale } = useI18n()
const { site, theme, frontmatter, lang } = useData()

watch(lang, (newLang) => {
  locale.value = newLang
}, {
  immediate: true,
})

const { path } = toRefs(useRoute())
const { arrivedState } = useScroll(globalThis.window)
const { top } = toRefs(arrivedState)
</script>

<template>
  <TooltipProvider>
    <div class="flex flex-col items-center min-h-screen h-full">
      <header
        class="w-full py-4 sticky top-0 z-20 transition-all duration-500 h-[68px] md:h-full"
        :class="[top ? 'bg-transparent backdrop-blur-0' : 'bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/90']"
      >
        <div class="max-w-[1440px] flex items-center justify-between mx-auto px-6">
          <div class="w-full justify-between md:justify-normal flex items-center gap-8">
            <a
              :href="normalizeLink('/')"
              class="flex items-center gap-2"
            >
              <img
                class="w-6 md:w-9"
                alt="Reka UI logo"
                :src="theme.logo"
              >
              <span class="font-bold text-xl md:text-2xl">{{ site.title }}</span>
            </a>
            <SearchTrigger />
          </div>

          <Navbar />
        </div>
      </header>

      <div
        v-if="frontmatter.layout === 'home'"
        class="h-full flex flex-col justify-between flex-1 w-full"
      >
        <main>
          <Home />
          <!-- <Content /> -->
        </main>

      <!-- <footer class="py-4">
        footer
      </footer> -->
      </div>

      <div
        v-else-if="frontmatter.layout === 'showcase'"
        class="max-w-[1440px] w-full h-full grow"
      >
        <Showcase />
      </div>

      <div
        v-else
        class="max-w-[1440px] w-full h-full grow"
      >
        <Docs />
      </div>
    </div>
  </TooltipProvider>
</template>
