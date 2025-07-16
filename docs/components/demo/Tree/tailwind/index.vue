<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TreeItem, TreeRoot } from 'reka-ui'

const items = [
  {
    title: 'composables',
    icon: 'lucide:folder',
    children: [
      { title: 'useAuth.ts', icon: 'vscode-icons:file-type-typescript' },
      { title: 'useUser.ts', icon: 'vscode-icons:file-type-typescript' },
    ],
  },
  {
    title: 'components',
    icon: 'lucide:folder',
    children: [
      {
        title: 'Home',
        icon: 'lucide:folder',
        children: [
          { title: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
          { title: 'Button.vue', icon: 'vscode-icons:file-type-vue' },
        ],
      },
    ],
  },
  { title: 'app.vue', icon: 'vscode-icons:file-type-vue' },
  { title: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' },
]
</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    class="list-none select-none w-56 bg-white text-stone-700 rounded-lg border shadow-sm p-2 text-sm font-medium"
    :items="items"
    :get-key="(item) => item.title"
    :default-expanded="['components']"
  >
    <h2 class="font-semibold text-sm text-stone-400 px-2 pt-1 pb-3">
      Directory Structure
    </h2>
    <TreeItem
      v-for="item in flattenItems"
      v-slot="{ isExpanded }"
      :key="item._id"
      :style="{ 'padding-left': `${item.level - 0.5}rem` }"
      v-bind="item.bind"
      class="flex items-center py-1 px-2 my-0.5 rounded outline-none focus:ring-grass8 focus:ring-2 data-[selected]:bg-grass4"
    >
      <template v-if="item.hasChildren">
        <Icon
          v-if="!isExpanded"
          icon="lucide:folder"
          class="h-4 w-4"
        />
        <Icon
          v-else
          icon="lucide:folder-open"
          class="h-4 w-4"
        />
      </template>
      <Icon
        v-else
        :icon="item.value.icon || 'lucide:file'"
        class="h-4 w-4"
      />
      <div class="pl-2">
        {{ item.value.title }}
      </div>
    </TreeItem>
  </TreeRoot>
</template>
