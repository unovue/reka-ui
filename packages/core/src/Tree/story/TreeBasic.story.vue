<script setup lang="ts">
import { TreeRoot } from '..'

const paths = [
  'composables/useAuth.ts',
  'composables/useUser.ts',
  'components/Home/Card.vue',
  'components/Home/Button.vue',
  'app.vue',
  'nuxt.config.ts',
]
</script>

<template>
  <Story
    title="Tree/Basic"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
        :paths="paths"
        initial-expansion="open"
        search
      />
    </Variant>
  </Story>
</template>
