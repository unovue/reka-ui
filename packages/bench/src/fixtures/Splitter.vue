<script setup>
// Splitter: N instances of a typical composition (closed/default state)
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <SplitterGroup
      direction="horizontal"
      class="split"
    >
      <SplitterPanel :default-size="50">
        A
      </SplitterPanel><SplitterResizeHandle /><SplitterPanel :default-size="50">
        B
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>
