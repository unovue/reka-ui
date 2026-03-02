<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorAreaAreaProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { injectColorAreaRootContext } from './ColorAreaRoot.vue'
import { linearScale } from './utils'

const props = withDefaults(defineProps<ColorAreaAreaProps>(), {
  as: 'div',
})

const rootContext = injectColorAreaRootContext()
const { primitiveElement, currentElement: areaElement } = usePrimitiveElement()

const isDragging = ref(false)

// Convert pointer position to channel values
function getValuesFromPointer(event: PointerEvent) {
  const rect = areaElement.value!.getBoundingClientRect()

  const xInput: [number, number] = [0, rect.width]
  const xOutput: [number, number] = [rootContext.xRange.value.min, rootContext.xRange.value.max]
  const xScale = linearScale(xInput, xOutput)
  const xValue = xScale(event.clientX - rect.left)

  // Y is inverted (top is max, bottom is min for most channels)
  const yInput: [number, number] = [0, rect.height]
  const yOutput: [number, number] = [rootContext.yRange.value.max, rootContext.yRange.value.min]
  const yScale = linearScale(yInput, yOutput)
  const yValue = yScale(event.clientY - rect.top)

  return { x: xValue, y: yValue }
}

function handlePointerDown(event: PointerEvent) {
  if (rootContext.disabled.value)
    return

  const target = event.target as HTMLElement
  target.setPointerCapture(event.pointerId)
  event.preventDefault()

  isDragging.value = true
  const { x, y } = getValuesFromPointer(event)
  rootContext.updateValues(x, y)
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value || rootContext.disabled.value)
    return

  const target = event.target as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    const { x, y } = getValuesFromPointer(event)
    rootContext.updateValues(x, y)
  }
}

function handlePointerUp(event: PointerEvent) {
  if (!isDragging.value)
    return

  const target = event.target as HTMLElement
  target.releasePointerCapture(event.pointerId)
  isDragging.value = false
  rootContext.commitValues()
}

// Keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
  if (rootContext.disabled.value)
    return

  const { step } = rootContext.xRange.value
  const stepMultiplier = event.shiftKey ? 10 : 1
  const stepSize = step * stepMultiplier

  let xDelta = 0
  let yDelta = 0

  switch (event.key) {
    case 'ArrowLeft':
      xDelta = -stepSize
      break
    case 'ArrowRight':
      xDelta = stepSize
      break
    case 'ArrowUp':
      yDelta = stepSize
      break
    case 'ArrowDown':
      yDelta = -stepSize
      break
    case 'PageUp':
      yDelta = stepSize * 10
      break
    case 'PageDown':
      yDelta = -stepSize * 10
      break
    case 'Home':
      // Jump left by larger increment (10 steps)
      xDelta = -stepSize * 10
      break
    case 'End':
      // Jump right by larger increment (10 steps)
      xDelta = stepSize * 10
      break
    default:
      return
  }

  event.preventDefault()
  rootContext.updateValues(
    rootContext.xValue.value + xDelta,
    rootContext.yValue.value + yDelta,
  )
}
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as-child="asChild"
    :as="as"
    role="application"
    aria-roledescription="Color picker"
    :aria-disabled="rootContext.disabled.value ? '' : undefined"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    @keydown="handleKeyDown"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
  >
    <slot />
  </Primitive>
</template>
