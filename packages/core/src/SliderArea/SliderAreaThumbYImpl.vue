<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { injectSliderAreaRootContext } from './SliderAreaRoot.vue'
import { injectSliderAreaThumbGroupContext } from './utils'

const rootContext = injectSliderAreaRootContext()
const groupContext = injectSliderAreaThumbGroupContext()
const thumbElement = ref<HTMLElement>()

const value = computed(() => rootContext.modelValue?.value?.[groupContext.index.value])

onMounted(() => {
  if (thumbElement.value)
    rootContext.thumbYElements.value.push(thumbElement.value)
})
onUnmounted(() => {
  const i = rootContext.thumbYElements.value.findIndex(el => el === thumbElement.value)
  if (i >= 0)
    rootContext.thumbYElements.value.splice(i, 1)
})
</script>

<template>
  <span
    :ref="(el: any) => { thumbElement = el?.$el ?? el }"
    role="slider"
    :tabindex="rootContext.disabled.value ? undefined : (rootContext.activeDirection.value === 'y' ? 0 : -1)"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    aria-orientation="vertical"
    :aria-valuenow="value ? value[1] : undefined"
    :aria-valuemin="rootContext.minY.value"
    :aria-valuemax="rootContext.maxY.value"
    :style="{
      position: 'absolute',
      display: 'block',
      width: '100%',
      height: '100%',
    }"
    @focus="() => {
      rootContext.valueIndexToChangeRef.value = groupContext.index.value
      rootContext.activeDirection.value = 'y'
    }"
  />
</template>
