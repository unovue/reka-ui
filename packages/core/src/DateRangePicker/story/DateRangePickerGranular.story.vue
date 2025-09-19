<script setup lang="ts">
import DateRangePicker from './_DummyDateRangePicker.vue'
</script>

<template>
  <Story
    title="Date Range Picker/Granular"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Granular (second)">
      <DateRangePicker granularity="second" />
    </Variant>

    <Variant title="Granular (minute)">
      <DateRangePicker granularity="minute" />
    </Variant>

    <Variant title="Granular (hour)">
      <DateRangePicker granularity="hour" />
    </Variant>

    <Variant title="Granular (day)">
      <DateRangePicker granularity="day" />
    </Variant>
  </Story>
</template>
