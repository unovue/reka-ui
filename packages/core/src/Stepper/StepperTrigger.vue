<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, onMounted, ref, useAttrs, watchPostEffect } from 'vue'
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

// Whether the trigger has mounted. Until then, which parts are rendered is unknown: the
// title and description report themselves once mounted, and usually come after the trigger.
// The server render and the first client render reference both ids so that the server HTML
// names the trigger and hydration matches it; an id without an element is ignored.
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

// Name the trigger by its title and description so the accessible name matches the visible
// content. Only reference parts that are rendered, and leave the name to a consumer
// `aria-label` or `aria-labelledby`. Plain functions rather than computeds: `attrs` is not
// reactive, but the template re-renders when it changes.
function hasConsumerName() {
  return !!(attrs['aria-label'] || attrs['aria-labelledby'])
}

function getAriaLabelledby() {
  if (hasConsumerName())
    return undefined
  const ids = [
    !isMounted.value || itemContext.hasTitle.value ? itemContext.titleId : undefined,
    !isMounted.value || itemContext.hasDescription.value ? itemContext.descriptionId : undefined,
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

// The description is already part of the name when the trigger names itself by it.
function getAriaDescribedby() {
  if (!hasConsumerName() || (isMounted.value && !itemContext.hasDescription.value))
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
    :aria-current="itemContext.isCurrent.value ? 'step' : undefined"
    :aria-describedby="getAriaDescribedby()"
    :aria-labelledby="getAriaLabelledby()"
    @mousedown.left="handleMouseDown"
    @keydown.enter.space.left.right.up.down="handleKeyDown"
  >
    <slot />
  </Primitive>
</template>
