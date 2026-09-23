<script setup lang="ts">
import { ref } from 'vue'
import Stepper from './_DummyStepper.vue'

const defaultValue = ref(2)
const modelValue = ref(defaultValue)
</script>

<template>
  <Story
    title="Stepper/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Uncontrolled">
      <Stepper :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled">
      <Stepper v-model="modelValue" />
    </Variant>

    <Variant title="Empty default">
      <Stepper />
    </Variant>

    <Variant title="Default value">
      <Stepper :default-value="defaultValue" />
    </Variant>

    <Variant title="Linear">
      <Stepper linear />
    </Variant>

    <Variant title="Free">
      <Stepper :linear="false" />
    </Variant>

    <Variant title="Vertical">
      <Stepper orientation="vertical" />
    </Variant>
  </Story>
</template>
