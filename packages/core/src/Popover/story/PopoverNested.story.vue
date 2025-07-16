<script setup lang="ts">
import { ref } from 'vue'
import {
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '..'

const buttonRef = ref()
</script>

<template>
  <Story
    title="Popover/Nested"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="relative flex items-center justify-center flex-col h-[300vh]">
        <button
          type="button"
          class="border fixed top-6 left-6 text-white"
          @click="buttonRef.$el.focus()"
        >
          Focus popover button
        </button>

        <PopoverRoot>
          <PopoverTrigger
            ref="buttonRef"
            class="inline-flex items-center justify-center text-violet11 bg-white shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black cursor-default outline-none"
          >
            Open popover
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              side="bottom"
              :side-offset="5"
              class="rounded p-5 w-[260px] shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
              style="background-color: crimson"
            >
              <PopoverRoot>
                <PopoverTrigger class="{triggerClass()}">
                  Open nested popover
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent
                    side="top"
                    align="center"
                    :side-offset="5"
                    :style="{ backgroundColor: 'green' }"
                  >
                    <PopoverClose>close</PopoverClose>
                    <PopoverArrow
                      :width="20"
                      :height="10"
                      :offset="20"
                      :style="{ fill: 'green' }"
                    />
                  </PopoverContent>
                </PopoverPortal>
              </PopoverRoot>

              <PopoverClose
                class="h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 outline-none cursor-default"
                aria-label="Close"
              >
                Close
              </PopoverClose>
              <PopoverArrow style="fill: crimson" />
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>
    </Variant>
  </Story>
</template>
