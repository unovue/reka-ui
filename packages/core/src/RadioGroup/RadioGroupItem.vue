<script lang="ts">
import type { ComputedRef } from 'vue'
import type { RadioProps } from './Radio.vue'
import type { SelectEvent } from './utils'
import { createContext, useForwardExpose, useForwardScopeId } from '@/shared'

export interface RadioGroupItemProps extends Omit<RadioProps, 'checked'> {}
export type RadioGroupItemEmits = {
  select: [event: SelectEvent]
}

export interface RadioGroupItemContext {
  disabled: ComputedRef<boolean>
  checked: ComputedRef<boolean>
}

export const [injectRadioGroupItemContext, provideRadiogroupItemContext]
  = createContext<RadioGroupItemContext>('RadioGroupItem')
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'
import { RovingFocusItem } from '@/RovingFocus'
import Radio from './Radio.vue'
import { injectRadioGroupRootContext } from './RadioGroupRoot.vue'
import { getRadioGroupItemSurface } from './useRadioGroup'

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

// checked (`isEqual(modelValue, value)`) and the group-inherited disabled/required
// come from the shared surface builder (single source with `useRadioGroup()`);
// the leaf `Radio` binds the attrs from the same builder, so only the derived
// state is read here and handed down as props.
const surface = getRadioGroupItemSurface(rootContext, () => props.value, () => props.disabled, () => props.required, { name: () => props.name })

const disabled = computed(() => surface.state.value.disabled)
const required = computed<boolean>(() => surface.props.value.required)
const checked = computed(() => surface.state.value.state === 'checked')

provideRadiogroupItemContext({ disabled, checked })

const isArrowKeyPressed = ref(false)
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

useEventListener('keydown', (event) => {
  if (ARROW_KEYS.includes(event.key))
    isArrowKeyPressed.value = true
})
useEventListener('keyup', () => {
  isArrowKeyPressed.value = false
})

function handleFocus() {
  setTimeout(() => {
    /**
     * Our `RovingFocusGroup` will focus the radio when navigating with arrow keys
     * and we need to 'check' it in that case. We click it to 'check' it (instead
     * of updating `context.value`) so that the radio change event fires.
     */
    if (isArrowKeyPressed.value)
      currentElement.value?.click()
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
      @update:checked="(_checked, details) => rootContext.changeModelValue(value, 'item-press', details?.event)"
      @select="emits('select', $event)"
      @keydown="surface.props.value.onKeydown"
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
