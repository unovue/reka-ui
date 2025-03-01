<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { isExternal } from '../functions/utils'

defineProps<{
  icon?: string
  label?: string
  items: {
    text: string
    link?: string
  }[]
}>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger class="py-2 px-2 text-nowrap md:px-0 mx-0 md:mx-3 text-sm font-semibold text-muted-foreground hover:text-foreground h-full inline-flex items-center justify-between data-[state=open]:text-foreground">
      <Icon
        v-if="icon"
        :icon="icon"
        class="ml-1 text-lg"
      />
      <span v-if="label">{{ label }}</span>
      <Icon
        icon="lucide:chevron-down"
        class="ml-1 text-lg"
      />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        position="popper"
        align="end"
        :side-offset="2"
        class="z-10 bg-card border border-muted rounded-lg p-2 shadow-sm"
      >
        <DropdownMenuItem
          v-for="item in items"
          :key="item.text"
          :value="item.text"
          as-child
          class="px-2 py-2 rounded text-sm font-semibold text-muted-foreground h-full flex items-center"
        >
          <a
            v-if="item.link"
            :href="item.link"
            :target="isExternal(item.link) ? '_blank' : undefined"
            class="focus:text-primary focus:bg-primary/10"
          >
            <span>{{ item.text }}</span>
            <Icon
              v-if="isExternal(item.link)"
              icon="lucide:arrow-up-right"
              class="ml-2 text-base"
            />

          </a>
          <div v-else>
            {{ item.text }}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
