<script lang="ts">
import type { ComponentPublicInstance, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { COLLECTION_ITEM_ATTRS, useCollectionItem } from '@/Collection/Collection'
import { useForwardElement } from '@/shared'

export interface NavigationMenuTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { unrefElement } from '@vueuse/core'
import { mergeProps, onMounted, useAttrs } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectNavigationMenuItemContext } from './NavigationMenuItem.vue'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { mergeConsumerListenersFirst, useNavigationMenuTrigger } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuTriggerProps>(), {
  as: 'button',
})

const menuContext = injectNavigationMenuContext()
const itemContext = injectNavigationMenuItemContext()

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
useCollectionItem(triggerElement, undefined, { key: 'NavigationMenu' })
defineExpose(expose)

const { open, trigger, onFocusProxyFocus } = useNavigationMenuTrigger({
  context: menuContext,
  itemContext,
  disabled: () => props.disabled,
  triggerElement: triggerElement as Ref<HTMLElement | undefined>,
})

onMounted(() => {
  itemContext.triggerRef = triggerElement
})

// Consumer listeners run BEFORE the trigger's own (v2 order). `useAttrs()` is
// not reactive, so this is read during render.
const attrs = useAttrs()
function getTriggerAttrs() {
  return mergeConsumerListenersFirst(attrs, trigger.attrs.value)
}

function setFocusProxyRef(node: Element | ComponentPublicInstance | null) {
  if (!node)
    return undefined
  // @ts-expect-error unrefElement expect MaybeRef, but also support Vnode
  itemContext.focusProxyRef.value = unrefElement(node)
  return undefined
}
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    v-bind="mergeProps(COLLECTION_ITEM_ATTRS, getTriggerAttrs())"
    :ref="forwardRef"
  >
    <slot />
  </component>

  <template v-if="open">
    <VisuallyHidden
      :ref="setFocusProxyRef"
      :tabindex="0"
      @focus="onFocusProxyFocus"
    />
    <span
      v-if="menuContext.viewport"
      :aria-owns="itemContext.contentId"
    />
  </template>
</template>
