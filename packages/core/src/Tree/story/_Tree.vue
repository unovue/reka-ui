<script setup lang="ts">
import type { TreeRootEmits, TreeRootProps } from '..'
import { Icon } from '@iconify/vue'
import { useForwardPropsEmits } from '@/shared'
import { TreeItem, TreeRoot } from '..'

const props = defineProps<Omit<TreeRootProps, 'items' | 'getKey'>>()
const emits = defineEmits<TreeRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const items = [
  { title: 'index.vue', icon: 'vue' },
  {
    title: 'lib',
    icon: 'folder',
    children: [
      {
        title: 'tree',
        icon: 'folder',
        children: [
          {
            title: 'Tree.vue',
            icon: 'vue',
          },
          {
            title: 'TreeView.vue',
            icon: 'vue',
          },
        ],
      },
      {
        title: 'icons',
        icon: 'folder',
        children: [
          { title: 'JS.vue', icon: 'vue' },
          { title: 'vue.vue', icon: 'vue' },
        ],
      },
      {
        title: 'index.js',
        icon: 'js',
      },
    ],
  },
  {
    title: 'routes',
    icon: 'folder',
    children: [
      {
        title: 'contents',
        icon: 'folder',
        children: [
          {
            title: '+layout.vue',
            icon: 'vue',
          },
          {
            title: '+page.vue',
            icon: 'vue',
          },
        ],
      },
    ],
  },
]
</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    v-bind="forwarded"
    class="list-none select-none w-64 bg-white text-blackA11 rounded-md p-2 text-sm font-medium"
    :items="items"
    :get-key="(item) => item.title"
  >
    <TreeItem
      v-for="item in flattenItems"
      :key="item._id"
      class="flex items-center py-1 px-2 my-0.5 rounded w-max outline-none focus:ring-grass9 focus:ring-2 data-[selected]:bg-grass4"
      :style="{ 'margin-left': `${item.level}rem` }"
      v-bind="item.bind"
    >
      <Icon
        v-if="item.hasChildren"
        icon="radix-icons:chevron-down"
        class="h-4 w-4"
      />
      <div class="pl-2">
        {{ item.value.title }}
      </div>
    </TreeItem>
  </TreeRoot>
</template>
