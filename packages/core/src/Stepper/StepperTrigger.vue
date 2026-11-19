<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, useAttrs, watchPostEffect } from 'vue'
import { getActiveElement, useArrowNavigation, useForwardExpose, useKbd } from '@/shared'

export interface StepperTriggerProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectStepperItemContext } from './StepperItem.vue'
import { injectStepperRootContext } from './StepperRoot.vue'

withDefaults(defineProps<StepperTriggerProps>(), {
  as: 'button',
})

const rootContext = injectStepperRootContext()
const itemContext = injectStepperItemContext()

const attrs = useAttrs()

// Name the trigger by its title and description so the accessible name matches the visible
// content. Only reference parts that are rendered, and let a consumer `aria-label` win
// (`aria-labelledby` would otherwise take precedence over it). Plain functions rather than
// computeds: `attrs` is not reactive, but the template re-renders when it changes.
function getAriaLabelledby() {
  if (attrs['aria-label'])
    return undefined
  const ids = [
    itemContext.hasTitle.value ? itemContext.titleId : undefined,
    itemContext.hasDescription.value ? itemContext.descriptionId : undefined,
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

// The description is already part of the name when it is referenced by `aria-labelledby`.
function getAriaDescribedby() {
  if (!itemContext.hasDescription.value || getAriaLabelledby())
    return undefined
  return itemContext.descriptionId
}

const kbd = useKbd()
const stepperItems = computed(() => Array.from(rootContext.totalStepperItems.value))

function handleMouseDown(event: MouseEvent) {
  if (itemContext.disabled.value)
    return
  if (rootContext.linear.value) {
    if (itemContext.step.value <= rootContext.modelValue.value! || itemContext.step.value === rootContext.modelValue.value! + 1) {
      if (event.ctrlKey === false) {
        rootContext.changeModelValue(itemContext.step.value)
        return
      }
    }
  }
  else {
    if (event.ctrlKey === false) {
      rootContext.changeModelValue(itemContext.step.value)
      return
    }
  }

  // prevent focus to avoid accidental activation
  event.preventDefault()
}

function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault()

  if (itemContext.disabled.value)
    return

  if ((event.key === kbd.ENTER || event.key === kbd.SPACE) && !event.ctrlKey && !event.shiftKey)
    rootContext.changeModelValue(itemContext.step.value)

  if ([kbd.ARROW_LEFT, kbd.ARROW_RIGHT, kbd.ARROW_UP, kbd.ARROW_DOWN].includes(event.key)) {
    useArrowNavigation(event, getActiveElement() as HTMLElement, undefined, {
      itemsArray: stepperItems.value,
      focus: true,
      loop: false,
      arrowKeyOptions: rootContext.orientation.value,
      dir: rootContext.dir.value,
    })
  }
}

const { forwardRef, currentElement } = useForwardExpose()

watchPostEffect((cleanup) => {
  const element = currentElement.value
  if (!element)
    return
  rootContext.stepperItemValues.set(element, () => itemContext.step.value)
  rootContext.totalStepperItems.value.add(element)
  cleanup(() => {
    rootContext.stepperItemValues.delete(element)
    rootContext.totalStepperItems.value.delete(element)
  })
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="asChild"
    :data-state="itemContext.state.value"
    :disabled="itemContext.disabled.value || !itemContext.isFocusable.value ? '' : undefined"
    :data-disabled="itemContext.disabled.value || !itemContext.isFocusable.value ? '' : undefined"
    :data-orientation="rootContext.orientation.value"
    :tabindex="itemContext.isFocusable.value ? 0 : -1"
    :aria-current="itemContext.state.value === 'active' ? 'step' : undefined"
    :aria-describedby="getAriaDescribedby()"
    :aria-labelledby="getAriaLabelledby()"
    @mousedown.left="handleMouseDown"
    @keydown.enter.space.left.right.up.down="handleKeyDown"
  >
    <slot />
  </Primitive>
</template>
