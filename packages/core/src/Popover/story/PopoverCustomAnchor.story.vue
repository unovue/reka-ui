<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '..'
</script>

<template>
  <Story
    title="Popover/Custom Anchor"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <PopoverRoot>
        <PopoverAnchor
          class="w-64 bg-gray-500 p-4 flex items-center justify-between"
        >
          Item

          <PopoverTrigger
            class="rounded-full w-[35px] h-[35px] inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black cursor-default outline-none"
            aria-label="Update dimensions"
          >
            <Icon icon="radix-icons:mixer-horizontal" />
          </PopoverTrigger>
        </PopoverAnchor>

        <PopoverPortal>
          <PopoverContent
            side="right"
            :side-offset="1"
            align="start"
            class="rounded p-5 w-[260px] bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
          >
            <PopoverClose
              class="rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 outline-none cursor-default"
              aria-label="Close"
            >
              Close
            </PopoverClose>
            <PopoverArrow class="fill-white" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </Variant>
  </Story>
</template>
