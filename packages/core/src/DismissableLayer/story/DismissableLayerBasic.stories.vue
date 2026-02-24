<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { reactive, ref } from 'vue'
import { FocusScope } from '@/FocusScope'
import { DismissableLayer } from '..'
import DismissableBox from './_DismissableBox.vue'

const open = ref(false)

function handleClick() {
  // eslint-disable-next-line no-console
  console.log('click')
}

const state = reactive({
  isEscapeKeyDownPrevented: false,
  isPointerDownOutsidePrevented: false,
  isFocusOutsidePrevented: false,
})

const openWithFocusScope = ref(false)
const openButtonRef = ref<HTMLElement>()

const { Story } = defineMeta({
  title: 'DismissableLayer/Basic',
  group: 'utilities',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="flex flex-col">
      <button @click="open = !open">
        open
      </button>

      <DismissableLayer
        v-if="open"
        :style="{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          verticalAlign: 'middle',
          width: 400,
          height: 300,
          backgroundColor: 'black',
          borderRadius: 10,
          marginBottom: 20,
        }"
        @dismiss="open = false"
        @escape-key-down="
          (ev) => {
            if (state.isEscapeKeyDownPrevented) ev.preventDefault();
          }
        "
        @pointer-down-outside="
          (ev) => {
            if (state.isPointerDownOutsidePrevented) ev.preventDefault();
          }
        "
        @focus-outside="
          (ev) => {
            if (state.isFocusOutsidePrevented) ev.preventDefault();
          }
        "
      >
        <div class="p-4 bg-gray-400">
          <input type="text">
        </div>
      </DismissableLayer>

      <button @click="handleClick">
        Hey heeey!
      </button>
    </div>
  </Story>

  <Story
    name="Nested"
    :as-child="true"
  >
    <DismissableBox />
  </Story>

  <Story
    name="Focus trap"
    :as-child="true"
  >
    <div class="flex flex-col justify-center">
      <button
        ref="openButtonRef"
        @click="openWithFocusScope = !openWithFocusScope"
      >
        open
      </button>

      <DismissableLayer
        v-if="openWithFocusScope"
        :as-child="true"
        disable-outside-pointer-events
        @dismiss="openWithFocusScope = false"
        @pointer-down-outside="
          (ev) => {
            if (ev.target === openButtonRef) ev.preventDefault();
          }
        "
      >
        <FocusScope
          trapped
          loop
          class="w-[400px] h-[300px] bg-black rounded flex flex-col items-center justify-center"
        >
          <input type="text">
          <input type="text">
          <input type="text">
        </FocusScope>
      </DismissableLayer>
    </div>
  </Story>
</template>
