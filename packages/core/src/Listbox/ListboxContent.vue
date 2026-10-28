<script lang="ts">
import type { PrimitiveProps } from '..'
import { refAutoReset } from '@vueuse/shared'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { bindsTabindex, getListboxContentSurface, getListboxContentTabindex, LISTBOX_CONTENT_TABINDEX_OVERRIDDEN } from './useListbox'

export interface ListboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { getCurrentInstance, inject, mergeProps, provide, watchPostEffect } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { renderAs } from '@/Primitive/renderAs'
import { getSlotChildProps } from '@/Primitive/Slot'
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
// An as-child element that binds its own `tabindex` keeps it, as does a part
// that renders this as-child and binds one on the element further down: those
// bindings won the slot merge before.
const instance = getCurrentInstance()!
const tabindex = getListboxContentTabindex(rootContext)
const tabindexOverridden = inject(LISTBOX_CONTENT_TABINDEX_OVERRIDDEN, null)
provide(LISTBOX_CONTENT_TABINDEX_OVERRIDDEN, null)
function applyTabindex() {
  const element = currentElement.value as Element | null | undefined
  if (!element || tabindexOverridden?.() || bindsTabindex(getSlotChildProps(instance.subTree?.component)))
    return
  element.setAttribute('tabindex', tabindex.value)
}
watchPostEffect(applyTabindex)
// A patch of the element (an as-child element re-renders with the `Slot`, not
// with this part) puts the setup value back when the child drops its binding:
// `@vue:updated` runs after every patch of it.
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="mergeProps($attrs, surface.attrs.value)"
    :ref="forwardRef"
    @vue:updated="applyTabindex"
  >
    <slot />
  </component>
</template>
