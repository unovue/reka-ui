<script setup vapor lang="ts">
import { TreeItem, TreeRoot, TreeVirtualizer } from '#reka'
import { ref } from 'vue'

interface Node { title: string, children?: Node[] }
const items: Node[] = [
  { title: 'index.vue' },
  { title: 'lib', children: [{ title: 'tree.vue' }, { title: 'icons', children: [{ title: 'vue.svg' }] }] },
  { title: 'README.md' },
]
const selected = ref<Node>()
const expanded = ref<string[]>([])
const many: Node[] = Array.from({ length: 500 }, (_, i) => ({ title: `file-${i}` }))
const virtualSelected = ref<Node>()
</script>

<template>
  <TreeRoot
    id="tree"
    v-slot="{ flattenItems }"
    v-model="selected"
    v-model:expanded="expanded"
    :items="items"
    :get-key="(item: Node) => item.title"
    aria-label="Files"
  >
    <template
      v-for="item in flattenItems"
      :key="item._id"
    >
      <!-- asChild, template form for one row -->
      <TreeItem
        v-if="item.value.title === 'README.md'"
        v-bind="item.bind"
        as-child
      >
        <li
          id="node-README"
          data-state="mine"
        >
          README.md
        </li>
      </TreeItem>
      <TreeItem
        v-else
        :id="`node-${item.value.title}`"
        v-bind="item.bind"
        :style="{ paddingLeft: `${item.level}rem` }"
      >
        {{ item.value.title }}
      </TreeItem>
    </template>
  </TreeRoot>
  <span id="selected">{{ selected?.title }}</span>
  <span id="expanded">{{ expanded.join() }}</span>

  <TreeRoot
    id="vtree"
    v-model="virtualSelected"
    :items="many"
    :get-key="(item: Node) => item.title"
    aria-label="Many files"
    style="height: 150px; overflow: auto"
  >
    <!-- asChild, v-slot form (no comment inside the virtualizer slot: v2 takes its first node) -->
    <TreeVirtualizer
      v-slot="{ item }"
      :text-content="(node: any) => node.title"
      :estimate-size="25"
    >
      <TreeItem
        v-slot="{ props }"
        v-bind="item.bind"
        as-child
      >
        <li
          v-bind="props"
          :id="`v-${item.value.title}`"
          style="height: 25px"
        >
          {{ item.value.title }}
        </li>
      </TreeItem>
    </TreeVirtualizer>
  </TreeRoot>
  <span id="virtual-selected">{{ virtualSelected?.title }}</span>
</template>
