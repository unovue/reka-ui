<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { useForwardExpose, useForwardPropsEmits, useHideOthers } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = defineProps<MenuRootContentModalProps>()
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentModalProps extends MenuRootContentTypeProps {}
type MenuRootContentModalEmits = MenuContentImplEmits

const { forwardRef, currentElement } = useForwardExpose()
useHideOthers(currentElement)
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :ref="forwardRef"
    :trap-focus="menuContext.open.value"
    :disable-outside-pointer-events="menuContext.open.value"
    :disable-outside-scroll="true"
    @dismiss="menuContext.onOpenChange(false)"
    @pointer-down-outside="emits('pointerDownOutside', $event)"
    @context-menu-outside="emits('contextMenuOutside', $event)"
    @focus-outside.prevent="emits('focusOutside', $event)"
  >
    <slot />
  </MenuContentImpl>
</template>
