<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { injectGridboxRootContext } from './GridboxRoot.vue'

export interface GridboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { refAutoReset } from '@vueuse/shared'

defineProps<GridboxContentProps>()

const { CollectionSlot } = useCollection()
const rootContext = injectGridboxRootContext()
const isClickFocus = refAutoReset(false, 10)
</script>

<template>
  <CollectionSlot>
    <Primitive
      role="grid"
      :as="as"
      :as-child="asChild"
      :tabindex="rootContext.focusable.value ? rootContext.highlightedElement.value ? '-1' : '0' : undefined"
      :aria-multiselectable="!!rootContext.multiple.value"
      @mousedown.left="isClickFocus = true"
      @focus="(ev) => {
        if (isClickFocus) return
        rootContext.onEnter(ev)
      }"
      @keydown.down.up.left.right.home.end="(event: KeyboardEvent) => {
        event.preventDefault()
        rootContext.focusable.value ? rootContext.onKeydownNavigation(event) : undefined
      }"
      @keydown.enter.space="rootContext.onKeydownEnter"
      @keydown="rootContext.onKeydownTypeAhead"
    >
      <slot />
    </Primitive>
  </CollectionSlot>
</template>
