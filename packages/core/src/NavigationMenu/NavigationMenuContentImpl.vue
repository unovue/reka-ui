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
import { DismissableLayer } from '@/DismissableLayer'
import { useForwardElement } from '@/shared'
import { injectNavigationMenuItemContext } from './NavigationMenuItem.vue'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { useNavigationMenuContent } from './useNavigationMenu'

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
</script>

<template>
  <DismissableLayer
    v-bind="{ ...content.attrs.value, ...props }"
    :ref="forwardRef"
    @escape-key-down="onEscapeKeyDown"
    @pointer-down-outside="onPointerDownOutside"
    @focus-outside="onFocusOutside"
    @dismiss="onDismiss"
  >
    <slot />
  </DismissableLayer>
</template>
