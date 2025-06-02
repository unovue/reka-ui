<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useActiveElement } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import RovingFocusItem from '@/RovingFocus/RovingFocusItem.vue'
import { getActiveElement, useArrowNavigation, useForwardExpose, useKbd } from '@/shared'
import { injectRatingItemContext } from './Item.vue'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingItemProps extends PrimitiveProps {

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
const itemContext = injectRatingItemContext()
const kbd = useKbd()
const { currentElement, forwardRef } = useForwardExpose()
const activeElement = useActiveElement()

const isActive = computed(() => {
  return (rootContext.hoveredRating.value > 0 && itemContext.rating.value <= rootContext.hoveredRating.value) || (rootContext.hoveredRating.value === 0 && itemContext.rating.value <= rootContext.modelValue.value)
})

const isVisible = computed(() => {
  return activeElement.value === currentElement.value || rootContext.step.value === 1 || itemContext.rating.value % 1 === 0 || itemContext.rating.value === rootContext.hoveredRating.value || itemContext.rating.value === rootContext.modelValue.value
})

const itemStyle = computed(() => {
  if (rootContext.step.value !== 1 && itemContext.rating.value % 1 !== 0) {
    return {
      position: 'absolute',
      width: `${((itemContext.rating.value % 1) * 100)}%`,
      overflow: 'hidden',
      opacity: isVisible.value ? 1 : 0,
      zIndex: Math.ceil((1 - (itemContext.rating.value % 1)) * 10),
    }
  }
  return undefined
})

function handleMouseEnter() {
  rootContext.changeHoveredRating(itemContext.rating.value)
}

function handleMouseDown() {
  rootContext.changeModelValue(itemContext.rating.value)
}

function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault()

  if (rootContext.disabled.value) {
    return
  }

  if ((event.key === kbd.ENTER || event.key === kbd.SPACE) && !event.ctrlKey && !event.shiftKey) {
    rootContext.changeModelValue(itemContext.rating.value)
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
      :aria-checked="itemContext.rating.value <= rootContext.modelValue.value"
      :aria-disabled="rootContext.disabled.value"
      :data-state="isActive ? 'active' : undefined"
      role="radio"
      :style="itemStyle"
      @mouseenter="handleMouseEnter"
      @mousedown.left="handleMouseDown"
      @keydown.enter.space.left.right.up.down="handleKeyDown"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
