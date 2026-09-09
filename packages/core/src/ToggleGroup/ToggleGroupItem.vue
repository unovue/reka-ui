<script lang="ts">
import type { AcceptableValue } from '@/shared/types'
import type { ToggleEmits, ToggleProps } from '@/Toggle'
import { useForwardExpose, useForwardScopeId } from '@/shared'

export interface ToggleGroupItemProps extends Omit<ToggleProps, 'name' | 'required' | 'modelValue' | 'defaultValue'> {
  /**
   * A string value for the toggle group item. All items within a toggle group should use a unique value.
   */
  value: AcceptableValue
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { Toggle } from '@/Toggle'
import { injectToggleGroupRootContext } from './ToggleGroupRoot.vue'
import { getToggleGroupItemSurface } from './useToggleGroup'

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
  as: 'button',
})

const rootContext = injectToggleGroupRootContext()
// pressed/disabled come from the shared surface builder (single derivation with
// `useToggleGroup().getItemSurface`); the rendered attrs still come from the
// nested `Toggle`, which is fed those two values below.
const surface = getToggleGroupItemSurface(rootContext, () => props.value, () => props.disabled)
const disabled = computed(() => surface.state.value.disabled)
const pressed = computed(() => surface.state.value.state === 'checked')

// The nested `Toggle` composes `useTogglePressed` with its own `emit`, so its
// `beforeUpdate:modelValue` / `update:modelValue` form an inner channel that
// only reports the press of this item's controlled `pressed`. The group value
// change is routed through `rootContext.changeModelValue` (reason `item-press`,
// the Toggle's native event), so the `beforeUpdate:modelValue` a consumer
// cancels is the one emitted by `ToggleGroupRoot`.
function onTogglePressed(_value: boolean, details: ToggleEmits['update:modelValue'][1]) {
  rootContext.changeModelValue(props.value, 'item-press', details.event)
}

const { forwardRef } = useForwardExpose()
// `ToggleGroupItem` wraps the multi-root `Toggle`, so the parent's scoped-style id
// is not auto-forwarded; pass it through manually so consumer `<style scoped>` works.
const scopeIdAttrs = useForwardScopeId()
</script>

<template>
  <component
    :is="rootContext.rovingFocus.value ? RovingFocusItem : Primitive"
    as-child
    v-bind="rootContext.rovingFocus.value ? { focusable: !disabled, active: pressed } : {}"
  >
    <Toggle
      v-bind="{ ...scopeIdAttrs, ...props }"
      :ref="forwardRef"
      v-slot="slotProps"
      :disabled="disabled"
      :model-value="pressed"
      @update:model-value="onTogglePressed"
    >
      <slot v-bind="slotProps" />
    </Toggle>
  </component>
</template>
