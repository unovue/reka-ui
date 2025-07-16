<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { makeStackblitzParams } from '../codeeditor'
import Tooltip from './Tooltip.vue'

const props = defineProps<{
  name: string
  files: string[]
  sources: Record<string, string>
}>()

function handleClick() {
  makeStackblitzParams(props.name, props.sources)
}
</script>

<template>
  <div>
    <Tooltip :content="`Open ${name} in Stackblitz`">
      <button
        aria-label="Open on Stackblitz"
        @click="handleClick"
      >
        <Icon icon="simple-icons:stackblitz" />
      </button>
    </Tooltip>
  </div>
</template>
