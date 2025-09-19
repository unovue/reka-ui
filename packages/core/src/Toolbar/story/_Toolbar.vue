<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '..'

const toggleStateSingle = ref('center')
const toggleStateMultiple = ref([])
</script>

<template>
  <ToolbarRoot
    class="flex p-[10px] w-full min-w-max rounded-md bg-white shadow-[0_2px_10px] shadow-blackA7"
    aria-label="Formatting options"
  >
    <ToolbarToggleGroup
      v-model="toggleStateMultiple"
      type="multiple"
      aria-label="Text formatting"
    >
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="bold"
        aria-label="Bold"
      >
        <Icon icon="radix-icons:font-bold" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="italic"
        aria-label="Italic"
      >
        <Icon icon="radix-icons:font-italic" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="strikethrough"
        aria-label="Strike through"
      >
        <Icon icon="radix-icons:strikethrough" />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator class="w-[1px] bg-mauve6 mx-[10px]" />
    <ToolbarToggleGroup
      v-model="toggleStateSingle"
      type="single"
      aria-label="Text Alignment"
    >
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="left"
        aria-label="Left Aligned"
      >
        <Icon icon="radix-icons:text-align-left" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="center"
        aria-label="Center Aligned"
      >
        <Icon icon="radix-icons:text-align-center" />
      </ToolbarToggleItem>
      <ToolbarToggleItem
        class="flex-shrink-0 flex-grow-0 basis-auto text-mauve11 h-[25px] px-[5px] rounded inline-flex text-[13px] leading-none items-center justify-center bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
        value="right"
        aria-label="Right Aligned"
      >
        <Icon icon="radix-icons:text-align-right" />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator class="w-[1px] bg-mauve6 mx-[10px]" />
    <ToolbarLink
      class="bg-transparent text-mauve11 inline-flex justify-center items-center hover:bg-transparent hover:cursor-pointer flex-shrink-0 flex-grow-0 basis-auto h-[25px] px-[5px] rounded text-[13px] leading-none bg-white ml-0.5 outline-none hover:bg-violet3 hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 first:ml-0 data-[state=on]:bg-violet5 data-[state=on]:text-violet11"
      href="#"
      target="_blank"
      style="margin-right: 10"
    >
      Edited 2 hours ago
    </ToolbarLink>
    <ToolbarButton
      class="px-[10px] text-white bg-violet9 flex-shrink-0 flex-grow-0 basis-auto h-[25px] rounded inline-flex text-[13px] leading-none items-center justify-center outline-none hover:bg-violet10 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7"
      style="margin-left: auto"
    >
      Share
    </ToolbarButton>
  </ToolbarRoot>
</template>
