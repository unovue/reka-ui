<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, ref, watch, watchPostEffect } from 'vue'
import { useForwardExpose } from '@/shared'
import { injectTabsRootContext } from './TabsRoot.vue'

export interface TabsIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { useMounted, useResizeObserver } from '@vueuse/core'
import { Primitive } from '@/Primitive'

const props = defineProps<TabsIndicatorProps>()
const context = injectTabsRootContext()
defineExpose({
  updateIndicatorStyle,
})
useForwardExpose()

const isMounted = useMounted()

interface IndicatorStyle {
  size: number | null
  thickness: number | null
  position: number | null
}
const indicatorStyle = ref<IndicatorStyle>({
  size: null,
  thickness: null,
  position: null,
})
const tabs = ref<Array<HTMLElement>>([])

watch(() => [context.modelValue.value, context?.dir.value], () => {
  updateIndicatorStyle()
}, { immediate: true, flush: 'post' })

watchPostEffect(() => {
  tabs.value = Array.from(context.tabsList.value?.querySelectorAll<HTMLElement>('[role="tab"]') || [])
})

useResizeObserver(computed(() => [context.tabsList.value, ...tabs.value]), updateIndicatorStyle)

function updateIndicatorStyle() {
  const activeTab = context.tabsList.value?.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]')

  if (!activeTab)
    return

  if (context.orientation.value === 'horizontal') {
    indicatorStyle.value = {
      size: activeTab.offsetWidth,
      thickness: activeTab.offsetHeight,
      position: activeTab.offsetLeft,
    }
  }
  else {
    indicatorStyle.value = {
      size: activeTab.offsetHeight,
      thickness: activeTab.offsetWidth,
      position: activeTab.offsetTop,
    }
  }
}
</script>

<template>
  <Primitive
    v-if="isMounted && typeof indicatorStyle.size === 'number'"
    v-bind="props"
    :style="{
      '--reka-tabs-indicator-size': `${indicatorStyle.size}px`,
      '--reka-tabs-indicator-thickness': `${indicatorStyle.thickness}px`,
      '--reka-tabs-indicator-position': `${indicatorStyle.position}px`,
    }"
  >
    <slot />
  </Primitive>
</template>
