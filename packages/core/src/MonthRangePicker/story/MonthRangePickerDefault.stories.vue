<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

const { Story } = defineMeta({
  title: 'Month Range Picker/Default',
})
</script>

<script lang="ts" setup>
import MonthRangePicker from './_MonthRangePicker.vue'
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <MonthRangePicker />
  </Story>
</template>
