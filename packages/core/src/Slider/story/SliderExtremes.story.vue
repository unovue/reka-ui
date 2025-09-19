<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '..'

function alert(message: string) {
  alert(message)
}
</script>

<template>
  <Story
    title="Slider/Extremes"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Extreme">
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
    </Variant>

    <Variant title="0 case">
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
    </Variant>

    <Variant title="Multiple range">
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
    </Variant>

    <Variant title="Vertical">
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
    </Variant>

    <Variant title="Out of bound value (negative)">
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
    </Variant>

    <Variant title="Out of bound value (positive)">
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
    </Variant>

    <Variant title="Disabled">
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
    </Variant>
    <Variant title="Inside Form">
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
    </Variant>
  </Story>
</template>
