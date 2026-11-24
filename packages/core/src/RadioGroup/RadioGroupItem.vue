<script lang="ts">
import type { ComputedRef } from 'vue'
import type { RadioProps } from './Radio.vue'
import type { SelectEvent } from './utils'
import { createRekaContext, useForwardExpose, useForwardScopeId } from '@/shared'

export interface RadioGroupItemProps extends Omit<RadioProps, 'checked'> {}
export type RadioGroupItemEmits = {
  select: [event: SelectEvent]
}

interface RadioGroupItemContext {
  disabled: ComputedRef<boolean>
  checked: ComputedRef<boolean>
}

export const [injectRadioGroupItemContext, provideRadiogroupItemContext]
  = createRekaContext<RadioGroupItemContext>('RadioGroupItem')
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { isEqual } from 'ohash'
import { computed, nextTick, ref } from 'vue'
import { RovingFocusItem } from '@/RovingFocus'
import Radio from './Radio.vue'
import { injectRadioGroupRootContext } from './RadioGroupRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RadioGroupItemProps>(), {
  disabled: false,
  as: 'button',
})

const emits = defineEmits<RadioGroupItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: typeof checked.value
    /** Required state */
    required: typeof required.value
    /** Disabled state */
    disabled: typeof disabled.value
  }) => any
}>()

const { forwardRef, currentElement } = useForwardExpose()

const rootContext = injectRadioGroupRootContext()

const disabled = computed(() => rootContext.disabled.value || props.disabled)
const required = computed(() => rootContext.required.value || props.required)
const checked = computed(() => isEqual(rootContext.modelValue?.value, props.value))

provideRadiogroupItemContext({ disabled, checked })

const isArrowKeyPressed = ref(false)
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

// Capture phase: `RovingFocusGroup` moves focus in a microtask that a real key press runs
// before bubbling listeners, so the flag has to be set before then for `handleFocus` to see it.
useEventListener('keydown', (event) => {
  if (ARROW_KEYS.includes(event.key))
    isArrowKeyPressed.value = true
}, { capture: true })
useEventListener('keyup', () => {
  // Reset after `RovingFocusGroup` has moved focus (it does so in `nextTick`), so a
  // keyup dispatched in the same task as the keydown can't erase the arrow intent.
  nextTick(() => {
    isArrowKeyPressed.value = false
  })
})

function handleFocus() {
  const triggeredByArrowKey = isArrowKeyPressed.value
  setTimeout(() => {
    /**
     * Our `RovingFocusGroup` will focus the radio when navigating with arrow keys
     * and we need to 'check' it in that case. We click it to 'check' it (instead
     * of updating `context.value`) so that the radio change event fires.
     */
    const element = currentElement.value
    if (!triggeredByArrowKey || !element?.isConnected || disabled.value)
      return
    // Read focus from the radio's own root so this also works inside a closed shadow root.
    const root = element.getRootNode() as Document | ShadowRoot
    if (root.activeElement === element)
      element.click()
  }, 0)
}
// `RadioGroupItem` sets `inheritAttrs: false` and wraps the multi-root `Radio`, so the
// parent's scoped-style id is not auto-forwarded; pass it through manually so consumer
// `<style scoped>` keeps working. (issue #2751)
const scopeIdAttrs = useForwardScopeId()
</script>

<template>
  <RovingFocusItem
    :checked="checked"
    :disabled="disabled"
    as-child
    :focusable="!disabled"
    :active="checked"
  >
    <Radio
      v-bind="{ ...scopeIdAttrs, ...$attrs, ...props }"
      :ref="forwardRef"
      :checked="checked"
      :required="required"
      :disabled="disabled"
      @update:checked="rootContext.changeModelValue(value)"
      @select="emits('select', $event)"
      @keydown.enter.prevent
      @focus="handleFocus"
    >
      <slot
        :checked="checked"
        :required="required"
        :disabled="disabled"
      />
    </Radio>
  </RovingFocusItem>
</template>
