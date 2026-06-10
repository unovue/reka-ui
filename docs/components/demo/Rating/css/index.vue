<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const rating = ref(3)
</script>

<template>
  <RatingRoot
    v-slot="{ items }"
    v-model="rating"
    hoverable
    class="RatingRoot"
  >
    <RatingItem
      v-for="item in items"
      :key="item"
      v-slot="{ steps }"
      :item="item"
      class="RatingItem"
    >
      <RatingItemIndicator
        v-for="step in steps"
        :key="step"
        :step="step"
        :aria-label="`Rate ${step}`"
        class="RatingItemIndicator"
      >
        <Icon
          icon="radix-icons:star"
          class="RatingStar"
        />
      </RatingItemIndicator>
    </RatingItem>
  </RatingRoot>
</template>
