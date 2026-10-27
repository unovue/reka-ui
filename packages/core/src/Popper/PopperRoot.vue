<script lang="ts">
import type { ReferenceElement } from '@floating-ui/vue'
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface Measurable {
  getBoundingClientRect: () => DOMRect
}

interface PopperRootContext {
  anchor: Readonly<Ref<ReferenceElement | undefined>>
  onAnchorChange: (element: ReferenceElement | undefined) => void
}

export const [injectPopperRootContext, providePopperRootContext]
  = createContext<PopperRootContext>('PopperRoot')
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  /**
   * Anchor used while no `PopperAnchor` registers one: the active detached
   * trigger of a Root with a `handle` (#2826).
   */
  reference?: ReferenceElement
}>()

const anchorPart = ref<ReferenceElement>()
const anchor = computed(() => anchorPart.value ?? props.reference)

providePopperRootContext({
  anchor,
  onAnchorChange: element => anchorPart.value = element,
})
</script>

<template>
  <slot />
</template>
