<script setup lang="ts">
import ColorArea from './_ColorArea.vue'
</script>

<template>
  <Story
    title="ColorArea/Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Default (Hue / Saturation)">
      <ColorArea
        default-value="hsl(0, 100%, 50%)"
      />
    </Variant>

    <Variant title="Hue / Lightness (HSL)">
      <ColorArea
        default-value="hsl(180, 100%, 50%)"
        color-space="hsl"
        x-channel="hue"
        y-channel="lightness"
      />
    </Variant>

    <Variant title="Saturation / Lightness (HSL)">
      <ColorArea
        default-value="#bf40bf"
        color-space="hsl"
        x-channel="saturation"
        y-channel="lightness"
      />
    </Variant>

    <Variant title="Saturation / Brightness (HSB)">
      <ColorArea
        default-value="#7f007f"
        color-space="hsb"
        x-channel="saturation"
        y-channel="brightness"
      />
    </Variant>

    <Variant title="Red / Green (RGB)">
      <ColorArea
        default-value="#7f007f"
        color-space="rgb"
        x-channel="red"
        y-channel="green"
      />
    </Variant>

    <Variant title="Red / Blue (RGB)">
      <ColorArea
        default-value="#7f007f"
        color-space="rgb"
        x-channel="red"
        y-channel="blue"
      />
    </Variant>

    <Variant title="Disabled">
      <ColorArea
        default-value="#7f007f"
        color-space="hsl"
        disabled
      />
    </Variant>
  </Story>
</template>
