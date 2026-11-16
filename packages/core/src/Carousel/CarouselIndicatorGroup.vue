<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface CarouselIndicatorGroupProps extends PrimitiveProps {}

export interface CarouselIndicatorGroupContext {
  /** Indicators in a group are tabs: one tab stop, arrows between them. */
  tabs: true
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

provideCarouselIndicatorGroupContext({ tabs: true })

// Mounted, it turns the slides into the tab panels of its tabs. It registers on mount
// (the slides render before it), so the server renders the slides as groups.
onMounted(() => rootContext.indicatorTabs.value++)
onBeforeUnmount(() => rootContext.indicatorTabs.value--)

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
