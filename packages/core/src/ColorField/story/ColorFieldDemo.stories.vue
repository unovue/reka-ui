<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ColorFieldInput, ColorFieldRoot } from '../'
import ColorField from './_ColorField.vue'

const { Story } = defineMeta({
  title: 'ColorField/Demo',
})
</script>

<template>
  <Story
    name="Hex (default)"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      placeholder="Enter color"
    />
  </Story>

  <Story
    name="Hex with Arrow Keys"
    as-child
  >
    <div class="flex flex-col gap-2">
      <p class="text-xs text-gray-500">
        Use Arrow Up/Down to step hex value. Page Up/Down for larger steps. Home/End for min/max.
      </p>
      <ColorField
        default-value="#808080"
        placeholder="Try arrow keys"
      />
    </div>
  </Story>

  <Story
    name="Hue"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="hue"
      color-space="hsl"
      placeholder="Hue (0-360)"
    />
  </Story>

  <Story
    name="Saturation"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="saturation"
      color-space="hsl"
      placeholder="Saturation"
    />
  </Story>

  <Story
    name="Lightness"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="lightness"
      color-space="hsl"
      placeholder="Lightness"
    />
  </Story>

  <Story
    name="Red (RGB)"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="red"
      color-space="rgb"
      placeholder="Red (0-255)"
    />
  </Story>

  <Story
    name="Green (RGB)"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="green"
      color-space="rgb"
      placeholder="Green (0-255)"
    />
  </Story>

  <Story
    name="Blue (RGB)"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="blue"
      color-space="rgb"
      placeholder="Blue (0-255)"
    />
  </Story>

  <Story
    name="Alpha"
    as-child
  >
    <ColorField
      default-value="rgba(127, 0, 127, 0.5)"
      channel="alpha"
      color-space="hsl"
      placeholder="Alpha %"
    />
  </Story>

  <Story
    name="Custom Step (Hue step=10)"
    as-child
  >
    <ColorField
      default-value="#ff0000"
      channel="hue"
      color-space="hsl"
      :step="10"
      placeholder="Hue (step=10)"
    />
  </Story>

  <Story
    name="HSB Brightness"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      channel="brightness"
      color-space="hsb"
      placeholder="Brightness"
    />
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <div class="flex flex-col gap-3">
      <ColorFieldRoot
        model-value="#3b82f6"
        class="inline-flex flex-col gap-1"
      >
        <label class="text-xs font-medium text-gray-700">Hex Input</label>
        <ColorFieldInput
          class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-36"
        />
      </ColorFieldRoot>
    </div>
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      disabled
    />
  </Story>

  <Story
    name="Read Only"
    as-child
  >
    <ColorField
      default-value="#7f007f"
      readonly
    />
  </Story>

  <Story
    name="Wheel Disabled"
    as-child
  >
    <div class="flex flex-col gap-2">
      <p class="text-xs text-gray-500">
        Mouse wheel scrolling is disabled on this field.
      </p>
      <ColorField
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
        disable-wheel-change
        placeholder="No wheel"
      />
    </div>
  </Story>
</template>
