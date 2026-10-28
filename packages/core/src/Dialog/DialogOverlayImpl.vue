<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectDialogOverlayElementContext, injectDialogRootContext } from './DialogRoot.vue'
import { getDialogOverlaySurface } from './useDialog'

const props = withDefaults(defineProps<DialogOverlayImplProps & { present?: boolean }>(), {
  present: true,
})
const rootContext = injectDialogRootContext()
const overlayElement = injectDialogOverlayElementContext(null)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// A press on the overlay dismisses a modal dialog; a press anywhere else
// outside it (e.g. a third-party widget stacked above) does not (#2822).
// The page scroll lock follows `modal` and lives in `DialogContentModal`.
watch([currentElement, () => props.present], ([element, present], _, onCleanup) => {
  if (!element || !present || !overlayElement)
    return
  overlayElement.value = element
  onCleanup(() => {
    if (overlayElement.value === element)
      overlayElement.value = undefined
  })
}, { immediate: true })

// `data-state` from the shared surface builder; the pointerdown guard
// (#2655/#2660) stays in the SFC.
const overlay = getDialogOverlaySurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="overlay.attrs.value"
    @pointerdown.left.self.prevent
  >
    <slot />
  </component>
</template>
