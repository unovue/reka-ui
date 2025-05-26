<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from '..'
import { ref } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '..'

const props = defineProps<SliderRootProps>()
const emits = defineEmits<SliderRootEmits>()

const sliderValue = ref([50])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SliderRoot
    v-bind="forwarded"
    v-model="sliderValue"
    name="slider"
    class="relative flex items-center select-none touch-none w-[200px] h-5"
  >
    <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
      <SliderRange class="absolute bg-white rounded-full h-full" />
    </SliderTrack>
    <SliderThumb
      class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
    />
  </SliderRoot>
</template>
