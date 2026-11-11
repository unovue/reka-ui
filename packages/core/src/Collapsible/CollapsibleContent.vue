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
  contentFound: [void]
}
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import {
  Primitive,
} from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<CollapsibleContentProps>()
const emits = defineEmits<CollapsibleContentEmits>()

const rootContext = injectCollapsibleRootContext()
rootContext.contentId ||= useId(undefined, 'reka-collapsible-content')

const presentRef = ref<InstanceType<typeof Presence>>()
const { forwardRef, currentElement } = useForwardExpose()

const width = ref(0)
const height = ref(0)

// when opening we want it to immediately open to retrieve dimensions
// when closing we delay `present` to retrieve dimensions before closing
const isOpen = computed(() => rootContext.open.value)
const isMountAnimationPrevented = ref(isOpen.value)
const currentStyle = ref<Record<string, string>>()

watch(
  () => [isOpen.value, presentRef.value?.present],
  async () => {
    await nextTick()
    const node = currentElement.value
    if (!node)
      return
    currentStyle.value = currentStyle.value || {
      transitionDuration: node.style.transitionDuration,
      animationName: node.style.animationName,
    }
    // block any animations/transitions so the element renders at its full dimensions
    node.style.transitionDuration = '0s'
    node.style.animationName = 'none'

    // get width and height from full dimensions
    const rect = node.getBoundingClientRect()
    height.value = rect.height
    width.value = rect.width

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

const skipAnimation = computed(() => isMountAnimationPrevented.value && rootContext.open.value)

onMounted(() => {
  requestAnimationFrame(() => {
    isMountAnimationPrevented.value = false
  })
})

// Browsers restart a CSS animation whenever its element is inserted into the document again,
// e.g. when a keyed list moves the Collapsible. Once the open/close animation has finished,
// block it again (as on the initial mount) so it only replays on the next toggle, which
// restores the original style above. Deferred so Presence still reads the finished
// animation's name in its own `animationend` handler, and skipped while another CSS animation is
// running or paused (a running one retries on its own `animationend`). Transitions are not
// restarted by a move, so they are ignored.
useEventListener(currentElement, 'animationend', (ev) => {
  const node = currentElement.value!
  if (ev.target === node) {
    requestAnimationFrame(() => {
      if (!node.getAnimations?.().some(animation => 'animationName' in animation && animation.playState !== 'finished'))
        node.style.animationName = 'none'
    })
  }
})

useEventListener(currentElement, 'beforematch', (ev) => {
  requestAnimationFrame(() => {
    rootContext.onOpenToggle()
    emits('contentFound')
  })
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    ref="presentRef"
    :present="forceMount || rootContext.open.value"
    :force-mount="true"
  >
    <Primitive
      v-bind="$attrs"
      :id="rootContext.contentId"
      :ref="forwardRef"
      :as-child="props.asChild"
      :as="as"
      :hidden="!present ? rootContext.unmountOnHide.value ? '' : 'until-found' : undefined"
      :data-state="skipAnimation ? undefined : rootContext.open.value ? 'open' : 'closed'"
      :data-disabled="rootContext.disabled?.value ? '' : undefined"
      :style="{
        [`--reka-collapsible-content-height`]: `${height}px`,
        [`--reka-collapsible-content-width`]: `${width}px`,
      }"
    >
      <slot v-if="rootContext.unmountOnHide.value ? present : true" />
    </Primitive>
  </Presence>
</template>
