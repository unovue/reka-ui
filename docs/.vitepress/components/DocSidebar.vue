<script setup lang="ts">
import type { DefaultTheme } from 'vitepress/theme'
import { Icon } from '@iconify/vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import DocSidebarItem from './DocSidebarItem.vue'

defineProps<{
  items: DefaultTheme.SidebarItem[]
}>()
</script>

<template>
  <div
    v-for="item in items"
    :key="item.text"
  >
    <CollapsibleRoot
      v-if="item.items?.length"
      v-slot="{ open }"
      class="mb-6"
      :default-open="true"
    >
      <CollapsibleTrigger class="pl-4 font-bold text-sm pb-2 inline-flex justify-between w-full items-center pr-4 group">
        <span>{{ item.text }}</span>
        <Icon
          icon="lucide:chevron-down"
          class="text-lg text-muted-foreground group-hover:text-foreground transition"
          :class="{ '-rotate-90': !open }"
        />
      </CollapsibleTrigger>
      <CollapsibleContent class="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
        <DocSidebarItem
          v-for="subitem in item.items"
          :key="subitem.text"
          :item="subitem"
        />
      </CollapsibleContent>
    </CollapsibleRoot>

    <DocSidebarItem
      v-else
      :item="item"
    />
  </div>
</template>
