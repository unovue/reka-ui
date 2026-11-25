<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface PaginationEllipsisProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Primitive } from '@/Primitive'

const props = defineProps<PaginationEllipsisProps>()
const { forwardRef, currentElement } = useForwardExpose()

// A bare "…" (or an icon) is a visual cue that reads as noise, so it is hidden from assistive technology.
// Content with its own text, or anything focusable, is left alone. An `aria-hidden` attribute overrides this.
const isDecorative = ref(false)
onMounted(() => {
  const element = currentElement.value
  if (!element || typeof element.querySelector !== 'function')
    return
  const text = element.textContent?.trim() ?? ''
  const isFocusable = element.tabIndex >= 0 || !!element.querySelector('a[href], button, input, select, textarea, [tabindex]')
  isDecorative.value = !isFocusable && (text === '' || text === '\u2026' || text === '...')
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    data-type="ellipsis"
    :aria-hidden="isDecorative ? true : undefined"
  >
    <slot>&#8230;</slot>
  </Primitive>
</template>
