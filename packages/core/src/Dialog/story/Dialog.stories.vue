<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import Dialog from './_Dialog.vue'

const { Story } = defineMeta({
  title: 'Dialog/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <Dialog />
  </Story>
</template>
