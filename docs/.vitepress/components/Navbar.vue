<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, Separator } from 'reka-ui'
import ThemeToggle from '../components/ThemeToggle.vue'
import DropdownMenu from '../components/DropdownMenu.vue'
import { useData, useRoute } from 'vitepress'
import { ref, toRefs, watch } from 'vue'
import { useLangs } from '../composables/langs'

const { path } = toRefs(useRoute())
const { theme } = useData()

const isPopoverOpen = ref(false)

watch(path, () => {
  isPopoverOpen.value = false
})

const { localeLinks, currentLang } = useLangs({ correspondingLink: true })
</script>

<template>
  <nav class="hidden lg:flex items-center">
    <template
      v-for="nav in theme.nav"
      :key="nav.text"
    >
      <a
        v-if="nav.link"
        :href="nav.link"
        class="py-2 mx-3 text-sm font-semibold text-muted-foreground hover:text-foreground h-full inline-flex items-center text-nowrap"
        :class="{ '!text-primary': path.includes(nav.text.toLowerCase()) }"
      >
        {{ nav.text }}
      </a>
      <DropdownMenu
        v-else-if="nav.items"
        :label="nav.text"
        :items="nav.items"
      />
    </template>

    <Separator
      class="bg-muted h-4 w-px mx-4"
      decorative
      orientation="vertical"
    />
    <DropdownMenu
      v-if="localeLinks.length && currentLang.label"
      icon="lucide:languages"
      :items="[{ text: currentLang.label }, ...localeLinks]"
    />

    <Separator
      class="bg-muted h-4 w-px mx-4"
      decorative
      orientation="vertical"
    />
    <ThemeToggle />

    <Separator
      class="bg-muted h-4 w-px mx-4"
      decorative
      orientation="vertical"
    />

    <a
      v-for="link in theme.socialLinks"
      :key="link.link"
      :href="link.link"
      :aria-label="link.icon"
      target="_blank"
      class="w-9 h-9 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center rounded-lg text-xl flex-shrink-0"
    >
      <Icon :icon="`simple-icons:${link.icon}`" />
    </a>
  </nav>

  <div class="lg:hidden">
    <DropdownMenuRoot v-model:open="isPopoverOpen">
      <DropdownMenuTrigger class="p-2 rounded-lg">
        <Icon
          icon="lucide:ellipsis"
          class="text-lg"
        />
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          side="bottom"
          :side-offset="5"
          align="end"
          class="rounded-xl z-10 p-2 w-[180px] bg-card border border-muted shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade"
        >
          <nav class="flex flex-col">
            <template
              v-for="nav in theme.nav"
              :key="nav.text"
            >
              <DropdownMenuItem
                v-if="nav.link"
                as="a"
                :href="nav.link"
                class="p-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded h-full inline-flex items-center"
              >
                {{ nav.text }}
              </DropdownMenuItem>

              <DropdownMenuSub v-else-if="nav.items">
                <DropdownMenuSubTrigger class="w-full justify-between p-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded h-full inline-flex items-center">
                  <span>{{ nav.text }}</span>
                  <Icon
                    icon="lucide:chevron-down"
                    class="ml-1 text-lg"
                  />
                </DropdownMenuSubTrigger>

                <DropdownMenuPortal>
                  <DropdownMenuSubContent class="rounded-xl z-10 p-2 w-[180px] bg-card border border-muted shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade">
                    <DropdownMenuItem
                      v-for="item in nav.items"
                      :key="item.text"
                      class="w-full p-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded h-full inline-flex items-center"
                    >
                      <a
                        v-if="item.link"
                        :href="item.link"
                        target="_blank"
                        class="w-full flex items-center justify-between"
                      >
                        <span>{{ item.text }}</span>
                        <Icon
                          icon="lucide:arrow-up-right"
                          class="ml-2 text-base"
                        />

                      </a>
                      <div v-else>
                        {{ item.text }}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </template>

            <Separator
              class="bg-muted h-px w-full my-2"
              decorative
              orientation="horizontal"
            />
            <DropdownMenuSub v-if="localeLinks.length && currentLang.label">
              <DropdownMenuSubTrigger class="w-full justify-between p-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded h-full inline-flex items-center">
                <Icon
                  icon="lucide:languages"
                  class="ml-1 text-lg"
                />
                <Icon
                  icon="lucide:chevron-down"
                  class="ml-1 text-lg"
                />
              </DropdownMenuSubTrigger>

              <DropdownMenuPortal>
                <DropdownMenuSubContent class="rounded-xl z-10 p-2 w-[180px] bg-card border border-muted shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=bottom]:animate-slideUpAndFade">
                  <DropdownMenuItem class="w-full p-2 text-sm font-semibold text-muted-foreground rounded h-full inline-flex items-center">
                    {{ currentLang.label }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-for="item in localeLinks"
                    :key="item.text"
                    class="w-full p-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded h-full inline-flex items-center"
                  >
                    <a
                      :href="item.link"
                      class="w-full flex items-center justify-between"
                    >
                      <span>{{ item.text }}</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <Separator
              class="bg-muted h-px w-full my-2"
              decorative
              orientation="horizontal"
            />

            <div class="flex items-center text-sm justify-between px-2">
              <label
                for="theme-toggle"
                class="font-semibold text-muted-foreground"
              >{{ theme.darkModeSwitchLabel || 'Appearance' }}</label>
              <DropdownMenuItem
                as-child
                @select.prevent
              >
                <ThemeToggle />
              </DropdownMenuItem>
            </div>

            <Separator
              class="bg-muted h-px w-full my-2"
              decorative
              orientation="horizontal"
            />

            <div class="flex items-center gap-2 px-2">
              <DropdownMenuItem
                v-for="link in theme.socialLinks"
                :key="link.link"
                as="a"
                :href="link.link"
                :aria-label="link.icon"
                target="_blank"
                class="w-9 h-9 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center rounded-lg text-xl"
              >
                <Icon :icon="`simple-icons:${link.icon}`" />
              </DropdownMenuItem>
            </div>
          </nav>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
