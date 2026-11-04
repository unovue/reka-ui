<script lang="ts">
import type { PrimitiveProps } from '..'
import { refAutoReset } from '@vueuse/shared'
import { injectListboxFieldContext, injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxContentSurface, getListboxContentTabindex } from './useListbox'

export interface ListboxContentProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, mergeProps, onBeforeUnmount, onMounted, watchPostEffect } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { renderAs, rendersOwnElement } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

defineOptions({
  // `$attrs` are bound first, under the content's own bindings: the
  // precedence the former `CollectionSlot` wrapper gave them.
  inheritAttrs: false,
})

const props = defineProps<ListboxContentProps>()

const rootContext = injectListboxRootContext()

const isClickFocus = refAutoReset(false, 10)

// The roving tabindex flips whenever the highlight is set or cleared (a
// pointer leaving or re-entering, a blur, the first model change). Bound in the
// render, each flip re-renders the content and, through its slot, every item.
// So a content that renders its element itself applies it outside the render,
// where a flip touches one attribute; the render keeps the setup value, for SSR
// and hydration. With `asChild` or a component `as`, something this part cannot
// see may bind a `tabindex` over this one, at any depth, and a consumer
// `tabindex` is its own case: the value stays in the render for those. That
// includes `ComboboxContent`, where the value does not flip: its input keeps
// the listbox unfocusable, so the tabindex stays '-1'. A camel-cased `tabIndex`
// stays out of the check: it is a DOM prop, set only when it changes, and moving
// to the render path would patch the roving value straight over it.
const instance = getCurrentInstance()!
const tabindexOutsideRender = computed(() => {
  // (`$attrs` read through the instance proxy tracks.)
  const attrs = instance.proxy!.$attrs
  return rendersOwnElement(props.as, props.asChild) && !('tabindex' in attrs)
})

// role/tabindex/aria/data-orientation and the mousedown/focus/keydown handlers
// come from the shared surface builder (single source with `useListboxRoot()`);
// the element is the collection's root.
const surface = getListboxContentSurface(rootContext, { isClickFocus, tabindexOutsideRender })

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
useCollectionSlot(currentElement)

// Inside a Field, the listbox element carries the field's id, label and aria
// wiring, and is what the field focuses.
const fieldContext = injectListboxFieldContext(null)
if (fieldContext) {
  onMounted(() => {
    fieldContext.contentElement.value = currentElement.value as HTMLElement
  })
  onBeforeUnmount(() => {
    if (fieldContext.contentElement.value === currentElement.value)
      fieldContext.contentElement.value = undefined
  })
}
// The Field's state attributes go first so the listbox's own `data-*` win;
// its aria ids are merged with the consumer's, and its id yields to theirs.
function fieldAttrs(attrs: Record<string, unknown>) {
  const { field } = fieldContext!
  return mergeProps(field.dataAttributes(), attrs, surface.attrs.value, {
    id: (attrs.id as string | undefined) ?? field.context.fieldId.value,
    ...field.ariaAttrs(attrs, rootContext.disabled.value),
  })
}

const tabindex = getListboxContentTabindex(rootContext)
watchPostEffect(() => {
  const value = tabindex.value
  if (tabindexOutsideRender.value)
    (currentElement.value as Element | null | undefined)?.setAttribute('tabindex', value)
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="fieldContext ? fieldAttrs($attrs) : mergeProps($attrs, surface.attrs.value)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
