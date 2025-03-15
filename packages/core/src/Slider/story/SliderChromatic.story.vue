<script setup lang="ts">
import { ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '..'

const controlledLtr = ref([44])
const controlledLtrMulti = ref([10, 30])
const controlledRtl = ref([44])
const controlledRtlMulti = ref([10, 30])
</script>

<template>
  <Story
    title="Slider/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Uncontrolled (LTR)">
      <SliderRoot
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :default-value="[20]"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>
    <Variant title="Uncontrolled (Multiple) ">
      <SliderRoot
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :default-value="[10, 30]"
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

    <Variant title="Uncontrolled (RTL) ">
      <SliderRoot
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :default-value="[20]"
        dir="rtl"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>
    <Variant title="Uncontrolled (Multiple RTL) ">
      <SliderRoot
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :default-value="[10, 30]"
        dir="rtl"
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

    <Variant title="Uncontrolled (Multiples)">
      <SliderRoot
        class="relative flex items-center select-none touch-none w-[200px] h-5"
        :default-value="[10, 15, 20, 80]"
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

    <Variant title="Controlled">
      <SliderRoot
        v-model="controlledLtr"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>

    <Variant title="Controlled (Multiple)">
      <SliderRoot
        v-model="controlledLtrMulti"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
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

    <Variant title="Controlled (RTL)">
      <SliderRoot
        v-model="controlledRtl"
        dir="rtl"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>

    <Variant title="Controlled (Multiple RTL)">
      <SliderRoot
        v-model="controlledRtlMulti"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
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

    <Variant title="Overflow">
      <SliderRoot
        :default-value="[50]"
        thumb-alignment="overflow"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>

    <Variant title="Overflow (RTL)">
      <SliderRoot
        :default-value="[50]"
        thumb-alignment="overflow"
        dir="rtl"
        class="relative flex items-center select-none touch-none w-[200px] h-5"
      >
        <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
          <SliderRange class="absolute bg-white rounded-full h-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>

    <Variant title="Vertical Overflow">
      <SliderRoot
        class="relative flex justify-center items-center select-none touch-none w-5 h-[100px]"
        :default-value="[50]"
        thumb-alignment="overflow"
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

    <Variant title="Vertical Overflow (Inverted)">
      <SliderRoot
        class="relative flex justify-center items-center select-none touch-none w-5 h-[100px]"
        :default-value="[50]"
        thumb-alignment="overflow"
        orientation="vertical"
        :inverted="true"
      >
        <SliderTrack class="bg-blackA10 relative rounded-full w-[3px] h-full">
          <SliderRange class="absolute bg-white rounded-full w-full" />
        </SliderTrack>
        <SliderThumb
          class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        />
      </SliderRoot>
    </Variant>
  </Story>
</template>
