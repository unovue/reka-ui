<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CollapsibleContentProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}

export type CollapsibleContentEmits = {
  contentFound: [event: Event]
}
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, mergeProps, nextTick, onMounted, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import { ENDING_STYLE_ATTR, getRunningAnimations, STARTING_STYLE_ATTR, supportsAnimations } from '@/Presence/usePresence'
import {
  Primitive,
} from '@/Primitive'
import { useForwardElement, useId } from '@/shared'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'
import { getCollapsibleContentSurface } from './useCollapsible'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<CollapsibleContentProps>()
const emits = defineEmits<CollapsibleContentEmits>()

const rootContext = injectCollapsibleRootContext()
rootContext.contentId ||= useId(undefined, 'reka-collapsible-content')

const HEIGHT_VAR = '--reka-collapsible-content-height'
const WIDTH_VAR = '--reka-collapsible-content-width'

const presentRef = ref<InstanceType<typeof Presence>>()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const width = ref(0)
const height = ref(0)
const surface = getCollapsibleContentSurface(rootContext, {
  // `forceMount` keeps the content shown; Presence still tracks the open state
  // so `update:openComplete` is reported either way.
  present: () => props.forceMount || (presentRef.value?.present ?? rootContext.open.value),
  width,
  height,
})

// when opening we want it to immediately open to retrieve dimensions
// when closing we delay `present` to retrieve dimensions before closing
const isOpen = computed(() => rootContext.open.value)
const isMountAnimationPrevented = ref(isOpen.value)
const currentStyle = ref<Record<string, string>>()

/**
 * A size transition is still running: the toggle interrupted an open or a
 * close. Measuring would snap the panel to its full size, so keep it where it
 * is and let the transition retarget from there (Base UI's
 * `useCollapsiblePanel` likewise only refreshes the size variables from
 * `scrollHeight` / `scrollWidth` here).
 */
function isTransitionRunning(node: HTMLElement) {
  return supportsAnimations(node)
    && getRunningAnimations(node).some(animation => 'transitionProperty' in animation)
}

watch(
  () => [isOpen.value, presentRef.value?.present],
  async () => {
    // This `nextTick` is queued before Presence's exit check (this watcher is
    // registered before Presence's, so it runs first): the measuring below
    // restores the transitions and the ending style before Presence asks
    // `getAnimations()` what to wait for. Accordion item switching relies on it
    // (Base UI #3099).
    await nextTick()
    const node = currentElement.value
    if (!node)
      return

    if (isTransitionRunning(node)) {
      height.value = node.scrollHeight
      width.value = node.scrollWidth
      node.style.setProperty(HEIGHT_VAR, `${node.scrollHeight}px`)
      node.style.setProperty(WIDTH_VAR, `${node.scrollWidth}px`)
      return
    }
    currentStyle.value = currentStyle.value || {
      transitionDuration: node.style.transitionDuration,
      animationName: node.style.animationName,
    }
    // block any animations/transitions so the element renders at its full dimensions
    node.style.transitionDuration = '0s'
    node.style.animationName = 'none'

    // Measure the natural size (#2827): a transition-based panel sizes itself
    // from the CSS variables (`height: var(--reka-collapsible-content-height)`)
    // and collapses through `data-starting-style` / `data-ending-style`, so
    // neither may apply while measuring.
    const lifecycleAttributes = [STARTING_STYLE_ATTR, ENDING_STYLE_ATTR].filter(name => node.hasAttribute(name))
    lifecycleAttributes.forEach(name => node.removeAttribute(name))
    node.style.setProperty(HEIGHT_VAR, 'auto')
    node.style.setProperty(WIDTH_VAR, 'auto')

    // get width and height from full dimensions
    const rect = node.getBoundingClientRect()
    height.value = rect.height
    width.value = rect.width

    node.style.setProperty(HEIGHT_VAR, `${rect.height}px`)
    node.style.setProperty(WIDTH_VAR, `${rect.width}px`)
    if (lifecycleAttributes.length) {
      // Settle the styles once more with transitions still off, so the
      // transition does not start from the `auto` size used for measuring
      // (which cannot be interpolated): an open settles on its starting style
      // (the transition runs from it once Presence removes the attribute), a
      // close on the measured size (the transition runs from it to the ending
      // style restored below).
      const closing = lifecycleAttributes.includes(ENDING_STYLE_ATTR)
      if (!closing)
        lifecycleAttributes.forEach(name => node.setAttribute(name, ''))
      void getComputedStyle(node).height
      if (closing)
        lifecycleAttributes.forEach(name => node.setAttribute(name, ''))
    }

    // kick off any animations/transitions that were originally set up if it isn't the initial mount
    if (!isMountAnimationPrevented.value) {
      node.style.transitionDuration = currentStyle.value.transitionDuration
      node.style.animationName = currentStyle.value.animationName
    }
  },
  {
    immediate: true,
  },
)

onMounted(() => {
  requestAnimationFrame(() => {
    isMountAnimationPrevented.value = false
  })
})

useEventListener(currentElement, 'beforematch', (ev) => {
  requestAnimationFrame(() => {
    if (rootContext.onContentFound)
      rootContext.onContentFound(ev)
    else
      rootContext.onOpenToggle(ev)
    emits('contentFound', ev)
  })
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    ref="presentRef"
    :present="rootContext.open.value"
    :force-mount="true"
    @complete="rootContext.notifyOpenComplete"
  >
    <Primitive
      v-bind="mergeProps($attrs, surface.attrs.value)"
      :ref="forwardRef"
      :as-child="props.asChild"
      :as="as"
    >
      <slot v-if="rootContext.unmountOnHide.value ? forceMount || present : true" />
    </Primitive>
  </Presence>
</template>
