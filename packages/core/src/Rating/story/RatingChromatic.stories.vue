<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import Rating from './_Rating.vue'

const { Story } = defineMeta({
  title: 'Rating/Chromatic',
})
</script>

<template>
  <Story
    name="Steps"
    as-child
  >
    <Rating :step="0.25" />
  </Story>
  <Story
    name="Uncontrolled"
    as-child
  >
    <Rating
      :default-value="3"
    />
  </Story>
  <Story
    name="Clerable"
    as-child
  >
    <Rating
      :default-value="3"
      clearable
    />
  </Story>
  <Story
    name="Hoverable"
    as-child
  >
    <Rating
      hoverable
    />
  </Story>
  <Story
    name="Length of 3"
    as-child
  >
    <Rating
      :length="3
      "
    />
  </Story>
  <Story
    name="Disabled"
    as-child
  >
    <Rating
      disabled
    />
  </Story>
  <Story
    name="Combination"
    as-child
  >
    <Rating
      clearable
      hoverable
      :step="0.5"
      :length="10"
    />
  </Story>
  <Story
    name="Disabled combination"
    as-child
  >
    <Rating
      disabled
      clearable
      hoverable
      :step="0.5"
      :length="10"
    />
  </Story>
</template>
