<script setup lang="ts">
import { ref } from 'vue'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaTrack } from '..'

const controlled = ref([{ x: 44, y: 44 }])
const controlledMulti = ref([{ x: 10, y: 10 }, { x: 80, y: 80 }])

const thumbClass = 'block w-4 h-4 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-full hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_4px] focus:shadow-blackA8'
const trackClass = 'bg-blackA10 block relative w-full h-full'
const rangeClass = 'bg-white'
const rootClass = 'relative block select-none touch-none w-[150px] h-[150px]'
</script>

<template>
  <Story
    title="SliderArea/Chromatic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Uncontrolled (Single)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 20, y: 30 }]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Uncontrolled (Two Thumbs)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 10, y: 10 }, { x: 80, y: 80 }]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Controlled">
      <SliderAreaRoot
        v-model="controlled"
        :class="rootClass"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Controlled (Multiple)">
      <SliderAreaRoot
        v-model="controlledMulti"
        :class="rootClass"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="RTL">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 20, y: 30 }]"
        dir="rtl"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Disabled">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 50, y: 50 }]"
        disabled
      >
        <SliderAreaTrack
          :class="trackClass"
          style="opacity: 0.5;"
        >
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb
          :class="thumbClass"
          style="opacity: 0.5;"
        />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Custom Step (10)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 30, y: 60 }]"
        :step-x="10"
        :step-y="10"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Inverted X/Y">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[{ x: 20, y: 30 }]"
        invert-x
        invert-y
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>
  </Story>
</template>
