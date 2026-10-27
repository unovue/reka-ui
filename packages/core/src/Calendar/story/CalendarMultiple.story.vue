<script setup lang="ts">
import Calendar from './_DummyCalendar.vue'

const defaultValue = new Temporal.PlainDate(2024, 2, 20)
</script>

<template>
  <Story
    title="Calendar/Multiple"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="2 months">
      <Calendar
        :default-value="defaultValue"
        :number-of-months="2"
      />
    </Variant>

    <Variant title="2 months (Paged navigation)">
      <Calendar
        :default-value="defaultValue"
        :number-of-months="2"
        paged-navigation
      />
    </Variant>

    <Variant title="3 months">
      <Calendar
        :default-value="defaultValue"
        :number-of-months="3"
      />
    </Variant>

    <Variant title="3 months (Paged navigation)">
      <Calendar
        :default-value="defaultValue"
        :number-of-months="3"
        paged-navigation
      />
    </Variant>

    <Variant title="3 months (Fixed week)">
      <Calendar
        :default-value="defaultValue"
        :number-of-months="3"
        fixed-weeks
      />
    </Variant>
  </Story>
</template>
