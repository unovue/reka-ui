<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import Autocomplete from './_Autocomplete.vue'

const { Story } = defineMeta({
  title: 'Autocomplete/Default',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <Autocomplete />
  </Story>
</template>
