<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardElement } from '@/shared'

export interface TabsTriggerProps extends PrimitiveProps {
  /** A unique value that associates the trigger with a content. */
  value: StringOrNumber
  /** When `true`, prevents the user from interacting with the tab. */
  disabled?: boolean
  /**
   * Id of the element, which the content with the same `value` points its
   * `aria-labelledby` at. Defaults to one derived from the Root's id and `value`.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsTriggerSurface } from './useTabs'
import { useTabsPartId } from './utils'

defineOptions({
  // `$attrs` are merged under the roving and trigger bindings: the precedence
  // the former `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'button',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectTabsRootContext()
useTabsPartId(rootContext.customTriggerIds, () => props.value, () => props.id)

// id/aria/data-state + the mousedown/keydown/focus handlers all come from the
// shared surface builder (single source with `useTabs()`); the roving item
// (arrow-key nav, as a composable) and the tag-dependent `type` stay in the SFC.
const surface = getTabsTriggerSurface(rootContext, () => props.value, () => props.disabled)

const roving = useRovingFocusItem({
  element: currentElement,
  focusable: () => !props.disabled,
  active: () => surface.state.value.state === 'checked',
})!

function renderAttrs(attrs: Record<string, unknown>) {
  const own = surface.attrs.value
  return mergeProps(attrs, roving.attrs(), { type: props.as === 'button' ? 'button' : undefined, ...own, id: props.id || own.id })
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="renderAttrs($attrs)"
  >
    <slot />
  </Primitive>
</template>
