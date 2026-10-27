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
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsTriggerSurface } from './useTabs'
import { useTabsPartId } from './utils'

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectTabsRootContext()
useTabsPartId(rootContext.customTriggerIds, () => props.value, () => props.id)

// id/aria/data-state + the mousedown/keydown/focus handlers all come from the
// shared surface builder (single source with `useTabs()`); the RovingFocusItem
// wrapper (arrow-key nav) and the tag-dependent `type` stay in the SFC.
const surface = getTabsTriggerSurface(rootContext, () => props.value, () => props.disabled)
</script>

<template>
  <RovingFocusItem
    as-child
    :focusable="!disabled"
    :active="surface.state.value.state === 'checked'"
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :type="as === 'button' ? 'button' : undefined"
      v-bind="{ ...surface.attrs.value, id: props.id || surface.attrs.value.id }"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
