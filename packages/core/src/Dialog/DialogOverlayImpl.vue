<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogOverlaySurface } from './useDialog'

const props = withDefaults(defineProps<DialogOverlayImplProps & { present?: boolean }>(), {
  present: true,
})
const rootContext = injectDialogRootContext()

const scrollLocked = useBodyScrollLock(props.present)
watch(() => props.present, val => scrollLocked.value = val)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
// `data-state` from the shared surface builder; the scroll lock and the
// pointerdown guard (#2655/#2660) stay in the SFC.
const overlay = getDialogOverlaySurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    style="pointer-events: auto"
    v-bind="overlay.attrs.value"
    @pointerdown.left.self.prevent
  >
    <slot />
  </Primitive>
</template>
