<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {
  lockTarget?: HTMLElement | string | null
}
</script>

<script setup lang="ts">
import { toValue, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { resolveElement, useForwardExpose } from '@/shared'
import { useScrollLock } from '@/shared/useScrollLock'
import { DialogAttributes, injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogOverlayImplProps & { present?: boolean }>(), {
  present: true,
})
const rootContext = injectDialogRootContext()

const scrollLocked = useScrollLock(() => resolveElement(toValue(
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
    :[DialogAttributes.state]="rootContext.open.value ? 'open' : 'closed'"
    :[DialogAttributes.contained]="rootContext.container.value ? '' : undefined"
    style="pointer-events: auto"
    @pointerdown.left.self.prevent
  >
    <slot />
  </Primitive>
</template>
