<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerTriggerProps>(), { as: 'button' })
const rootContext = injectDrawerRootContext()
const { forwardRef, currentElement } = useForwardExpose()

onMounted(() => {
  rootContext.triggerElement.value = currentElement.value
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    aria-haspopup="dialog"
    :aria-expanded="rootContext.open.value"
    :aria-controls="rootContext.open.value ? rootContext.contentId : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @click="rootContext.onOpenChange(true)"
  >
    <slot />
  </Primitive>
</template>
