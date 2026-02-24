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
    :as-child="true"
  >
    <Stepper :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled"
    :as-child="true"
  >
    <Stepper v-model="modelValue" />
  </Story>

  <Story
    name="Empty default"
    :as-child="true"
  >
    <Stepper />
  </Story>

  <Story
    name="Default value"
    :as-child="true"
  >
    <Stepper :default-value="defaultValue" />
  </Story>

  <Story
    name="Linear"
    :as-child="true"
  >
    <Stepper linear />
  </Story>

  <Story
    name="Free"
    :as-child="true"
  >
    <Stepper :linear="false" />
  </Story>

  <Story
    name="Vertical"
    :as-child="true"
  >
    <Stepper orientation="vertical" />
  </Story>
</template>
