<script setup lang="ts">
import ColorPicker from './_ColorPicker.vue'
</script>

<template>
  <Story
    group="compounds"
    title="ColorPicker/Full Demo"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Complete Color Picker">
      <ColorPicker default-value="#7f007f" />
    </Variant>

    <Variant title="Red Color">
      <ColorPicker default-value="#ff0000" />
    </Variant>

    <Variant title="Green Color">
      <ColorPicker default-value="#00ff00" />
    </Variant>

    <Variant title="Blue Color">
      <ColorPicker default-value="#0000ff" />
    </Variant>

    <Variant title="Semi-transparent">
      <ColorPicker default-value="rgba(127, 0, 127, 0.5)" />
    </Variant>
  </Story>
</template>
