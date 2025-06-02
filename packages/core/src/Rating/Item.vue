<script lang="ts">
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { createContext } from '@/shared'

interface RatingItemContext {
  item: ComputedRef<number>
}

export interface RatingItemProps extends PrimitiveProps {
  item: number
}

export const [injectRatingItemContext, provideRatingItemContext]
  = createContext<RatingItemContext>('RatingItem')
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<RatingItemProps>(), { as: 'span' })
provideRatingItemContext({ item: computed(() => props.item) })
</script>

<template>
  <slot />
</template>
