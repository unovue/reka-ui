<script setup lang="ts">
import ColorSlider from './_ColorSlider.vue'
import ColorSliderCompound from './_ColorSliderCompound.vue'
</script>

<template>
  <Story
    title="ColorSlider/Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="HSL Sliders (Compound)">
      <ColorSliderCompound
        default-value="#7f007f"
        color-space="hsl"
        :channels="['hue', 'saturation', 'lightness', 'alpha']"
      />
    </Variant>

    <Variant title="RGB Sliders (Compound)">
      <ColorSliderCompound
        default-value="#7f007f"
        color-space="rgb"
        :channels="['red', 'green', 'blue', 'alpha']"
      />
    </Variant>

    <Variant title="HSB Sliders (Compound)">
      <ColorSliderCompound
        default-value="#7f007f"
        color-space="hsb"
        :channels="['hue', 'saturation', 'brightness', 'alpha']"
      />
    </Variant>

    <Variant title="Hue (HSL)">
      <ColorSlider
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
      />
    </Variant>

    <Variant title="Saturation (HSL)">
      <ColorSlider
        default-value="#7f007f"
        channel="saturation"
        color-space="hsl"
      />
    </Variant>

    <Variant title="Lightness (HSL)">
      <ColorSlider
        default-value="#7f007f"
        channel="lightness"
        color-space="hsl"
      />
    </Variant>

    <Variant title="Brightness (HSB)">
      <ColorSlider
        default-value="#7f007f"
        channel="brightness"
        color-space="hsb"
      />
    </Variant>

    <Variant title="Red (RGB)">
      <ColorSlider
        default-value="#7f007f"
        channel="red"
        color-space="rgb"
      />
    </Variant>

    <Variant title="Green (RGB)">
      <ColorSlider
        default-value="#007f00"
        channel="green"
        color-space="rgb"
      />
    </Variant>

    <Variant title="Blue (RGB)">
      <ColorSlider
        default-value="#00007f"
        channel="blue"
        color-space="rgb"
      />
    </Variant>

    <Variant title="Alpha">
      <ColorSlider
        default-value="rgba(127, 0, 127, 0.5)"
        channel="alpha"
        color-space="hsl"
      />
    </Variant>

    <Variant title="Custom Step (Hue step=10)">
      <ColorSlider
        default-value="#ff0000"
        channel="hue"
        color-space="hsl"
        :step="10"
      />
    </Variant>

    <Variant title="Inverted">
      <ColorSlider
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
        inverted
      />
    </Variant>

    <Variant title="Vertical">
      <ColorSlider
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
        orientation="vertical"
      />
    </Variant>

    <Variant title="Disabled">
      <ColorSlider
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
        disabled
      />
    </Variant>
  </Story>
</template>
