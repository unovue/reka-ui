<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, mergeProps, onBeforeUnmount, watch } from 'vue'
import { injectEditableFieldControl, injectEditableRootContext } from './EditableRoot.vue'

export interface EditablePreviewProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { getEditablePreviewSurface } from './useEditable'

defineOptions({
  // Bound explicitly (same merge as fallthrough), so a Field's aria ids can be
  // merged with the consumer's instead of being replaced by them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<EditablePreviewProps>(), { as: 'span' })

const context = injectEditableRootContext()
// Same derivation as `useEditable().preview`.
const preview = getEditablePreviewSurface(context)

const placeholder = computed(() => context.placeholder.value?.preview)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Inside a `FieldRoot`, the preview is what the field focuses while previewing.
const fieldControl = injectEditableFieldControl(null)
if (fieldControl) {
  watch(currentElement, (element) => {
    fieldControl.preview.value = element as HTMLElement | undefined
  }, { immediate: true })
  onBeforeUnmount(() => {
    if (fieldControl.preview.value === currentElement.value)
      fieldControl.preview.value = undefined
  })
}

// It's what a label click or an invalid submit focuses while previewing, so
// it's labelled, described and marked invalid by the field too.
const field = fieldControl?.binding
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(preview.attrs.value, attrs)
  return mergeProps(preview.attrs.value, attrs, { ...field.ariaAttrs(attrs, context.disabled.value) })
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="renderAttrs($attrs)"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot>
      {{ context.modelValue.value || placeholder }}
    </slot>
  </Primitive>
</template>
