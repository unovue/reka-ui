<script setup lang="ts">
import { TreeRoot } from '..'
import Tree from './_TreeNested.vue'
import { items } from './constants'
</script>

<template>
  <Story
    title="Tree/Nested"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        class="list-none select-none w-64 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
        :items="items"
        :get-key="(item) => item.title"
      >
        <Tree :tree-items="items" />
      </TreeRoot>
    </Variant>
  </Story>
</template>
