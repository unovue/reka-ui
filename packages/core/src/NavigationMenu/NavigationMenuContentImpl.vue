<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'
import { useCollection } from '@/Collection'

export type NavigationMenuContentImplEmits = DismissableLayerEmits

export interface NavigationMenuContentImplProps extends DismissableLayerProps {}
</script>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useAttrs } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { useForwardElement } from '@/shared'
import { injectNavigationMenuItemContext } from './NavigationMenuItem.vue'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { mergeConsumerListenersFirst, useNavigationMenuContent } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<NavigationMenuContentImplProps>()
const emits = defineEmits<NavigationMenuContentImplEmits>()

const { getItems } = useCollection({ key: 'NavigationMenu' })
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const menuContext = injectNavigationMenuContext()
const itemContext = injectNavigationMenuItemContext()

const {
  content,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onDismiss,
} = useNavigationMenuContent({
  context: menuContext,
  itemContext,
  contentElement: currentElement as Ref<HTMLElement | undefined>,
  getItems: () => getItems().map(i => i.ref),
  emit: emits,
})

// Consumer `@pointerenter` / `@pointerleave` / `@keydown` run before the
// content's own (as on the trigger and in v2). `useAttrs()` is not reactive,
// so this is read during render.
const attrs = useAttrs()
function getContentAttrs() {
  return mergeConsumerListenersFirst(attrs, { ...content.attrs.value, ...props })
}
</script>

<template>
  <DismissableLayer
    v-bind="getContentAttrs()"
    :ref="forwardRef"
    @escape-key-down="onEscapeKeyDown"
    @pointer-down-outside="onPointerDownOutside"
    @focus-outside="onFocusOutside"
    @dismiss="onDismiss"
  >
    <slot />
  </DismissableLayer>
</template>
