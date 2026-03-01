<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '..'
</script>

<template>
  <Story
    title="Popover/ProgrammaticClose"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="relative flex items-center justify-center flex-col">
        <PopoverRoot v-slot="{ close: closeA }">
          <PopoverTrigger
            class="rounded-full w-[35px] h-[35px] inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black cursor-default outline-none"
            aria-label="Open popover 1"
          >
            <button>
              <Icon icon="radix-icons:mixer-horizontal" />
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              side="bottom"
              :side-offset="5"
              class="rounded p-5 w-[260px] bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
            >
              First Popover
              <button
                aria-label="Close"
                class="rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 absolute top-[5px] right-[5px] hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 outline-none cursor-default"
                @click="closeA"
              >
                <Icon icon="radix-icons:cross-2" />
              </button>

              <PopoverRoot v-slot="{ close: closeB }">
                <PopoverTrigger
                  aria-label="Open popover 2"
                >
                  Open nested popover
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent
                    side="top"
                    align="center"
                    :side-offset="5"
                    class="rounded p-5 w-[260px] bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
                  >
                    Second popover
                    <button
                      aria-label="Close"
                      class="rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 absolute top-[5px] right-[5px] hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 outline-none cursor-default"
                      @click="closeB"
                    >
                      <Icon icon="radix-icons:cross-2" />
                    </button>
                    <PopoverArrow
                      :width="20"
                      :height="10"
                      :offset="20"
                      :style="{ fill: 'green' }"
                    />
                  </PopoverContent>
                </PopoverPortal>
              </PopoverRoot>

              <PopoverArrow style="fill: crimson" />
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>
    </Variant>
  </Story>
</template>
