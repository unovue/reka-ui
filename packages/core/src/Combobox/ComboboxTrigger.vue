<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useRenderedContentId } from '@/shared'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxTriggerProps>(), {
  as: 'button',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectComboboxRootContext()
const contentId = useRenderedContentId(rootContext)
const disabled = computed(() => props.disabled || rootContext.disabled.value || false)

onMounted(() => {
  if (currentElement.value)
    rootContext.onTriggerElementChange(currentElement.value)
})

// With `focusOnOpen: false` opening leaves focus here, so let the arrow keys move it to the input.
function handleKeyDown(ev: KeyboardEvent) {
  if (!rootContext.open.value || rootContext.focusInputOnOpen.value || !rootContext.inputElement.value)
    return
  ev.preventDefault()
  rootContext.inputElement.value.focus()
}
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    tabindex="-1"
    aria-label="Show popup"
    aria-haspopup="listbox"
    :aria-expanded="rootContext.open.value"
    :aria-controls="rootContext.open.value ? contentId : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :disabled="disabled"
    :data-disabled="disabled ? '' : undefined"
    :aria-disabled="disabled ?? undefined"
    @click="rootContext.onOpenChange(!rootContext.open.value)"
    @keydown.down.up="handleKeyDown"
  >
    <slot />
  </Primitive>
</template>
