<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '..'

function alert(message: string) {
  alert(message)
}

const { Story } = defineMeta({
  title: 'Slider/Extremes',
})
</script>

<template>
  <Story
    name="Extreme"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :default-value="[0, 1000]"
      :step="500"
      :max="10000"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="0 case"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :min="-100"
      :max="100"
      :default-value="[0]"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="Multiple range"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :default-value="[10, 20, 30, 80]"
      :min-steps-between-thumbs="10"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="Vertical"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex justify-center items-center select-none touch-none w-5 h-[100px]"
      orientation="vertical"
    >
      <SliderTrack class="bg-blackA10 relative rounded-full w-[3px] h-full">
        <SliderRange class="absolute bg-white rounded-full w-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="Out of bound value (negative)"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :min="0"
      :max="100"
      :default-value="[-9000]"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="Out of bound value (positive)"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :min="0"
      :max="100"
      :default-value="[9000]"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>

  <Story
    name="Disabled"
    :as-child="true"
  >
    <SliderRoot
      class="relative flex items-center select-none touch-none w-[200px] h-5"
      :disabled="true"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
      />
    </SliderRoot>
  </Story>
  <Story
    name="Inside Form"
    :as-child="true"
  >
    <form @submit.prevent="alert('form submitted!')">
      <SliderRoot
        :default-value="[0.12]"
        name="slider"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :min="0"
        :max="1"
        :step="0.01"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
      <button>Submit</button>
    </form>
  </Story>
</template>
