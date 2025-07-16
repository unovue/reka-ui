<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Toggle } from 'reka-ui'
import { ref } from 'vue'

const toggleState = ref(false)
</script>

<template>
  <Toggle
    v-model="toggleState"
    aria-label="Toggle italic"
    class="hover:bg-stone-50 text-stone-700 data-[state=on]:bg-stone-100 shadow-sm flex h-[35px] w-[35px] items-center justify-center rounded-lg border bg-white text-base leading-4 focus-within:outline-none focus-within:shadow-[0_0_0_2px] focus-within:shadow-black"
  >
    <Icon
      icon="radix-icons:font-italic"
      class="w-[15px] h-[15px]"
    />
  </Toggle>
</template>
