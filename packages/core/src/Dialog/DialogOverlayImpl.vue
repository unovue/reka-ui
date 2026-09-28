<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DialogOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogOverlayImplProps & { present?: boolean }>(), {
  present: true,
})
const rootContext = injectDialogRootContext()

const scrollLocked = useBodyScrollLock(props.present)
watch(() => props.present, val => scrollLocked.value = val)

useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    style="pointer-events: auto"
    @pointerdown.left.self.prevent
  >
    <slot />
  </Primitive>
</template>
