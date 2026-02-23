<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref } from 'vue'
import Stepper from './_DummyStepper.vue'

const defaultValue = ref(2)
const modelValue = ref(defaultValue)

const { Story } = defineMeta({
  title: 'Stepper/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled"
    as-child
  >
    <Stepper :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    as-child
  >
    <Stepper v-model="modelValue" />
  </Story>

  <Story
    name="Empty default"
    as-child
  >
    <Stepper />
  </Story>

  <Story
    name="Default value"
    as-child
  >
    <Stepper :default-value="defaultValue" />
  </Story>

  <Story
    name="Linear"
    as-child
  >
    <Stepper linear />
  </Story>

  <Story
    name="Free"
    as-child
  >
    <Stepper :linear="false" />
  </Story>

  <Story
    name="Vertical"
    as-child
  >
    <Stepper orientation="vertical" />
  </Story>
</template>
