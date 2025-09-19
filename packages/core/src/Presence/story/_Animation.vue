<script setup lang="ts">
import { ref } from 'vue'
import Presence from '../Presence'
import Toggle from './_Toggle.vue'

defineOptions({
  inheritAttrs: false,
})
const open = ref(false)
const node = ref<HTMLElement>()
</script>

<template>
  <div class="h-64">
    <Toggle
      v-model:open="open"
      :node="node"
    />
    <Presence :present="open">
      <div
        v-bind="$attrs"
        ref="node"
        :data-state="open ? 'open' : 'closed'"
      >
        Content
      </div>
    </Presence>
  </div>
</template>
