<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface TabsListProps extends PrimitiveProps {
  /** When `true`, keyboard navigation will loop from last tab to first, and vice versa. */
  loop?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsListSurface } from './useTabs'

defineOptions({
  // `$attrs` are merged under the roving and list bindings: the precedence
  // the former `<RovingFocusGroup as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TabsListProps>(), {
  loop: true,
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const context = injectTabsRootContext()

context.tabsList = currentElement

// role/aria-orientation come from the shared list surface (single source with
// `useTabs().list`); arrow-key navigation is the roving group composable.
const surface = getTabsListSurface(context)
const roving = useRovingFocusGroup({
  consumerAttrs: true,
  element: currentElement,
  orientation: () => context.orientation.value,
  dir: () => context.dir.value,
  loop: () => props.loop,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps(roving.consumerAttrs($attrs), roving.attrs(), surface.attrs.value)"
  >
    <slot />
  </component>
</template>
