<script setup lang="ts">
import { computed } from 'vue'
import { countryList } from '@/shared/constant'
import { TreeRoot } from '..'

const paths = computed(() => countryList.map(country => `${country[0].toUpperCase()}/${country}`))
</script>

<template>
  <Story
    title="Tree/Virtual"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <TreeRoot
        class="w-64 h-80 bg-white text-blackA11 rounded-lg text-sm font-medium"
        :paths="paths"
        initial-expansion="open"
      />
    </Variant>
  </Story>
</template>
