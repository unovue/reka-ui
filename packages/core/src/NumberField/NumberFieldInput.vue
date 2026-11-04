<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { mergeProps, nextTick, onMounted } from 'vue'
import { useForwardElement } from '@/shared'
import { injectNumberFieldFieldControl, injectNumberFieldRootContext } from './NumberFieldRoot.vue'

export interface NumberFieldInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { createNumberFieldInputSurface } from './useNumberField'

defineOptions({
  // Bound explicitly (same merge as fallthrough), so a Field's aria ids can be
  // merged with the consumer's instead of being replaced by them.
  inheritAttrs: false,
})

withDefaults(defineProps<NumberFieldInputProps>(), {
  as: 'input',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectNumberFieldRootContext()
// Same factory as `useNumberField().createInputSurface()`: owns the displayed text and IME state.
const input = createNumberFieldInputSurface(rootContext)

onMounted(() => {
  rootContext.onInputElement(currentElement.value as HTMLInputElement)
})

// The root's Field binding (`null` outside a `FieldRoot`). The input is the
// field's control: it carries the id, label, description and invalid state,
// and reports focus and blur (touched).
const field = injectNumberFieldFieldControl(null)

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes go first; its aria ids are merged with the consumer's, and
// a consumer `aria-invalid` wins.
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(input.attrs.value, attrs)
  return mergeProps(
    field.dataAttributes(),
    input.attrs.value,
    attrs,
    { ...field.ariaAttrs(attrs, rootContext.disabled.value), onFocus: field.onFocus, onBlur: handleFieldBlur },
  )
}

// A blur commits the typed text first (the surface's own `onBlur`). Report
// the blur once that change has rendered, so on-blur validation reads the
// committed value, from a controlled parent and the hidden input alike.
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
