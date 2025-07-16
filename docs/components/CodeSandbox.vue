<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { makeCodeSandboxParams } from '../codeeditor'
import Tooltip from './Tooltip.vue'

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

    <Tooltip :content="`Open ${name} in CodeSandbox`">
      <button
        type="submit"
        aria-label="Open on CodeSandbox"
      >
        <Icon icon="ph-codesandbox-logo" />
      </button>
    </Tooltip>
  </form>
</template>
