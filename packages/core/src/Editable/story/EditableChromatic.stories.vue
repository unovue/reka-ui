<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import Editable from './_DummyEditable.vue'

const defaultValue = 'Default value'
const modelValue = ref(defaultValue)

const { Story } = defineMeta({
  title: 'Editable/Chromatic',
})
</script>

<template>
  <Story
    name="Uncontrolled (modelValue)"
    as-child
  >
    <Editable :default-value="defaultValue" />
  </Story>

  <Story
    name="Controlled (modelValue)"
    as-child
  >
    <Editable v-model="modelValue" />
  </Story>

  <Story
    name="Empty default"
    as-child
  >
    <Editable />
  </Story>

  <Story
    name="Default value"
    as-child
  >
    <Editable :default-value="defaultValue" />
  </Story>

  <Story
    name="Edit on focus"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      activation-mode="focus"
    />
  </Story>

  <Story
    name="Edit on double click"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      activation-mode="dblclick"
    />
  </Story>

  <Story
    name="Submit on blur"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      submit-mode="blur"
    />
  </Story>

  <Story
    name="Submit on enter"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      submit-mode="enter"
    />
  </Story>

  <Story
    name="Select on focus"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      activation-mode="focus"
      select-on-focus
    />
  </Story>

  <Story
    name="Disabled"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      disabled
    />
  </Story>

  <Story
    name="Start in edit mode"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      start-with-edit-mode
    />
  </Story>

  <Story
    name="Read only"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      readonly
    />
  </Story>

  <Story
    name="Auto resize"
    as-child
  >
    <Editable
      :default-value="defaultValue"
      auto-resize
    />
  </Story>
</template>
