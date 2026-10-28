<script setup lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { getCurrentInstance, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useCollection } from '@/Collection'
import { renderAs } from '@/Primitive/renderAs'
import { getActiveElement, useForwardElement } from '@/shared'
import { injectSelectContentContext } from './SelectContentImpl.vue'

export type SelectScrollButtonImplEmits = {
  autoScroll: []
}

const emits = defineEmits<SelectScrollButtonImplEmits>()
const { getItems } = useCollection()

const contentContext = injectSelectContentContext()
const autoScrollTimerRef = ref<number | null>(null)

function clearAutoScrollTimer() {
  if (autoScrollTimerRef.value !== null) {
    window.clearInterval(autoScrollTimerRef.value)
    autoScrollTimerRef.value = null
  }
}

watchEffect(() => {
  const activeItem = getItems().map(i => i.ref).find(
    item => item === getActiveElement(),
  )
  activeItem?.scrollIntoView({ block: 'nearest' })
})

function handlePointerDown() {
  if (autoScrollTimerRef.value === null) {
    autoScrollTimerRef.value = window.setInterval(() => {
      emits('autoScroll')
    }, 50)
  }
}

function handlePointerMove() {
  contentContext.onItemLeave?.()
  if (autoScrollTimerRef.value === null) {
    autoScrollTimerRef.value = window.setInterval(() => {
      emits('autoScroll')
    }, 50)
  }
}

onBeforeUnmount(() => clearAutoScrollTimer())

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// Renders as its scroll button part (`SelectScrollUpButton` / `SelectScrollDownButton`) asks.
const instance = getCurrentInstance()
function getTag() {
  const props = instance?.parent?.props as PrimitiveProps | undefined
  return renderAs(props?.as, props?.asChild)
}
</script>

<template>
  <component
    :is="getTag()"
    :ref="forwardRef"
    aria-hidden="true"
    :style="{
      flexShrink: 0,
    }"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerleave="
      () => {
        clearAutoScrollTimer();
      }
    "
  >
    <slot />
  </component>
</template>
