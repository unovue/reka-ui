<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorFieldInputProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps, nextTick, onBeforeUnmount, useAttrs } from 'vue'
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectColorFieldFieldControl, injectColorFieldRootContext } from './ColorFieldRoot.vue'
import { createColorFieldInputSurface } from './useColorField'

defineOptions({
  // Bound explicitly (same merge as fallthrough), so a Field's aria ids can be
  // merged with the consumer's instead of being replaced by them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ColorFieldInputProps>(), {
  as: 'input',
})

const rootContext = injectColorFieldRootContext()
const input = createColorFieldInputSurface(rootContext)

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// The root's Field binding (`null` outside a `FieldRoot`). The input is the
// field's control: it carries the id, label, description and invalid state,
// and reports focus and blur (touched).
const fieldControl = injectColorFieldFieldControl(null)
const field = fieldControl?.binding
if (fieldControl) {
  const attrs = useAttrs()
  const registration = {
    element: () => currentElement.value as HTMLElement | undefined,
    id: () => attrs.id as string | undefined,
  }
  fieldControl.input.value = registration
  onBeforeUnmount(() => {
    if (fieldControl.input.value === registration)
      fieldControl.input.value = undefined
  })
}

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes go first; its aria ids are merged with the consumer's. A
// consumer `aria-invalid` wins, then the field's, then the input's own (set
// when a commit rejected the text).
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(input.attrs.value, attrs)
  const aria = field.ariaAttrs(attrs, rootContext.disabled.value)
  return mergeProps(
    field.dataAttributes(),
    input.attrs.value,
    attrs,
    {
      ...aria,
      'id': field.id(),
      'aria-invalid': aria['aria-invalid'] ?? input.attrs.value['aria-invalid'],
      'onFocus': field.onFocus,
      'onBlur': handleFieldBlur,
    },
  )
}

// A blur commits the typed text first (the surface's own `onBlur`). Report
// the blur once that change has rendered, so on-blur validation reads the
// committed value from a controlled parent.
function handleFieldBlur() {
  nextTick(field!.onBlur)
}
</script>

<template>
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    v-bind="renderAttrs($attrs)"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot />
    </template>
  </component>
</template>
