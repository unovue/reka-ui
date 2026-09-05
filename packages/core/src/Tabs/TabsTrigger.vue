<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardExpose } from '@/shared'

export interface TabsTriggerProps extends PrimitiveProps {
  /** A unique value that associates the trigger with a content. */
  value: StringOrNumber
  /** When `true`, prevents the user from interacting with the tab. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsTriggerSurface } from './useTabs'

const props = withDefaults(defineProps<TabsTriggerProps>(), {
  disabled: false,
  as: 'button',
})

const { forwardRef } = useForwardExpose()
const rootContext = injectTabsRootContext()

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
      v-bind="surface.attrs.value"
    >
      <slot />
    </Primitive>
  </RovingFocusItem>
</template>
