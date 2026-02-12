<script setup lang="ts">
import type { SliderAreaPoint, SliderAreaRootEmits, SliderAreaRootProps } from '..'
import { ref } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaTrack } from '..'

const props = withDefaults(defineProps<SliderAreaRootProps>(), {
  invertX: false,
  invertY: false,
})
const emits = defineEmits<SliderAreaRootEmits>()

const sliderValue = ref<SliderAreaPoint[]>([[50, 50]])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SliderAreaRoot
    v-bind="forwarded"
    v-model="sliderValue"
    name="slider-area"
    class="relative block select-none touch-none w-[200px] h-[200px]"
  >
    <SliderAreaTrack class="bg-blackA10 block relative w-full h-full rounded-md">
      <SliderAreaRegion class="bg-white/25 rounded-sm" />
    </SliderAreaTrack>
    <SliderAreaThumb
      class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
    />
  </SliderAreaRoot>
</template>
