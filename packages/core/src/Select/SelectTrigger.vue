<script lang="ts">
import type { PopperAnchorProps } from '@/Popper'

export interface SelectTriggerProps extends PopperAnchorProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps, onBeforeUnmount, watchPostEffect } from 'vue'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { injectPopperRootContext } from '@/Popper/PopperRoot.vue'
import { renderAs } from '@/Primitive/renderAs'
import { getElementByIdFrom, useForwardElement } from '@/shared'
import { formResetBinder, injectFormResetOwner } from '@/shared/formReset'
import { injectSelectFieldContext, injectSelectRootContext } from './SelectRoot.vue'
import { useSelectTrigger } from './useSelect'

defineOptions({
  // Consumer attrs merge under the trigger's own bindings (their listeners run
  // first), the order the former `PopperAnchor` / `asChild` layering gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  as: 'button',
})
const rootContext = injectSelectRootContext()
// The root's form reset, bound on the trigger: the root renders no element.
const onFormReset = injectFormResetOwner()
const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

const { trigger } = useSelectTrigger({
  context: rootContext,
  disabled: () => props.disabled,
})

// The positioning anchor: what `PopperAnchor` did, without its components.
// Both follow the element (an `as` change replaces it), so the root, and a
// Field focusing its control, always reach the rendered trigger.
const popperRootContext = injectPopperRootContext()
watchPostEffect(() => {
  rootContext.onTriggerChange(triggerElement.value)
  popperRootContext.onAnchorChange(props.reference ?? triggerElement.value)
})
// An unmounted trigger must not stay the element the root (and a Field
// focusing its control) reaches, nor the anchor. Only what this trigger still
// owns is cleared: a trigger that replaced it keeps its references.
onBeforeUnmount(() => {
  const element = triggerElement.value
  if (rootContext.triggerElement.value === element)
    rootContext.onTriggerChange(undefined)
  if (popperRootContext.anchor.value === (props.reference ?? element))
    popperRootContext.onAnchorChange(undefined)
})

// Optional Field participation: the root is the field's control, and the
// trigger, its focusable element, carries the field's id, label and aria
// wiring and reports focus. The Select's binding is `null` outside a
// `FieldRoot` (and inside another control of it), so all of this is inert
// without a Field: the consumer's attributes pass through unchanged.
const field = injectSelectFieldContext(null)

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes and id merge over the consumer's attributes (a consumer
// `id` wins, and its aria ids are merged) and under the trigger's own.
function renderAttrs(attrs: Record<string, unknown>) {
  const own = { onFocusin: focusWithin?.onFocusin, onFocusout: focusWithin?.onFocusout, type: props.as === 'button' ? 'button' : undefined }
  if (!field)
    return mergeProps(attrs, trigger.attrs.value, own)
  return mergeProps(
    attrs,
    {
      ...field.dataAttributes(),
      id: (attrs.id as string | undefined) ?? field.context.fieldId.value,
      ...field.ariaAttrs(attrs, !!trigger.attrs.value.disabled),
    },
    trigger.attrs.value,
    own,
  )
}

// Focus moving from the trigger into the (portaled) content keeps the field
// focused, so opening the popup doesn't touch it; it's touched once focus
// leaves both, as in Base UI.
const focusWithin = useFieldFocusWithin(field, triggerElement, {
  elements: () => [getElementByIdFrom(triggerElement.value, rootContext.contentId)],
  open: () => rootContext.open.value,
})

const bindFormReset = formResetBinder(onFormReset)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="renderAttrs($attrs)"
    :ref="forwardRef"
    @vue:mounted="bindFormReset"
  >
    <slot />
  </component>
</template>
