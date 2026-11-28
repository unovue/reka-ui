<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onScopeDispose, ref, watch } from 'vue'
import { mergeExpose, useForwardElement } from '@/shared'
import { injectTabsRootContext } from './TabsRoot.vue'

export interface TabsIndicatorProps extends PrimitiveProps {}

// One `ResizeObserver` for every indicator on the page, instead of one each. An element's
// observation is (re)started whenever an indicator (re)registers it, so its initial
// notification still comes, and every indicator observing a resized element updates once per
// notification, as it did with its own observer.
let sharedObserver: ResizeObserver | undefined
const observers = new Map<Element, Set<() => void>>()

function notifyResized(entries: ResizeObserverEntry[]) {
  const notified = new Set<() => void>()
  for (const entry of entries) {
    for (const update of observers.get(entry.target) ?? []) {
      if (!notified.has(update)) {
        notified.add(update)
        update()
      }
    }
  }
}

function unobserveAll(elements: Element[], update: () => void) {
  for (const element of elements) {
    const updates = observers.get(element)
    if (!updates?.delete(update) || updates.size)
      continue
    observers.delete(element)
    sharedObserver?.unobserve(element)
  }
}

function observeAll(elements: Element[], update: () => void) {
  sharedObserver ??= new ResizeObserver(notifyResized)
  for (const element of elements) {
    let updates = observers.get(element)
    if (!updates)
      observers.set(element, updates = new Set())
    updates.add(update)
    sharedObserver.observe(element)
  }
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { renderAs } from '@/Primitive/renderAs'

defineProps<TabsIndicatorProps>()
const context = injectTabsRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  updateIndicatorStyle,
}))

const isMounted = useMounted()

interface IndicatorStyle {
  size: number | null
  thickness: number | null
  position: number | null
}
const indicatorStyle = ref<IndicatorStyle>({
  size: null,
  thickness: null,
  position: null,
})

watch(() => [context.modelValue.value, context?.dir.value], () => {
  updateIndicatorStyle()
}, { immediate: true, flush: 'post' })

// The list and its tabs (looked up again whenever the list element changes) are observed for
// size changes.
let observed: Element[] = []
watch(() => context.tabsList.value, (list) => {
  unobserveAll(observed, updateIndicatorStyle)
  observed = []
  if (typeof window === 'undefined' || !('ResizeObserver' in window))
    return
  const targets = [list, ...Array.from(list?.querySelectorAll<HTMLElement>('[role="tab"]') || [])]
  observed = targets.filter((target): target is HTMLElement => target instanceof Element)
  observeAll(observed, updateIndicatorStyle)
}, { immediate: true, flush: 'post' })
onScopeDispose(() => unobserveAll(observed, updateIndicatorStyle))

function setIndicatorStyle(size: number, thickness: number, position: number) {
  const current = indicatorStyle.value
  // Only a change re-renders the indicator: the resize notifications re-measure every tab.
  if (current.size !== size || current.thickness !== thickness || current.position !== position)
    indicatorStyle.value = { size, thickness, position }
}

function updateIndicatorStyle() {
  const activeTab = context.tabsList.value?.querySelector<HTMLButtonElement>('[role="tab"][data-state="checked"]')

  if (!activeTab)
    return

  if (context.orientation.value === 'horizontal')
    setIndicatorStyle(activeTab.offsetWidth, activeTab.offsetHeight, activeTab.offsetLeft)
  else
    setIndicatorStyle(activeTab.offsetHeight, activeTab.offsetWidth, activeTab.offsetTop)
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-if="isMounted && typeof indicatorStyle.size === 'number'"
    :ref="forwardRef"
    :style="{
      '--reka-tabs-indicator-size': `${indicatorStyle.size}px`,
      '--reka-tabs-indicator-thickness': `${indicatorStyle.thickness}px`,
      '--reka-tabs-indicator-position': `${indicatorStyle.position}px`,
    }"
  >
    <slot />
  </component>
</template>
