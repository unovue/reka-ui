<script lang="ts">
import type { AcceptableValue } from '@/shared/types'
import type { ToggleEmits, ToggleProps } from '@/Toggle'
import { useForwardElement, useForwardScopeId } from '@/shared'

export interface ToggleGroupItemProps extends Omit<ToggleProps, 'name' | 'required' | 'modelValue' | 'defaultValue'> {
  /**
   * A string value for the toggle group item. All items within a toggle group should use a unique value.
   */
  value: AcceptableValue
}
</script>

<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { Toggle } from '@/Toggle'
import { injectToggleGroupRootContext } from './ToggleGroupRoot.vue'
import { getToggleGroupItemSurface } from './useToggleGroup'

defineOptions({
  // `$attrs` are merged under the roving and toggle bindings: the precedence
  // the former `RovingFocusItem` / `Primitive` wrapper gave them.
  inheritAttrs: false,
})

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

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// `ToggleGroupItem` wraps the multi-root `Toggle`, so the parent's scoped-style id
// is not auto-forwarded; pass it through manually so consumer `<style scoped>` works.
const scopeIdAttrs = useForwardScopeId()

// Arrow-key navigation (as a composable; the group handles the keys). A group
// switching `rovingFocus` re-mounts its items, so this is decided once.
const roving = rootContext.rovingFocus.value
  ? useRovingFocusItem({
      element: currentElement,
      focusable: () => !disabled.value,
      active: () => pressed.value,
    })
  : null
</script>

<template>
  <Toggle
    v-bind="mergeProps($attrs, roving ? roving.attrs() : {}, { ...scopeIdAttrs, ...props })"
    :ref="forwardRef"
    v-slot="slotProps"
    :disabled="disabled"
    :model-value="pressed"
    @update:model-value="onTogglePressed"
  >
    <slot v-bind="slotProps" />
  </Toggle>
</template>
