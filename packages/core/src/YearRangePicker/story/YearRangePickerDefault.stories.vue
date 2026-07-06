<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

const { Story } = defineMeta({
  title: 'Year Range Picker/Default',
})
</script>

<script lang="ts" setup>
import YearRangePicker from './_YearRangePicker.vue'
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <YearRangePicker />
  </Story>
</template>
