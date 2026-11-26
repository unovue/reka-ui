<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { computed } from 'vue'
import { useForwardElement, useForwardPropsEmits, useHideOthers } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = withDefaults(defineProps<MenuRootContentModalProps>(), { present: true, layerPresent: undefined })
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentModalProps extends MenuRootContentTypeProps {
  /** Internal: whether a kept-mounted content is currently shown. */
  present?: boolean
  /**
   * Internal: whether the dismissal layer and the modal hiding of the page apply. A content
   * that is only still mounted for its exit animation hands them back at once.
   */
  layerPresent?: boolean
}
type MenuRootContentModalEmits = MenuContentImplEmits

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Only while open: a `forceMount`ed content that is closed hides nothing.
// A content kept mounted while closed (`unmountOnHide: false`) hides the page from
// assistive technology only while it is shown.
useHideOthers(computed(() => (props.layerPresent ?? props.present) && menuContext.open.value ? currentElement.value : undefined))
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="menuContext.open.value"
    :disable-outside-pointer-events="menuContext.open.value"
    :disable-outside-scroll="true"
    @dismiss="(details) => menuContext.onOpenChange(false, details.reason, details.event)"
    @focus-outside.prevent
  >
    <slot />
  </MenuContentImpl>
</template>
