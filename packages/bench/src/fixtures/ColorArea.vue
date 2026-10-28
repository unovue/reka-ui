<script setup>
// ColorArea: N instances of a typical composition (closed/default state)
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ColorAreaRoot
      v-slot="{ style }"
      default-value="#3366cc"
    >
      <ColorAreaArea
        :style="style"
        class="carea"
      >
        <ColorAreaThumb />
      </ColorAreaArea>
    </ColorAreaRoot>
  </div>
</template>
