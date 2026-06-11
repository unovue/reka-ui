<script setup lang="ts">
import { ref } from 'vue'
import { TreeRoot } from '..'

const paths = ref([
  'src/App.vue',
  'src/components/Button.vue',
])

function loadMorePaths() {
  paths.value = [
    ...paths.value,
    'src/composables/useAuth.ts',
    'src/composables/useUser.ts',
  ]
}
</script>

<template>
  <Story
    title="Tree/Dynamic paths"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="flex flex-col gap-3">
        <button
          class="w-max rounded bg-grass9 px-3 py-1 text-sm text-white"
          @click="loadMorePaths"
        >
          Load paths
        </button>
        <TreeRoot
          class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
          :paths="paths"
          initial-expansion="open"
        />
      </div>
    </Variant>
  </Story>
</template>
