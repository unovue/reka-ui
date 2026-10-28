<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface ToastCloseProps extends PrimitiveProps {}

// Left out of the toast's announcement (what `ToastAnnounceExclude` adds).
const ANNOUNCE_EXCLUDE = { 'data-reka-toast-announce-exclude': '', 'data-reka-toast-announce-alt': undefined }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectToastRootContext } from './ToastRootImpl.vue'
import { getToastCloseSurface } from './useToast'

defineOptions({
  // `$attrs` are merged over the announce-exclude marks and under the part's
  // own bindings: the order the former `<ToastAnnounceExclude as-child>`
  // wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastCloseProps>(), {
  as: 'button',
})

const rootContext = injectToastRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const close = getToastCloseSurface(rootContext.onClose)
// The marks `ToastAnnounceExclude` added, keeping the button out of the
// toast's announcement. A consumer `altText` attr was that wrapper's prop: the announced alternative.
function announceAttrs(attrs: Record<string, unknown>): [Record<string, unknown>, Record<string, unknown>] {
  if (!('altText' in attrs) && !('alt-text' in attrs))
    return [ANNOUNCE_EXCLUDE, attrs]
  const { altText, 'alt-text': altTextKebab, ...rest } = attrs
  return [{ ...ANNOUNCE_EXCLUDE, 'data-reka-toast-announce-alt': (altText ?? altTextKebab) || undefined }, rest]
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(...announceAttrs($attrs), close.attrs.value, { type: as === 'button' ? 'button' : undefined })"
  >
    <slot />
  </component>
</template>
