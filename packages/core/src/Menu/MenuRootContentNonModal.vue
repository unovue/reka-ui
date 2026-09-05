<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { useForwardPropsEmits } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = defineProps<MenuRootContentNonModalProps>()
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentNonModalProps extends MenuRootContentTypeProps {}
type MenuRootContentModalEmits = MenuContentImplEmits
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    :disable-outside-scroll="false"
    @dismiss="(details) => menuContext.onOpenChange(false, details.reason, details.event)"
  >
    <slot />
  </MenuContentImpl>
</template>
