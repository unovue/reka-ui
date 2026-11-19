<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { useForwardPropsEmits } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = withDefaults(defineProps<MenuRootContentNonModalProps>(), { present: true })
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentNonModalProps extends MenuRootContentTypeProps {
  /** Internal: whether a kept-mounted content is currently shown. */
  present?: boolean
}
type MenuRootContentModalEmits = MenuContentImplEmits
</script>

<template>
  <MenuContentImpl
    v-bind="forwarded"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    :disable-outside-scroll="false"
    @dismiss="menuContext.onOpenChange(false)"
  >
    <slot />
  </MenuContentImpl>
</template>
