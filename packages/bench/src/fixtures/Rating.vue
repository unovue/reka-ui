<script setup>
// Rating: N instances of a typical composition (closed/default state)
import { RatingItem, RatingItemIndicator, RatingRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <RatingRoot
      v-slot="{ items }"
      :default-value="2"
    >
      <RatingItem
        v-for="item in items"
        :key="item"
        v-slot="{ steps }"
        :item="item"
      >
        <RatingItemIndicator
          v-for="step in steps"
          :key="step"
          :step="step"
        >
          ★
        </RatingItemIndicator>
      </RatingItem>
    </RatingRoot>
  </div>
</template>
