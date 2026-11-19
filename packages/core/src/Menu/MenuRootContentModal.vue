<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { computed } from 'vue'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = withDefaults(defineProps<MenuRootContentModalProps>(), { present: true })
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentModalProps extends MenuRootContentTypeProps {
  /** Internal: whether a kept-mounted content is currently shown. */
  present?: boolean
}
type MenuRootContentModalEmits = MenuContentImplEmits

const { forwardRef, currentElement } = useForwardExpose()
// A content kept mounted while closed (`unmountOnHide: false`) hides the page from
// assistive technology only while it is shown.
useHideOthers(computed(() => props.present ? currentElement.value : undefined))
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="menuContext.open.value"
    :disable-outside-pointer-events="menuContext.open.value"
    :disable-outside-scroll="true"
    @dismiss="menuContext.onOpenChange(false)"
    @focus-outside.prevent
  >
    <slot />
  </MenuContentImpl>
</template>
