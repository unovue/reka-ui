<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { ref } from 'vue'

const sliderValue = ref([50])
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <SliderRoot
      v-model="sliderValue"
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :max="100"
      :step="1"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>

      <TooltipRoot disable-closing-trigger>
        <TooltipTrigger as-child>
          <SliderThumb
            class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
            aria-label="Volume"
          />
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent
            class="bg-card px-2 py-1 rounded text-foreground text-xs font-semibold border border-muted"
            :side-offset="6"
          >
            {{ sliderValue[0] }}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </SliderRoot>
  </TooltipProvider>
</template>
