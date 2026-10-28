<script lang="ts">
import type { PrimitiveProps } from '..'
import { refAutoReset } from '@vueuse/shared'
import { Primitive } from '..'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxContentSurface } from './useListbox'

export interface ListboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { useForwardElement } from '@/shared'

defineOptions({
  // `$attrs` are bound first, under the content's own bindings: the
  // precedence the former `CollectionSlot` wrapper gave them.
  inheritAttrs: false,
})

defineProps<ListboxContentProps>()

const rootContext = injectListboxRootContext()

const isClickFocus = refAutoReset(false, 10)

// role/tabindex/aria/data-orientation and the mousedown/focus/keydown handlers
// come from the shared surface builder (single source with `useListboxRoot()`);
// the element is the collection's root.
const surface = getListboxContentSurface(rootContext, { isClickFocus })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useCollectionSlot(currentElement)
</script>

<template>
  <Primitive
    v-bind="mergeProps($attrs, surface.attrs.value)"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
