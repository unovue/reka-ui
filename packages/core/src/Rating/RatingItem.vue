<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { watchEffect } from 'vue'
import RovingFocusItem from '@/RovingFocus/RovingFocusItem.vue'
import { getActiveElement, useArrowNavigation, useForwardExpose, useKbd } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingItemProps extends Omit<PrimitiveProps, 'asChild'> {
  rating: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RatingItemProps>(), { as: 'span' })

defineSlots<{
  default?: (props: {
  }) => any
}>()

const rootContext = injectRatingRootContext()
const kbd = useKbd()
const { currentElement, forwardRef } = useForwardExpose()

function handleMouseEnter() {
  rootContext.changeHoveredRating(props.rating)
}

function handleMouseDown() {
  rootContext.changeModelValue(props.rating)
}

function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault()

  if (rootContext.disabled.value) {
    return
  }

  if ((event.key === kbd.ENTER || event.key === kbd.SPACE) && !event.ctrlKey && !event.shiftKey) {
    rootContext.changeModelValue(props.rating)
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
  <RovingFocusItem
    as-child
    :disabled="rootContext.disabled.value"
    :focusable="!rootContext.disabled.value"
  >
    <Primitive
      :ref="forwardRef"
      as-child
      :as="as"
      :aria-checked="rating <= rootContext.modelValue.value"
      :aria-disabled="rootContext.disabled.value"
      :data-state="rootContext.hoveredRating.value > 0 && rating <= rootContext.hoveredRating.value || rootContext.hoveredRating.value === 0 && rating <= rootContext.modelValue.value ? 'active' : undefined"
      role="radio"
      @mouseenter="handleMouseEnter"
      @mousedown.left="handleMouseDown"
      @keydown.enter.space.left.right.up.down="handleKeyDown"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
