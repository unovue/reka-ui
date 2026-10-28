<script lang="ts">
import type { PrimitiveProps } from '..'
import { refAutoReset } from '@vueuse/shared'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxContentSurface, getListboxContentTabindex } from './useListbox'

export interface ListboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { mergeProps, watchPostEffect } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { renderAs } from '@/Primitive/renderAs'
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
const surface = getListboxContentSurface(rootContext, { isClickFocus, tabindexOutsideRender: true })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useCollectionSlot(currentElement)

// The roving tabindex flips whenever the highlight is set or cleared (a
// pointer leaving or re-entering, a blur, the first model change). Applied
// here, outside the render, a flip touches one attribute instead of
// re-rendering the content and, through its slot, every item. The render
// keeps the setup value, for SSR and hydration.
const tabindex = getListboxContentTabindex(rootContext)
watchPostEffect(() => {
  const element = currentElement.value as Element | null | undefined
  element?.setAttribute('tabindex', tabindex.value)
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="mergeProps($attrs, surface.attrs.value)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
