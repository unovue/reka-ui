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
import type { PrimitiveProps } from '@/Primitive'
import { computed, getCurrentInstance, mergeProps } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
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

// The content was a `<DismissableLayer>` that rendered its element; the layer
// is a composable on that element now. `layerWrapper` is what the layer
// received, so consumer attrs named after its props and events still
// configure it, and never render. Consumer `@pointerenter` / `@pointerleave` /
// `@keydown` run before the content's own (as on the trigger and in v2).
// (`$attrs` read through the instance proxy tracks.)
const instance = getCurrentInstance()!
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeConsumerListenersFirst(instance.proxy!.$attrs, { ...content.attrs.value, ...props }), {
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onDismiss,
}), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(currentElement as Ref<HTMLElement | undefined>, () => layerWrapper.value))
</script>

<template>
  <component
    :is="renderAs(layerWrapper.props.as as PrimitiveProps['as'], layerWrapper.props.asChild as boolean | undefined)"
    :ref="forwardRef"
    v-bind="mergeProps(layer.attrs(), layerWrapper.rest)"
  >
    <slot />
  </component>
</template>
