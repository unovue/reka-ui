<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import ColorSlider from './_ColorSlider.vue'
import ColorSliderCompound from './_ColorSliderCompound.vue'

const { Story } = defineMeta({
  title: 'ColorSlider/Demo',
})
</script>

<template>
  <Story
    name="HSL Sliders (Compound)"
    as-child
  >
    <ColorSliderCompound
      default-value="#7f007f"
      color-space="hsl"
      :channels="['hue', 'saturation', 'lightness', 'alpha']"
    />
  </Story>

  <Story
    name="RGB Sliders (Compound)"
    as-child
  >
    <ColorSliderCompound
      default-value="#7f007f"
      color-space="rgb"
      :channels="['red', 'green', 'blue', 'alpha']"
    />
  </Story>

  <Story
    name="HSB Sliders (Compound)"
    as-child
  >
    <ColorSliderCompound
      default-value="#7f007f"
      color-space="hsb"
      :channels="['hue', 'saturation', 'brightness', 'alpha']"
    />
  </Story>

  <Story
    name="Hue (HSL)"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="hue"
      color-space="hsl"
    />
  </Story>

  <Story
    name="Saturation (HSL)"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="saturation"
      color-space="hsl"
    />
  </Story>

  <Story
    name="Lightness (HSL)"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="lightness"
      color-space="hsl"
    />
  </Story>

  <Story
    name="Brightness (HSB)"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="brightness"
      color-space="hsb"
    />
  </Story>

  <Story
    name="Red (RGB)"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="red"
      color-space="rgb"
    />
  </Story>

  <Story
    name="Green (RGB)"
    as-child
  >
    <ColorSlider
      default-value="#007f00"
      channel="green"
      color-space="rgb"
    />
  </Story>

  <Story
    name="Blue (RGB)"
    as-child
  >
    <ColorSlider
      default-value="#00007f"
      channel="blue"
      color-space="rgb"
    />
  </Story>

  <Story
    name="Alpha"
    as-child
  >
    <ColorSlider
      default-value="rgba(127, 0, 127, 0.5)"
      channel="alpha"
      color-space="hsl"
    />
  </Story>

  <Story
    name="Custom Step (Hue step=10)"
    as-child
  >
    <ColorSlider
      default-value="#ff0000"
      channel="hue"
      color-space="hsl"
      :step="10"
    />
  </Story>

  <Story
    name="Inverted"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="hue"
      color-space="hsl"
      inverted
    />
  </Story>

  <Story
    name="Vertical"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="hue"
      color-space="hsl"
      orientation="vertical"
    />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <ColorSlider
      default-value="#7f007f"
      channel="hue"
      color-space="hsl"
      disabled
    />
  </Story>
</template>
