<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {
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
watch(() => props.present, val => scrollLocked.value = val)

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
