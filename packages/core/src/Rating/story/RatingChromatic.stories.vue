<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import Rating from './_Rating.vue'

const { Story } = defineMeta({
  title: 'Rating/Chromatic',
})
</script>

<template>
  <Story
    name="Steps"
    :as-child="true"
  >
    <Rating :step="0.25" />
  </Story>
  <Story
    name="Uncontrolled"
    :as-child="true"
  >
    <Rating
      :default-value="3"
    />
  </Story>
  <Story
    name="Clerable"
    :as-child="true"
  >
    <Rating
      :default-value="3"
      clearable
    />
  </Story>
  <Story
    name="Hoverable"
    :as-child="true"
  >
    <Rating
      hoverable
    />
  </Story>
  <Story
    name="Length of 3"
    :as-child="true"
  >
    <Rating
      :length="3
      "
    />
  </Story>
  <Story
    name="Disabled"
    :as-child="true"
  >
    <Rating
      disabled
    />
  </Story>
  <Story
    name="Combination"
    :as-child="true"
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
    :as-child="true"
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
