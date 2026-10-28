<script lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { useCollection } from '@/Collection'

export interface SelectTriggerProps extends PopperAnchorProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import type { SelectTypeaheadItem } from './useSelect'
import type { AcceptableValue } from '@/shared/types'
import { mergeProps, onBeforeUnmount, onMounted, useAttrs } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { isDisabledItem } from '@/shared/isDisabledItem'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectTrigger } from './useSelect'

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  as: 'button',
})
const rootContext = injectSelectRootContext()
const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

// The mounted items (the closed content renders them into a fragment), in
// document order, for the closed trigger's typeahead.
const { reactiveItems } = useCollection<{ value: { value: AcceptableValue, textValue: string } }>()
function getTypeaheadItems(): SelectTypeaheadItem[] {
  return reactiveItems.value
    .slice()
    .sort((a, b) => a.ref.compareDocumentPosition(b.ref) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1)
    .map(item => ({ value: item.value.value, textValue: item.value.textValue, disabled: isDisabledItem(item.ref) }))
}

const { trigger } = useSelectTrigger({
  context: rootContext,
  disabled: () => props.disabled,
  getItems: getTypeaheadItems,
})

onMounted(() => {
  rootContext.onTriggerChange(triggerElement.value)
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
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      v-bind="mergeProps(getFieldAttrs(), trigger.attrs.value, { onFocus: handleFieldFocus, onBlur: handleFieldBlur })"
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined"
      :as-child="asChild"
      :as="as"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
