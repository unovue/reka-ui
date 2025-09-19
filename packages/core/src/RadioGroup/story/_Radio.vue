<script setup lang="ts">
import Radio from '../Radio.vue'
</script>

<template>
  <div class="flex items-center">
    <Radio
      id="r1"
      aria-label="Default"
      class="bg-white w-[25px] h-[25px] rounded-full shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default data-[disabled]:bg-red-500"
      value="true"
      name="test"
    />
    <label
      class="text-white text-[15px] leading-none pl-[15px]"
      for="r1"
    >
      Default
    </label>
  </div>
</template>
