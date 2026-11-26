<script setup lang="ts">
import type { MenuContentImplEmits, MenuRootContentTypeProps } from './MenuContentImpl.vue'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import MenuContentImpl from './MenuContentImpl.vue'
import { injectMenuContext } from './MenuRoot.vue'

const props = withDefaults(defineProps<MenuRootContentNonModalProps>(), { present: true, layerPresent: undefined })
const emits = defineEmits<MenuRootContentModalEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()

interface MenuRootContentNonModalProps extends MenuRootContentTypeProps {
  /** Internal: whether a kept-mounted content is currently shown. */
  present?: boolean
  /**
   * Internal: whether the dismissal layer and the modal hiding of the page apply. A content
   * that is only still mounted for its exit animation hands them back at once.
   */
  layerPresent?: boolean
}
type MenuRootContentModalEmits = MenuContentImplEmits

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <MenuContentImpl
    :ref="forwardRef"
    v-bind="forwarded"
    :trap-focus="false"
    :disable-outside-pointer-events="false"
    :disable-outside-scroll="false"
    @dismiss="(details) => menuContext.onOpenChange(false, details.reason, details.event)"
  >
    <slot />
  </MenuContentImpl>
</template>
