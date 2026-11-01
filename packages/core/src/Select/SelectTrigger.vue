<script lang="ts">
import type { PopperAnchorProps } from '@/Popper'

export interface SelectTriggerProps extends PopperAnchorProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps, onBeforeUnmount, onMounted, useAttrs, watchPostEffect } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { injectPopperRootContext } from '@/Popper/PopperRoot.vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectSelectRootContext } from './SelectRoot.vue'
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
// focus-state reporting. `injectFieldRootContext(null)` returns `null`
// (instead of throwing) outside a `FieldRoot`, so all of this is inert when
// there is no ancestor Field: `resolvedId`/`mergedDescribedBy` fall back to
// whatever the consumer already passed (or nothing), unchanged.
const fieldContext = injectFieldRootContext(null)
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

function handleFieldFocus() {
  fieldContext?.handleControlFocus()
}
function handleFieldBlur() {
  fieldContext?.handleControlBlur()
}

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
    v-bind="mergeProps($attrs, getFieldAttrs(), trigger.attrs.value, { onFocus: handleFieldFocus, onBlur: handleFieldBlur, type: as === 'button' ? 'button' : undefined })"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
