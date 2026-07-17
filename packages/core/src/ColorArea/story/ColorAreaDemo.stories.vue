<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import ColorArea from './_ColorArea.vue'

const { Story } = defineMeta({
  title: 'ColorArea/Demo',
})
</script>

<template>
  <Story
    name="Default (Hue / Saturation)"
    as-child
  >
    <ColorArea
      default-value="hsl(0, 100%, 50%)"
    />
  </Story>

  <Story
    name="Hue / Lightness (HSL)"
    as-child
  >
    <ColorArea
      default-value="hsl(180, 100%, 50%)"
      color-space="hsl"
      x-channel="hue"
      y-channel="lightness"
    />
  </Story>

  <Story
    name="Saturation / Lightness (HSL)"
    as-child
  >
    <ColorArea
      default-value="#bf40bf"
      color-space="hsl"
      x-channel="saturation"
      y-channel="lightness"
    />
  </Story>

  <Story
    name="Saturation / Brightness (HSB)"
    as-child
  >
    <ColorArea
      default-value="#7f007f"
      color-space="hsb"
      x-channel="saturation"
      y-channel="brightness"
    />
  </Story>

  <Story
    name="Red / Green (RGB)"
    as-child
  >
    <ColorArea
      default-value="#7f007f"
      color-space="rgb"
      x-channel="red"
      y-channel="green"
    />
  </Story>

  <Story
    name="Red / Blue (RGB)"
    as-child
  >
    <ColorArea
      default-value="#7f007f"
      color-space="rgb"
      x-channel="red"
      y-channel="blue"
    />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <ColorArea
      default-value="#7f007f"
      color-space="hsl"
      disabled
    />
  </Story>
</template>
