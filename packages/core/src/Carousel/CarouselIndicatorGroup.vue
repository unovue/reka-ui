<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose, useId } from '@/shared'

export interface CarouselIndicatorGroupProps extends PrimitiveProps {}

export interface CarouselIndicatorGroupContext {
  /** The group's id: its tabs' ids derive from it, so two groups never share one. */
  id: string
}

export const [injectCarouselIndicatorGroupContext, provideCarouselIndicatorGroupContext]
  = createContext<CarouselIndicatorGroupContext>('CarouselIndicatorGroup')
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { injectCarouselRootContext } from './CarouselRoot.vue'

withDefaults(defineProps<CarouselIndicatorGroupProps>(), { as: 'div' })

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectCarouselRootContext()

const id = useId(undefined, 'reka-carousel-tabs')
provideCarouselIndicatorGroupContext({ id })

// Mounted, it turns the slides into the tab panels of its tabs. It registers on mount
// (the slides render before it), so the server renders the slides as groups.
onMounted(() => rootContext.tabGroups.value = [...rootContext.tabGroups.value, id])
onBeforeUnmount(() => rootContext.tabGroups.value = rootContext.tabGroups.value.filter(group => group !== id))

// APG tabbed carousel: the arrows move between the indicators and show their slide,
// Home and End go to the first and last one.
function onKeydown(event: KeyboardEvent) {
  const group = currentElement.value as HTMLElement | undefined
  if (!group || event.altKey || event.ctrlKey || event.metaKey)
    return
  const tabs = Array.from(group.querySelectorAll<HTMLElement>('[role="tab"]')).filter(tab => tab.closest('[role="tablist"]') === group)
  const index = tabs.indexOf(event.target as HTMLElement)
  if (index === -1)
    return
  const rtl = rootContext.dir.value === 'rtl'
  const next = rtl ? 'ArrowLeft' : 'ArrowRight'
  const prev = rtl ? 'ArrowRight' : 'ArrowLeft'
  let target: number | undefined
  if (event.key === next || event.key === 'ArrowDown')
    target = (index + 1) % tabs.length
  else if (event.key === prev || event.key === 'ArrowUp')
    target = (index - 1 + tabs.length) % tabs.length
  else if (event.key === 'Home')
    target = 0
  else if (event.key === 'End')
    target = tabs.length - 1
  if (target === undefined)
    return
  event.preventDefault()
  tabs[target].focus()
  tabs[target].click()
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    role="tablist"
    aria-label="Choose slide to display"
    :data-orientation="rootContext.orientation.value"
    @keydown="onKeydown"
  >
    <slot />
  </Primitive>
</template>
