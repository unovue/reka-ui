<script setup lang="ts">
import { ColorFieldInput, ColorFieldRoot } from '../'
import ColorField from './_ColorField.vue'
</script>

<template>
  <Story
    title="ColorField/Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Hex (default)">
      <ColorField
        default-value="#7f007f"
        placeholder="Enter color"
      />
    </Variant>

    <Variant title="Hex with Arrow Keys">
      <div class="flex flex-col gap-2">
        <p class="text-xs text-gray-500">
          Use Arrow Up/Down to step hex value. Page Up/Down for larger steps. Home/End for min/max.
        </p>
        <ColorField
          default-value="#808080"
          placeholder="Try arrow keys"
        />
      </div>
    </Variant>

    <Variant title="Hue">
      <ColorField
        default-value="#7f007f"
        channel="hue"
        color-space="hsl"
        placeholder="Hue (0-360)"
      />
    </Variant>

    <Variant title="Saturation">
      <ColorField
        default-value="#7f007f"
        channel="saturation"
        color-space="hsl"
        placeholder="Saturation"
      />
    </Variant>

    <Variant title="Lightness">
      <ColorField
        default-value="#7f007f"
        channel="lightness"
        color-space="hsl"
        placeholder="Lightness"
      />
    </Variant>

    <Variant title="Red (RGB)">
      <ColorField
        default-value="#7f007f"
        channel="red"
        color-space="rgb"
        placeholder="Red (0-255)"
      />
    </Variant>

    <Variant title="Green (RGB)">
      <ColorField
        default-value="#7f007f"
        channel="green"
        color-space="rgb"
        placeholder="Green (0-255)"
      />
    </Variant>

    <Variant title="Blue (RGB)">
      <ColorField
        default-value="#7f007f"
        channel="blue"
        color-space="rgb"
        placeholder="Blue (0-255)"
      />
    </Variant>

    <Variant title="Alpha">
      <ColorField
        default-value="rgba(127, 0, 127, 0.5)"
        channel="alpha"
        color-space="hsl"
        placeholder="Alpha %"
      />
    </Variant>

    <Variant title="Custom Step (Hue step=10)">
      <ColorField
        default-value="#ff0000"
        channel="hue"
        color-space="hsl"
        :step="10"
        placeholder="Hue (step=10)"
      />
    </Variant>

    <Variant title="HSB Brightness">
      <ColorField
        default-value="#7f007f"
        channel="brightness"
        color-space="hsb"
        placeholder="Brightness"
      />
    </Variant>

    <Variant title="Controlled">
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
    </Variant>

    <Variant title="Disabled">
      <ColorField
        default-value="#7f007f"
        disabled
      />
    </Variant>

    <Variant title="Read Only">
      <ColorField
        default-value="#7f007f"
        readonly
      />
    </Variant>

    <Variant title="Wheel Disabled">
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
    </Variant>
  </Story>
</template>
