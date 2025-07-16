<script setup lang="ts">
import type { ConfigProviderProps } from './ConfigProvider.vue'
import DropdownMenu from '../DropdownMenu/story/_DropdownMenu.vue'
import ConfigProvider from './ConfigProvider.vue'

const props = withDefaults(defineProps<ConfigProviderProps>(), { scrollBody: undefined })
</script>

<template>
  <ConfigProvider v-bind="props">
    <DropdownMenu :default-open="true" />
  </ConfigProvider>
</template>
