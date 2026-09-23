<script setup lang="ts">
import { ref } from 'vue'
import Editable from './_DummyEditable.vue'

const defaultValue = 'Default value'
const modelValue = ref(defaultValue)
</script>

<template>
  <Story
    title="Editable/Chromatic"
    :layout="{ type: 'grid', width: '50%', iframe: false }"
  >
    <Variant title="Uncontrolled (modelValue)">
      <Editable :default-value="defaultValue" />
    </Variant>

    <Variant title="Controlled (modelValue)">
      <Editable v-model="modelValue" />
    </Variant>

    <Variant title="Empty default">
      <Editable />
    </Variant>

    <Variant title="Default value">
      <Editable :default-value="defaultValue" />
    </Variant>

    <Variant title="Edit on focus">
      <Editable
        :default-value="defaultValue"
        activation-mode="focus"
      />
    </Variant>

    <Variant title="Edit on double click">
      <Editable
        :default-value="defaultValue"
        activation-mode="dblclick"
      />
    </Variant>

    <Variant title="Submit on blur">
      <Editable
        :default-value="defaultValue"
        submit-mode="blur"
      />
    </Variant>

    <Variant title="Submit on enter">
      <Editable
        :default-value="defaultValue"
        submit-mode="enter"
      />
    </Variant>

    <Variant title="Select on focus">
      <Editable
        :default-value="defaultValue"
        activation-mode="focus"
        select-on-focus
      />
    </Variant>

    <Variant title="Disabled">
      <Editable
        :default-value="defaultValue"
        disabled
      />
    </Variant>

    <Variant title="Start in edit mode">
      <Editable
        :default-value="defaultValue"
        start-with-edit-mode
      />
    </Variant>

    <Variant title="Read only">
      <Editable
        :default-value="defaultValue"
        readonly
      />
    </Variant>

    <Variant title="Auto resize">
      <Editable
        :default-value="defaultValue"
        auto-resize
      />
    </Variant>
  </Story>
</template>
