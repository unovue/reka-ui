<script lang="ts">
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { createContext } from '@/shared'

interface RatingItemContext {
  rating: ComputedRef<number>
}

export interface RatingItemProps extends PrimitiveProps {
  rating: number
}

export const [injectRatingItemContext, provideRatingItemContext]
  = createContext<RatingItemContext>('RatingItem')
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<RatingItemProps>(), { as: 'span' })
provideRatingItemContext({ rating: computed(() => props.rating) })
</script>

<template>
  <slot />
</template>
