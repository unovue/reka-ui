<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {
  /**
   * Element (or CSS selector) whose scrolling is locked while the dialog is open,
   * overriding `DialogRoot`'s `container`.
   *
   * Use this when the container is not the element that actually scrolls — for
   * example a positioned wrapper containing a scrollable viewport: `container`
   * anchors the dialog, `lockTarget` points at the viewport.
   *
   * Leave it unset to lock the root `container` (or the body when no container is
   * configured). Pass `null` to disable scroll locking entirely.
   *
   * The target is resolved when the dialog opens, and re-resolved if it changes
   * while open.
   */
  lockTarget?: DOMTarget
}
</script>

<script setup lang="ts">
import type { DOMTarget } from '@/shared'
import { toValue, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { resolveDOMTarget, useForwardExpose } from '@/shared'
import { useScrollLock } from '@/shared/useScrollLock'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogOverlayImplProps & { present?: boolean }>(), {
  present: true,
})
const rootContext = injectDialogRootContext()

const scrollLocked = useScrollLock(() => resolveDOMTarget(toValue(
  // the `undefined` check for when `:lockTarget="null"` which should
  // explicitly indicate to not lock anything
  props.lockTarget !== undefined ? props.lockTarget : rootContext.container.value,
)), props.present)
watch(
  [
    () => props.present,
    () => props.lockTarget,
    () => rootContext.container.value,
  ],
  ([present]) => {
    scrollLocked.value = present
  },
)

useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-contained="rootContext.container.value ? '' : undefined"
    style="pointer-events: auto"
    @pointerdown.left.self.prevent
  >
    <slot />
  </Primitive>
</template>
