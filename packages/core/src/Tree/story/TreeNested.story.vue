<script setup lang="ts">
import { TreeRoot } from '..'

const items = [
  {
    title: 'components',
    children: [
      {
        title: 'Home',
        children: [
          { title: 'Card.vue' },
          { title: 'Button.vue' },
        ],
      },
    ],
  },
  {
    title: 'composables',
    children: [
      { title: 'useAuth.ts' },
      { title: 'useUser.ts' },
    ],
  },
]
</script>

<template>
  <Story
    title="Tree/Items adapter"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
        :items="items"
        :get-key="item => item.title"
        initial-expansion="open"
      />
    </Variant>
  </Story>
</template>
