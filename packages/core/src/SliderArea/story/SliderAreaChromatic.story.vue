<script setup lang="ts">
import { ref } from 'vue'
import { SliderAreaArea, SliderAreaRegion, SliderAreaRoot, SliderAreaThumb } from '..'

const controlled = ref([[44, 44]])
const controlledMulti = ref([[10, 10], [80, 80]])

const thumbClass = 'block w-4 h-4 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-full hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_4px] focus:shadow-blackA8'
const areaClass = 'bg-blackA10 block relative w-full h-full rounded-sm'
const regionClass = 'bg-white rounded-sm'
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
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Uncontrolled (Two Thumbs)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[10, 10], [80, 80]]"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Controlled">
      <SliderAreaRoot
        v-model="controlled"
        :class="rootClass"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Controlled (Multiple)">
      <SliderAreaRoot
        v-model="controlledMulti"
        :class="rootClass"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="RTL">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        dir="rtl"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Disabled">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[50, 50]]"
        disabled
      >
        <SliderAreaArea
          :class="areaClass"
          style="opacity: 0.5;"
        >
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb
          :class="thumbClass"
          style="opacity: 0.5;"
        />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Custom Step (10)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[30, 60]]"
        :step-x="10"
        :step-y="10"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Inverted X/Y">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        inverted-x
        inverted-y
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Thumb Alignment Contain (Single)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 30]]"
        thumb-alignment="contain"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Thumb Alignment Contain (Two Thumbs)">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[10, 10], [80, 80]]"
        thumb-alignment="contain"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min X Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-x-steps-between-thumbs="10"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min Y Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-y-steps-between-thumbs="10"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>

    <Variant title="Min X/Y Steps Between Thumbs">
      <SliderAreaRoot
        :class="rootClass"
        :default-value="[[20, 20], [60, 60]]"
        :min-x-steps-between-thumbs="10"
        :min-y-steps-between-thumbs="10"
      >
        <SliderAreaArea :class="areaClass">
          <SliderAreaRegion :class="regionClass" />
        </SliderAreaArea>
        <SliderAreaThumb :class="thumbClass" />
        <SliderAreaThumb :class="thumbClass" />
      </SliderAreaRoot>
    </Variant>
  </Story>
</template>
