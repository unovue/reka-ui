<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { TreeRoot } from '..'
import Tree from './_TreeNested.vue'
import { items } from './constants'

const { Story } = defineMeta({
  title: 'Tree/Nested',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <TreeRoot
      class="list-none select-none w-64 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
      :items="items"
      :get-key="(item) => item.title"
    >
      <Tree :tree-items="items" />
    </TreeRoot>
  </Story>
</template>
