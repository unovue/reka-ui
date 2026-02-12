<script setup lang="ts">
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaTrack } from '..'

const thumbClass = 'block w-4 h-4 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-full hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_4px] focus:shadow-blackA8'
const trackClass = 'bg-blackA10 block relative w-full h-full'
const regionClass = 'bg-white'
const rootClass = 'relative block select-none touch-none w-[150px] h-[150px]'

function alert(message: string) {
  // eslint-disable-next-line no-alert -- window.alert is available in the browser
  window.alert(message)
}
</script>

<template>
  <Story
    title="SliderArea/Extremes"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="Extreme">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[0, 0], [10000, 10000]]"
        :step-x="500"
        :step-y="500"
        :max-x="10000"
        :max-y="10000"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="0 case">
      <SliderAreaRoot
        :class="rootClass"
        :min-x="-100"
        :max-x="100"
        :min-y="-100"
        :max-y="100"
        :default-value="[[0, 0]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Multiple thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[10, 10], [20, 80], [80, 20], [90, 90]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Out of bound value (negative)">
      <SliderAreaRoot
        :class="rootClass"
        :min-x="0"
        :max-x="100"
        :min-y="0"
        :max-y="100"
        :default-value="[[-9000, -9000]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Out of bound value (positive)">
      <SliderAreaRoot
        :class="rootClass"
        :min-x="0"
        :max-x="100"
        :min-y="0"
        :max-y="100"
        :default-value="[[9000, 9000]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Disabled">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[50, 50]]"
        disabled
      >
        <SliderAreaTrack
          :class="trackClass"
          style="opacity: 0.5;"
        >
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb
          :class="thumbClass"
          style="opacity: 0.5;"
        />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Inside Form">
      <form @submit.prevent="alert('form submitted!')">
        <SliderAreaRoot
          :class="rootClass"
          :default-value="[[0.5, 0.5]]"
          name="slider-area"
          :min-x="0"
          :max-x="1"
          :min-y="0"
          :max-y="1"
          :step-x="0.01"
          :step-y="0.01"
        >
          <SliderAreaTrack :class="trackClass">
            <SliderAreaRegion :class="regionClass" />
          </SliderAreaTrack>
          <SliderAreaThumb :class="thumbClass" />
        </SliderAreaRoot>
        <button>Submit</button>
      </form>
    </Variant>

    <Variant title="Inverted X/Y">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        invert-x
        invert-y
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="RTL">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        dir="rtl"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>
  </Story>
</template>
