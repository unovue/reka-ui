<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import YearRangePicker from './_YearRangePicker.vue'

const { Story } = defineMeta({
  title: 'Year Range Picker/Default',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <YearRangePicker />
  </Story>
</template>
