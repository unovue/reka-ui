<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <CollapsibleRoot
    v-model:open="open"
    class="w-[300px] text-sm"
  >
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span class="dark:text-white text-stone-800 font-medium leading-[25px]"> @zernonia starred 3 repos </span>
      <CollapsibleTrigger
        class="cursor-default rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-grass11 border outline-none data-[state=closed]:bg-white data-[state=open]:bg-green3 hover:bg-green3 focus:shadow-[0_0_0_2px] focus:shadow-black"
      >
        <Icon
          v-if="open"
          icon="radix-icons:cross-2"
          class="h-3.5 w-3.5"
        />
        <Icon
          v-else
          icon="radix-icons:row-spacing"
          class="h-3.5 w-3.5"
        />
      </CollapsibleTrigger>
    </div>

    <div class="bg-white rounded-lg mt-[10px] p-[10px] border">
      <span class="text-grass11 leading-[25px]">@unovue/reka-ui</span>
    </div>

    <CollapsibleContent class="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
      <div class="bg-white rounded-lg my-[10px] p-[10px] border">
        <span class="text-grass11 leading-[25px]">@vuejs/core</span>
      </div>
      <div class="bg-white rounded-lg my-[10px] p-[10px] border">
        <span class="text-grass11 leading-[25px]">@unovue/primitives</span>
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
