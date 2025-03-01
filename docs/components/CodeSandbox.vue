<script setup lang="ts">
import { makeCodeSandboxParams } from '../codeeditor'
import Tooltip from './Tooltip.vue'
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
  files: string[]
  sources: Record<string, string>
}>()
</script>

<template>
  <form
    action="https://codesandbox.io/api/v1/sandboxes/define"
    method="POST"
    target="_blank"
  >
    <input
      type="hidden"
      name="query"
      value="file=src/App.vue"
    >
    <input
      type="hidden"
      name="environment"
      value="server"
    >
    <input
      type="hidden"
      name="hidedevtools"
      value="1"
    >
    <input
      :key="name"
      type="hidden"
      name="parameters"
      :value="makeCodeSandboxParams(name, sources)"
    >

    <Tooltip :content="$t('open-name-in-codesandbox', [name])">
      <button
        type="submit"
        :aria-label="$t('open-on-codesandbox')"
      >
        <Icon icon="ph-codesandbox-logo" />
      </button>
    </Tooltip>
  </form>
</template>
