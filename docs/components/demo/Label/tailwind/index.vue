<script setup lang="ts">
import { Label } from 'reka-ui'
</script>

<template>
  <div class="flex flex-wrap items-center gap-[15px] px-5">
    <Label
      class="text-sm font-semibold leading-[35px] text-stone-700 dark:text-white"
      for="firstName"
    > First name </Label>
    <input
      id="firstName"
      class="bg-white border inline-flex h-[35px] w-[200px] appearance-none items-center justify-center rounded-lg px-[10px] text-sm leading-none shadow-sm outline-none focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA9"
      type="text"
      value="Pedro Duarte"
    >
  </div>
</template>
