<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import Item from './Item.vue'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingItemProps extends PrimitiveProps {
  rating: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RatingItemProps>(), { as: 'span' })
const rootContext = injectRatingRootContext()

const items = computed(() => {
  const groupStartValue = (props.rating - 1)
  const groupEndValue = props.rating
  const stepSize = rootContext.step.value

  const numberOfSteps = Math.ceil((groupEndValue - groupStartValue) / stepSize)

  return Array.from({ length: numberOfSteps }, (_, index) =>
    Number((groupStartValue + (index + 1) * stepSize).toFixed(2)))
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :style="rootContext.step.value !== 1 ? { position: 'relative' } : undefined"
  >
    <Item
      v-for="item of items"
      :key="item"
      :item="item"
      as-child
    >
      <slot />
    </Item>
  </Primitive>
</template>
