<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import ColorPicker from './_ColorPicker.vue'

const { Story } = defineMeta({
  title: 'ColorPicker/Full Demo',
})
</script>

<template>
  <Story
    name="Complete Color Picker"
    as-child
  >
    <ColorPicker default-value="#7f007f" />
  </Story>

  <Story
    name="Red Color"
    as-child
  >
    <ColorPicker default-value="#ff0000" />
  </Story>

  <Story
    name="Green Color"
    as-child
  >
    <ColorPicker default-value="#00ff00" />
  </Story>

  <Story
    name="Blue Color"
    as-child
  >
    <ColorPicker default-value="#0000ff" />
  </Story>

  <Story
    name="Semi-transparent"
    as-child
  >
    <ColorPicker default-value="rgba(127, 0, 127, 0.5)" />
  </Story>
</template>
