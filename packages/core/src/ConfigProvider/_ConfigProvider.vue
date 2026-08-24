<script setup lang="ts">
import type { ConfigProviderProps } from './ConfigProvider.vue'
import { UNDEFINED_DEFAULT } from '@/shared/propDefaults'
import DropdownMenu from '../DropdownMenu/story/_DropdownMenu.vue'
import ConfigProvider from './ConfigProvider.vue'

const props = withDefaults(defineProps<ConfigProviderProps>(), { scrollBody: UNDEFINED_DEFAULT })
</script>

<template>
  <ConfigProvider v-bind="props">
    <DropdownMenu :default-open="true" />
  </ConfigProvider>
</template>
