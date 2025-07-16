<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="rounded-full w-[35px] h-[35px] inline-flex items-center justify-center text-grass11 bg-white shadow-sm border hover:bg-stone-50 cursor-default focus:shadow-[0_0_0_2px]  focus:shadow-black dark:focus:shadow-green8 focus:outline-none "
      aria-label="Update dimensions"
    >
      <Icon icon="radix-icons:mixer-horizontal" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="bottom"
        :side-offset="5"
        class="rounded-lg p-5 w-[260px] bg-white shadow-sm border will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
      >
        <div class="flex flex-col gap-2.5">
          <p class="text-mauve12 text-sm leading-[19px] font-semibold mb-2.5">
            Dimensions
          </p>
          <fieldset class="flex gap-5 items-center">
            <label
              class="text-xs text-grass11 w-[75px]"
              for="width"
            > Width </label>
            <input
              id="width"
              class="w-full inline-flex bg-stone-50 items-center justify-center flex-1 rounded px-2.5 text-xs leading-none text-grass11 shadow-[0_0_0_1px] shadow-green7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-green8 outline-none"
              defaultValue="100%"
            >
          </fieldset>
          <fieldset class="flex gap-5 items-center">
            <label
              class="text-xs text-grass11 w-[75px]"
              for="maxWidth"
            > Max. width </label>
            <input
              id="maxWidth"
              class="w-full inline-flex bg-stone-50 items-center justify-center flex-1 rounded px-2.5 text-xs leading-none text-grass11 shadow-[0_0_0_1px] shadow-green7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-green8 outline-none"
              defaultValue="300px"
            >
          </fieldset>
          <fieldset class="flex gap-5 items-center">
            <label
              class="text-xs text-grass11 w-[75px]"
              for="height"
            > Height </label>
            <input
              id="height"
              class="w-full inline-flex bg-stone-50 items-center justify-center flex-1 rounded px-2.5 text-xs leading-none text-grass11 shadow-[0_0_0_1px] shadow-green7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-green8 outline-none"
              defaultValue="25px"
            >
          </fieldset>
          <fieldset class="flex gap-5 items-center">
            <label
              class="text-xs text-grass11 w-[75px]"
              for="maxHeight"
            > Max. height </label>
            <input
              id="maxHeight"
              class="w-full inline-flex bg-stone-50 items-center justify-center flex-1 rounded px-2.5 text-xs leading-none text-grass11 shadow-[0_0_0_1px] shadow-green7 h-[25px] focus:shadow-[0_0_0_2px] focus:shadow-green8 outline-none"
              defaultValue="none"
            >
          </fieldset>
        </div>
        <PopoverClose
          class="rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-grass11 absolute top-[8px] right-[8px] hover:bg-green4 focus:shadow-[0_0_0_2px] focus:shadow-green7 outline-none cursor-default"
          aria-label="Close"
        >
          <Icon icon="radix-icons:cross-2" />
        </PopoverClose>
        <PopoverArrow class="fill-white stroke-gray-200" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
