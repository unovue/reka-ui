<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import MonthRangePicker from './_MonthRangePicker.vue'

const { Story } = defineMeta({
  title: 'Month Range Picker/Default',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <MonthRangePicker />
  </Story>
</template>
