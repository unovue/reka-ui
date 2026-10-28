<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface NavigationMenuListProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { mergeProps, onMounted } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectNavigationMenuContext } from './NavigationMenuRoot.vue'
import { getNavigationMenuListSurface } from './useNavigationMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<NavigationMenuListProps>(), {
  as: 'ul',
})

const menuContext = injectNavigationMenuContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const list = getNavigationMenuListSurface(menuContext)

onMounted(() => {
  menuContext.onIndicatorTrackChange(currentElement.value)
})
</script>

<template>
  <div
    :ref="forwardRef"
    style="position: relative"
  >
    <component
      :is="renderAs(as, props.asChild)"
      v-bind="mergeProps(list.attrs.value, $attrs)"
    >
      <slot />
    </component>
  </div>
</template>
