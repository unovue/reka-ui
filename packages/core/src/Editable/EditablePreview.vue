<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, onBeforeUnmount, watch } from 'vue'
import { injectEditableFieldControl, injectEditableRootContext } from './EditableRoot.vue'

export interface EditablePreviewProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { getEditablePreviewSurface } from './useEditable'

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
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="preview.attrs.value"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot>
      {{ context.modelValue.value || placeholder }}
    </slot>
  </Primitive>
</template>
