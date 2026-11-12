<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardExpose, useTriggerId } from '@/shared'

export interface TabsTriggerProps extends PrimitiveProps {
  /** A unique value that associates the trigger with a content. */
  value: StringOrNumber
  /** When `true`, prevents the user from interacting with the tab. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId, makeTriggerId } from './utils'

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'button',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectTabsRootContext()

const triggerId = computed(() => rootContext.triggerIds.value.get(props.value) ?? makeTriggerId(rootContext.baseId, props.value))
// Only an id that differs from the generated one is registered, under the trigger's
// current value.
let registeredValue: StringOrNumber | undefined
useTriggerId({
  get triggerId() {
    return triggerId.value
  },
  set triggerId(id) {
    if (registeredValue !== undefined && registeredValue !== props.value)
      rootContext.triggerIds.value.delete(registeredValue)
    registeredValue = props.value
    rootContext.triggerIds.value.set(props.value, id)
  },
}, currentElement)
watch(() => props.value, (value) => {
  if (registeredValue === undefined || registeredValue === value)
    return
  const id = rootContext.triggerIds.value.get(registeredValue)
  rootContext.triggerIds.value.delete(registeredValue)
  registeredValue = value
  if (id)
    rootContext.triggerIds.value.set(value, id)
}, { flush: 'sync' })
onBeforeUnmount(() => {
  if (registeredValue !== undefined)
    rootContext.triggerIds.value.delete(registeredValue)
})
const contentId = computed(() => rootContext.contentIds.value.has(props.value) ? makeContentId(rootContext.baseId, props.value) : undefined)

const isSelected = computed(() => props.value === rootContext.modelValue.value)
</script>

<template>
  <RovingFocusItem
    as-child
    :focusable="!disabled"
    :active="isSelected"
  >
    <Primitive
      :id="triggerId"
      :ref="forwardRef"
      role="tab"
      :type="as === 'button' ? 'button' : undefined"
      :as="as"
      :as-child="asChild"
      :aria-selected="isSelected ? 'true' : 'false'"
      :aria-controls="contentId"
      :data-state="isSelected ? 'active' : 'inactive'"
      :disabled="disabled"
      :data-disabled="disabled ? '' : undefined"
      :data-orientation="rootContext.orientation.value"
      @mousedown="(event: MouseEvent) => {
        if (event.defaultPrevented) return;
        // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
        // but not when the control key is pressed (avoiding MacOS right click)
        if (!disabled && event.button === 0 && event.ctrlKey === false) {
          rootContext.changeModelValue(value);
        }
        else {
          // prevent focus to avoid accidental activation
          event.preventDefault();
        }
      }"
      @keydown.enter.space="(event: KeyboardEvent) => {
        if (!event.defaultPrevented) rootContext.changeModelValue(value);
      }"
      @focus="() => {
        // handle 'automatic' activation if necessary
        // ie. activate tab following focus
        const isAutomaticActivation = rootContext.activationMode !== 'manual';
        if (!isSelected && !disabled && isAutomaticActivation) {
          rootContext.changeModelValue(value);
        }
      }"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
