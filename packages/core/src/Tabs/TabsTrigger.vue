<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { disabledAttr, useForwardExpose } from '@/shared'

export interface TabsTriggerProps extends PrimitiveProps {
  /** A unique value that associates the trigger with a content. */
  value: StringOrNumber
  /** When `true`, prevents the user from interacting with the tab. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { useSelectorKey } from '@/shared/createKeyedSelector'
import { useAgentItem } from '@/shared/useAgentRegistration'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId, makeTriggerId, useTabsPartId } from './utils'

defineOptions({
  // `$attrs` are merged under the roving and the trigger's own bindings, the precedence the
  // `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'button',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectTabsRootContext()
useAgentItem(rootContext, props, currentElement)

const triggerId = useTabsPartId(rootContext.triggerIds, props, currentElement, () => makeTriggerId(rootContext.baseId, props.value))
const contentId = computed(() => rootContext.contentIds.value.has(props.value)
  ? rootContext.renderedContentIds.value.get(props.value) ?? makeContentId(rootContext.baseId, props.value)
  : undefined)

const isSelected = useSelectorKey(rootContext.selection, () => props.value)

const roving = useRovingFocusItem({
  element: currentElement,
  focusable: () => !props.disabled,
  active: isSelected,
})
</script>

<template>
  <Primitive
    v-bind="mergeProps($attrs, roving.attrs())"
    :id="triggerId"
    :ref="forwardRef"
    role="tab"
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="asChild"
    :aria-selected="isSelected() ? 'true' : 'false'"
    :aria-controls="contentId"
    :data-state="isSelected() ? 'active' : 'inactive'"
    :disabled="disabledAttr(disabled, props.as, props.asChild)"
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
      if (!isSelected() && !disabled && isAutomaticActivation) {
        rootContext.changeModelValue(value);
      }
    }"
  >
    <slot />
  </Primitive>
</template>
