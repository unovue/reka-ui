<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { Label } from '.'

const { Story } = defineMeta({
  title: 'Label/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="flex flex-wrap items-center gap-[15px] px-5">
      <Label
        class="text-[15px] font-medium leading-[35px] text-white"
        for="firstName"
      >
        First name
      </Label>
      <input
        id="firstName"
        class="bg-black/50 shadow-black/40 inline-flex h-[35px] w-[200px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none text-white shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-black/80"
        type="text"
        value="Pedro Duarte"
      >
    </div>
  </Story>
</template>
