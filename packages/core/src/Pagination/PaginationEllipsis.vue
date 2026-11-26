<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PaginationEllipsisProps extends PrimitiveProps {}

// Content named without text: an image with alternative text, or an ARIA or `title` name.
const NAMED = 'img[alt]:not([alt=""]), [aria-label], [aria-labelledby], [title]'
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]'

const OBSERVE: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  // What can make existing content focusable or named. Not `aria-hidden`, which is this component's own output.
  attributeFilter: ['href', 'tabindex', 'contenteditable', 'alt', 'aria-label', 'aria-labelledby', 'title'],
}

// One observer for every ellipsis, and the update of each observed element.
const updaters = new WeakMap<Node, () => void>()
let observer: MutationObserver | undefined

function onMutations(records: MutationRecord[]) {
  const pending = new Set<() => void>()
  for (const record of records) {
    for (let node: Node | null = record.target; node; node = node.parentNode) {
      const update = updaters.get(node)
      if (update)
        pending.add(update)
    }
  }
  pending.forEach(update => update())
}

function observe(element: Element, update: () => void) {
  if (typeof MutationObserver === 'undefined')
    return
  updaters.set(element, update)
  ;(observer ??= new MutationObserver(onMutations)).observe(element, OBSERVE)
}
</script>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { ref } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { getPaginationEllipsisSurface } from './usePagination'

defineProps<PaginationEllipsisProps>()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const surface = getPaginationEllipsisSurface()

// A bare "…" (or an icon) is a visual cue that reads as noise, so it is hidden from assistive technology.
// Content with its own text, or anything focusable, is left alone. An `aria-hidden` attribute overrides this.
const isDecorative = ref(false)

function updateIsDecorative() {
  const element = currentElement.value
  if (!element || typeof element.matches !== 'function') {
    isDecorative.value = false
    return
  }
  const text = element.textContent?.trim() ?? ''
  const isFocusable = element.matches(FOCUSABLE) || !!element.querySelector(FOCUSABLE)
  const isNamed = element.matches(NAMED) || !!element.querySelector(NAMED)
  isDecorative.value = !isFocusable && !isNamed && (text === '' || text === '\u2026' || text === '...')
}

// Slot content can change without this component updating, so the element itself is observed.
// Synced from the template ref (called after mount, after each update, and with `null` on
// unmount) rather than from lifecycle hooks.
let observed: Element | undefined
function setRef(el: Element | ComponentPublicInstance | null) {
  forwardRef(el)
  const element = currentElement.value
  if (element !== observed) {
    if (observed)
      updaters.delete(observed)
    observed = element ?? undefined
    if (observed)
      observe(observed, updateIsDecorative)
    updateIsDecorative()
  }
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="setRef"
    :aria-hidden="isDecorative ? true : undefined"
    v-bind="surface.attrs.value"
  >
    <slot>&#8230;</slot>
  </component>
</template>
