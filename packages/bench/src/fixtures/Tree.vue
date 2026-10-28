<script setup>
// Tree: N instances of a typical composition (closed/default state)
import { TreeItem, TreeRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const items = [{ title: 'src', children: [{ title: 'a.ts' }, { title: 'b.ts' }] }, { title: 'docs', children: [{ title: 'c.md' }] }, { title: 'README.md' }]
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <TreeRoot
      v-slot="{ flattenItems }"
      :items="items"
      :get-key="(item) => item.title"
    >
      <TreeItem
        v-for="item in flattenItems"
        :key="item._id"
        v-bind="item.bind"
      >
        {{ item.value.title }}
      </TreeItem>
    </TreeRoot>
  </div>
</template>
