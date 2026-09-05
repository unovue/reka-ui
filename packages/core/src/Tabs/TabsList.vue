<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface TabsListProps extends PrimitiveProps {
  /** When `true`, keyboard navigation will loop from last tab to first, and vice versa. */
  loop?: boolean
}
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsListSurface } from './useTabs'

const props = withDefaults(defineProps<TabsListProps>(), {
  loop: true,
})
const { loop } = toRefs(props)

const { forwardRef, currentElement } = useForwardExpose()
const context = injectTabsRootContext()

context.tabsList = currentElement

// role/aria-orientation come from the shared list surface (single source with
// `useTabs().list`); the RovingFocusGroup wrapper (arrow-key nav) stays in the SFC.
const surface = getTabsListSurface(context)
</script>

<template>
  <RovingFocusGroup
    as-child
    :orientation="context.orientation.value"
    :dir="context.dir.value"
    :loop="loop"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="surface.attrs.value"
    >
      <slot />
    </Primitive>
  </RovingFocusGroup>
</template>
