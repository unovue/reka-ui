<script setup lang="ts">
import { Icon } from '@iconify/vue'

import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import { Toggle } from '.'

const toggleState = ref<boolean>(false)
const toggleStateOn = ref<boolean>(true)
const toggleStateDefaultOn = ref<boolean>()
const toggleStateDefaultOff = ref<boolean>()

function onChange() {
  // eslint-disable-next-line no-alert
  alert('On Change Event')
}

const { Story } = defineMeta({
  title: 'Toggle/Demo',
})
</script>

<template>
  <Story
    name="chromatic"
    :as-child="true"
  >
    <div class="flex flex-col items-left dark:text-white">
      <h1 class="font-bold text-xl dark:text-white">
        Uncontrolled
      </h1>
      <span class="">default off</span>
      <Toggle
        v-model="toggleState"
        aria-label="Toggle bold"
        class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
      >
        <Icon
          icon="radix-icons:font-bold"
          class="text-black"
        />
      </Toggle>
      <span class="">default on</span>
      <Toggle
        v-model="toggleStateOn"
        :default-value="true"
        aria-label="Toggle bold"
        class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
      >
        <Icon
          icon="radix-icons:font-bold"
          class="text-black"
        />
      </Toggle>

      <h1 class="font-bold text-xl dark:text-white">
        Controlled
      </h1>
      <span class="">default off</span>
      <Toggle
        v-model="toggleStateDefaultOff"
        aria-label="Toggle bold"
        :default-value="false"
        class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
      >
        <Icon
          icon="radix-icons:font-bold"
          class="text-black"
        />
      </Toggle>

      <span class="">default on</span>
      <Toggle
        v-model="toggleStateDefaultOn"
        aria-label="Toggle bold"
        :default-value="true"
        class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
      >
        <Icon
          icon="radix-icons:font-bold"
          class="text-black"
        />
      </Toggle>

      <h1 class="font-bold text-xl dark:text-white">
        Events
      </h1>
      <span class="">@update:modelValue</span>
      <Toggle
        v-model="toggleState"
        aria-label="Toggle bold"
        class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
        @update:model-value="onChange"
      >
        <Icon
          icon="radix-icons:font-bold"
          class="text-black"
        />
      </Toggle>
    </div>
  </Story>
  <Story
    name="Default"
    :as-child="true"
  >
    <Toggle
      v-model="toggleState"
      aria-label="Toggle bold"
      class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
    >
      <Icon
        icon="radix-icons:font-bold"
        class="text-black"
      />
    </Toggle>
  </Story>
  <Story
    name="toggled by default"
    :as-child="true"
  >
    <Toggle
      v-model="toggleStateDefaultOn"
      aria-label="Toggle bold"
      :default-value="true"
      class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
    >
      <Icon
        icon="radix-icons:font-bold"
        class="text-black"
      />
    </Toggle>
  </Story>
  <Story
    name="onPressedChange Event"
    :as-child="true"
  >
    <Toggle
      v-model="toggleState"
      aria-label="Toggle bold"
      class="hover:bg-violet3 color-mauve11 data-[state=on]:bg-violet6 data-[state=on]:text-violet12 shadow-blackA7 flex h-[35px] w-[35px] items-center justify-center rounded bg-white text-base leading-4 shadow-[0_2px_10px] focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
      @update:model-value="onChange"
    >
      <Icon
        icon="radix-icons:font-bold"
        class="text-black"
      />
    </Toggle>
  </Story>
</template>
