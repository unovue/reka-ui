<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import AlertDialog from './_AlertDialog.vue'

const { Story } = defineMeta({
  title: 'Alert Dialog/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <AlertDialog />
  </Story>
</template>
