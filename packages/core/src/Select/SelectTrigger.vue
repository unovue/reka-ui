<script lang="ts">
import type { PopperAnchorProps } from '@/Popper'

export interface SelectTriggerProps extends PopperAnchorProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps, onBeforeUnmount, onMounted, useAttrs, watchPostEffect } from 'vue'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { injectPopperRootContext } from '@/Popper/PopperRoot.vue'
import { renderAs } from '@/Primitive/renderAs'
import { getElementByIdFrom, useForwardElement } from '@/shared'
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
const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

const { trigger } = useSelectTrigger({
  context: rootContext,
  disabled: () => props.disabled,
})

onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
})

// The positioning anchor: what `PopperAnchor` did, without its components.
const popperRootContext = injectPopperRootContext()
watchPostEffect(() => {
  popperRootContext.onAnchorChange(props.reference ?? triggerElement.value)
})

// Optional Field participation — the trigger is the combobox's focusable
// element, so it (not SelectRoot) owns id/aria-describedby/aria-invalid and
// focus-state reporting. The Select's field is `null` outside a `FieldRoot`
// (and inside another control of it), so all of this is inert when
// there is no ancestor Field: `resolvedId`/`mergedDescribedBy` fall back to
// whatever the consumer already passed (or nothing), unchanged.
const fieldContext = injectSelectFieldContext(null)
const attrs = useAttrs()
// `attrs` isn't reactive, so these are read during render rather than cached
// in a `computed`. Consumer values are merged (ids) or win (`id`,
// `aria-invalid`) — read explicitly rather than relying on attrs-merge order
// through the `PopperAnchor`/`asChild` layering.
function getResolvedId() {
  return (attrs.id as string | undefined) ?? fieldContext?.fieldId.value
}
function getFieldAttrs() {
  const mergeIds = (consumerValue: unknown, fieldValue: string | undefined) =>
    [consumerValue as string | undefined, fieldValue].filter(Boolean).join(' ') || undefined
  return {
    ...fieldContext?.dataAttributes.value,
    'id': getResolvedId(),
    'aria-labelledby': mergeIds(attrs['aria-labelledby'], fieldContext?.labelId.value),
    'aria-describedby': mergeIds(attrs['aria-describedby'], fieldContext?.describedBy.value),
    'aria-invalid': attrs['aria-invalid'] ?? (fieldContext?.invalid.value || undefined),
  }
}

// Focus moving from the trigger into the (portaled) content keeps the field
// focused, so opening the popup doesn't touch it; it's touched once focus
// leaves both, as in Base UI.
const focusWithin = useFieldFocusWithin(
  fieldContext
    ? { onFocus: () => fieldContext.handleControlFocus(), onBlur: () => fieldContext.handleControlBlur(), context: fieldContext }
    : null,
  triggerElement,
  {
    elements: () => [getElementByIdFrom(triggerElement.value, rootContext.contentId)],
    open: () => rootContext.open.value,
  },
)

let unregisterControl: (() => void) | undefined
onMounted(() => {
  unregisterControl = fieldContext?.registerControl({
    id: getResolvedId,
    element: () => triggerElement.value,
    getValue: () => rootContext.modelValue.value,
    required: () => Boolean(rootContext.required.value),
  })
})
onBeforeUnmount(() => unregisterControl?.())
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="mergeProps($attrs, getFieldAttrs(), trigger.attrs.value, { onFocusin: focusWithin?.onFocusin, onFocusout: focusWithin?.onFocusout, type: as === 'button' ? 'button' : undefined })"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
