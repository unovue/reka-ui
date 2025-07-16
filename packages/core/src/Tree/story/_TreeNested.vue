<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { TreeItem } from '..'
// eslint-disable-next-line import/no-self-import
import Tree from './_TreeNested.vue'

interface TreeNode {
  title: string
  icon: string
  children?: TreeNode[]
}

withDefaults(defineProps<{
  treeItems: TreeNode[]
  level?: number
}>(), {
  level: 0,
})
</script>

<template>
  <li
    v-for=" tree in treeItems"
    :key="tree.title"
  >
    <TreeItem
      v-slot="{ isExpanded }"
      as-child
      :level="level"
      :value="tree"
      :style="{ 'margin-left': `${level}rem` }"
    >
      <button class="flex items-center outline-none focus:ring-grass9 focus:ring-2 data-[selected]:bg-grass4 rounded py-1 px-2 my-0.5 w-max">
        <Icon
          v-if="tree.children"
          icon="radix-icons:chevron-down"
          class="h-4 w-4 mr-2"
        />
        <span>
          {{ tree.title }}
        </span>
      </button>

      <ul v-if="isExpanded">
        <template v-if="tree.children">
          <Tree
            :tree-items="tree.children"
            :level="level + 1"
          />
        </template>
      </ul>
    </TreeItem>
  </li>
</template>
