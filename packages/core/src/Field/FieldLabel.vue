<script lang="ts">
import type { LabelProps } from '@/Label'

export interface FieldLabelProps extends LabelProps {
  /**
   * Whether the label renders a native `label` element. Set to `false` when
   * rendering another element (e.g. `as="div"`): it then drops `for`, focuses
   * the control on click, and relies on the control's `aria-labelledby`.
   *
   * Useful for button controls like `SelectTrigger`, where a native label
   * would forward clicks and `:hover` to the button.
   * @defaultValue true
   */
  nativeLabel?: boolean
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Label } from '@/Label'
import { defineReactiveIds, useForwardExpose, useReferencedId } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = withDefaults(defineProps<FieldLabelProps>(), {
  nativeLabel: true,
})

const { forwardRef, currentElement } = useForwardExpose()

const fieldContext = injectFieldRootContext()

// A consumer `id` on the label replaces the field's generated one, which the control's
// `aria-labelledby` then follows.
const label = defineReactiveIds({ id: '' }, ['id'])
useReferencedId(label, 'id', currentElement)

let unregister: (() => void) | undefined
onMounted(() => {
  unregister = fieldContext.registerLabel(() => label.id || undefined)
})
onBeforeUnmount(() => unregister?.())

function handleClick(event: MouseEvent) {
  if (props.nativeLabel)
    return
  // Clicks on an interactive element inside the label are its own.
  if ((event.target as HTMLElement | null)?.closest('button,input,select,textarea'))
    return
  fieldContext.focusControl()
}
</script>

<template>
  <Label
    v-bind="fieldContext.dataAttributes.value"
    :id="fieldContext.labelId.value ?? undefined"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :for="nativeLabel ? (props.for ?? fieldContext.getControlId()) : undefined"
    @click="handleClick"
    @pointerdown="(event: PointerEvent) => { if (!nativeLabel) event.preventDefault() }"
  >
    <slot />
  </Label>
</template>
