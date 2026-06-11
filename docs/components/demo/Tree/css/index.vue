<script setup lang="ts">
import { TreeRoot } from 'reka-ui'

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
  <TreeRoot
    class="w-56 h-72 rounded-lg bg-white text-blackA11"
    :paths="paths"
    initial-expansion="open"
    search
  />
</template>
