<script lang="ts">
import type { StringOrNumber } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import { watchEffect } from 'vue'
import { getActiveElement, useArrowNavigation, useForwardExpose, useKbd } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingItemProps extends Omit<PrimitiveProps, 'asChild'> {
  rating: number
}
export type RatingItemEmits = {

}
</script>

<script setup lang="ts" generic="T extends StringOrNumber = StringOrNumber">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RatingItemProps>(), { as: 'span' })
const emits = defineEmits<RatingItemEmits>()

defineSlots<{
  default?: (props: {
  }) => any
}>()

const rootContext = injectRatingRootContext()
const kbd = useKbd()
const { currentElement, forwardRef } = useForwardExpose()

function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault()

  if (rootContext.disabled.value) {
    return
  }

  if ((event.key === kbd.ENTER || event.key === kbd.SPACE) && !event.ctrlKey && !event.shiftKey) {
    rootContext.modelValue.value = props.rating
  }

  if ([kbd.ARROW_LEFT, kbd.ARROW_RIGHT, kbd.ARROW_UP, kbd.ARROW_DOWN].includes(event.key)) {
    useArrowNavigation(event, getActiveElement() as HTMLElement, undefined, {
      itemsArray: Array.from(rootContext.ratingItems.value),
      focus: true,
      loop: false,
      arrowKeyOptions: rootContext.orientation.value,
      dir: rootContext.dir.value,
    })
  }
}

watchEffect((onCleanup) => {
  rootContext.ratingItems.value.add(currentElement.value)

  onCleanup(() => {
    rootContext.ratingItems.value.delete(currentElement.value)
  })
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    as-child
    :as="as"
    :aria-checked="rating <= rootContext.modelValue.value"
    :data-state="rootContext.hoveredRating.value > 0 && rating <= rootContext.hoveredRating.value ? 'active' : rootContext.hoveredRating.value === -1 && rating <= rootContext.modelValue.value ? 'checked' : undefined"
    :aria-disabled="rootContext.disabled"
    role="radio"
    :tabindex="rootContext.disabled.value ? -1 : 0"
    @mouseenter="rootContext.hoveredRating.value = rating"
    @click="rootContext.modelValue.value = rating"
    @keydown.enter.space.left.right.up.down="handleKeyDown"
  >
    <slot />
  </Primitive>
</template>
