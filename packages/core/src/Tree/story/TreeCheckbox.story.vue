<script setup lang="ts">
import { ref } from 'vue'
import { TreeRoot } from '..'

const selectedPaths = ref<string[]>([])
const paths = [
  'components/Home/Card.vue',
  'components/Home/Button.vue',
  'composables/useAuth.ts',
  'composables/useUser.ts',
  'app.vue',
]
</script>

<template>
  <Story
    title="Tree/Selection"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        v-model="selectedPaths"
        class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
        :paths="paths"
        initial-expansion="open"
      />
    </Variant>
  </Story>
</template>
