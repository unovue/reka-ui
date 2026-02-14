<script setup lang="ts">
import { ref } from 'vue'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from '..'

const controlled = ref([[44, 44]])
const controlledMulti = ref([[10, 10], [80, 80]])

const thumbClass = 'block w-4 h-4 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-full hover:bg-violet3 focus-within:outline-none focus-within:shadow-[0_0_0_4px] focus-within:shadow-blackA8 [&>*]:outline-none'
const trackClass = 'bg-blackA10 block relative w-full h-full rounded-sm'
const rangeClass = 'bg-white rounded-sm'
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
        :default-value="[[20, 30]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Uncontrolled (Two Thumbs)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[10, 10], [80, 80]]"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
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
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
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
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="RTL">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        dir="rtl"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
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
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb
          :class="thumbClass"
          style="opacity: 0.5;"
        >
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Custom Step (10)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[30, 60]]"
        :step-x="10"
        :step-y="10"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Inverted X/Y">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        invert-x
        invert-y
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Thumb Alignment Contain (Single)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        thumb-alignment="contain"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Thumb Alignment Contain (Two Thumbs)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[10, 10], [80, 80]]"
        thumb-alignment="contain"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min X Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-x-steps-between-thumbs="10"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min Y Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-y-steps-between-thumbs="10"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min X/Y Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-x-steps-between-thumbs="10"
        :min-y-steps-between-thumbs="10"
      >
        <SliderAreaTrack :class="trackClass">
          <SliderAreaRegion :class="rangeClass" />
        </SliderAreaTrack>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
        <SliderAreaThumb :class="thumbClass">
          <SliderAreaThumbX />
          <SliderAreaThumbY />
        </SliderAreaThumb>
      </SliderAreaRoot>
    </Variant>
  </Story>
</template>
