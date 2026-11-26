<script lang="ts">
export interface Measurable {
  getBoundingClientRect: () => DOMRect
}

export { injectPopperRootContext, providePopperRootContext } from './PopperRootContext'
</script>

<script setup lang="ts">
import type { ReferenceElement } from '@floating-ui/vue'
import type { PopperScope } from './PopperRootContext'
import { computed, ref } from 'vue'
import { providePopperRootContext } from './PopperRootContext'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  /**
   * Anchor used while no `PopperAnchor` registers one: the active detached
   * trigger of a Root with a `handle` (#2826).
   */
  reference?: ReferenceElement
  /**
   * The component family of this root. Parts of the same family resolve it
   * through roots of other families in between.
   */
  scope?: PopperScope
}>()

const anchorPart = ref<ReferenceElement>()
const anchor = computed(() => anchorPart.value ?? props.reference)

providePopperRootContext({
  anchor,
  onAnchorChange: element => anchorPart.value = element,
}, props.scope)
</script>

<template>
  <slot />
</template>
