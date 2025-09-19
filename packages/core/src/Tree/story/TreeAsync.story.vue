<script setup lang="ts">
import type { TreeItemToggleEvent } from '..'
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TreeItem, TreeRoot } from '..'

interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

const initialData = [
  { id: '1', name: 'Node 1', children: [] },
  { id: '2', name: 'Node 2', children: [
    { id: '5', name: 'Child Node 5' },
  ] },
  { id: '3', name: 'Node 3', children: [] },
  { id: '4', name: 'Plain Node' },
]

const treeData = ref(initialData)
const loadingIds = ref<Set<string>>(new Set())

function addChildrenToNode(tree: TreeNode[], targetId: string, newChildren: TreeNode[]): boolean {
  for (const node of tree) {
    if (node.id === targetId) {
      node.children = node.children ? [...node.children, ...newChildren] : newChildren
      return true
    }
    if (node.children && node.children.length > 0) {
      const found = addChildrenToNode(node.children, targetId, newChildren)
      if (found)
        return true
    }
  }
  return false
}

function fetchData(value: TreeNode) {
  return new Promise<void>((resolve) => {
    if ((value.children?.length ?? 0) > 0) {
      return resolve()
    }

    setTimeout(() => {
      addChildrenToNode(treeData.value, value.id, [
        { id: `${value.id}-0`, name: `Child Node ${`${value.id}-0`}`, children: [] },
        { id: `${value.id}-1`, name: 'Plain Node' },
      ])
      return resolve()
    }, 1000)
  })
}

async function fetchChildren(ev: TreeItemToggleEvent<TreeNode>) {
  const value = ev.detail.value
  if (!value?.children)
    return

  loadingIds.value.add(value.id)
  await fetchData(value)
  loadingIds.value.delete(value.id)
}
</script>

<template>
  <Story
    title="Tree/Async"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        v-slot="{ flattenItems }"
        class="list-none select-none w-64 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
        :items="treeData"
        :get-key="(item) => `${item.id}`"
      >
        <TreeItem
          v-for="item in flattenItems"
          :key="item._id"
          v-slot="{ isExpanded }"
          :style="{ 'margin-left': `${item.level - 1}rem` }"
          class="flex items-center py-1 px-2 my-0.5 rounded w-max outline-none focus:ring-grass9 focus:ring-2 data-[selected]:bg-grass4 transition rotate-0"
          v-bind="item.bind"
          @toggle="fetchChildren"
        >
          <Icon
            v-if="loadingIds.has(item.value.id)"
            icon="radix-icons:reload"
            class="h-4 w-4 mr-2 animate-spin"
          />
          <Icon
            v-else-if="item.hasChildren"
            icon="radix-icons:chevron-down"
            class="h-4 w-4 mr-2"
            :class="{ '-rotate-90': isExpanded }"
          />
          <div> {{ item.value.name }} </div>
        </TreeItem>
      </TreeRoot>
    </Variant>
  </Story>
</template>
