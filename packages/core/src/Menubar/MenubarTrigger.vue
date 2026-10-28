<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface MenubarTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { mergeProps, onMounted } from 'vue'
import { useCollectionItem } from '@/Collection'
import { MenuAnchor } from '@/Menu'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { injectMenubarMenuContext } from './MenubarMenu.vue'
import { injectMenubarRootContext } from './MenubarRoot.vue'
import { createMenubarTriggerSurface } from './useMenubar'

defineOptions({
  // `$attrs` are merged under the roving and part bindings: the precedence
  // the former `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<MenubarTriggerProps>(), {
  as: 'button',
})
const rootContext = injectMenubarRootContext()
const menuContext = injectMenubarMenuContext()

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)
// The menubar's trigger collection, registered from setup (no wrapper).
useCollectionItem(triggerElement, undefined, { key: 'Menubar' })

// role/aria, `data-highlighted`/`data-state`/`data-disabled`, the `data-value`
// selector and the pointer/keyboard handlers come from the composable;
// MenuAnchor stays the wrapper.
const trigger = createMenubarTriggerSurface(rootContext, menuContext, {
  disabled: () => props.disabled,
  triggerElement,
})

onMounted(() => {
  menuContext.triggerElement = triggerElement
})

// Arrow-key navigation (as a composable; the menubar handles the keys).
const roving = useRovingFocusItem({
  element: triggerElement,
  tabStopId: () => menuContext.value,
  focusable: () => !props.disabled,
})!
</script>

<template>
  <MenuAnchor
    v-bind="mergeProps($attrs, roving.attrs())"
    as-child
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined"
      v-bind="trigger.attrs.value"
    >
      <slot />
    </component>
  </MenuAnchor>
</template>
