<script setup lang="ts">
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { ref } from 'vue'

const hoverState = ref(false)
</script>

<template>
  <HoverCardRoot v-model:open="hoverState">
    <HoverCardTrigger
      class="inline-block cursor-pointer rounded-full outline-none focus:shadow-[0_0_0_2px] focus:shadow-green8 shadow-sm"
      href="https://twitter.com/unovue"
      target="_blank"
      rel="noreferrer noopener"
    >
      <img
        class="block h-[45px] w-[45px] rounded-full"
        src="https://pbs.twimg.com/profile_images/1833445381986045952/jwoHkIIq_400x400.jpg"
        alt="Unovue"
      >
    </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        class="data-[side=bottom]:animate-slideUpAndFade data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slideDownAndFade w-[300px] rounded-xl bg-white p-5 data-[state=open]:transition-all border shadow-sm z-10"
        :side-offset="5"
      >
        <div class="flex flex-col gap-[7px]">
          <img
            class="block h-[60px] w-[60px] rounded-full"
            src="https://pbs.twimg.com/profile_images/1833445381986045952/jwoHkIIq_400x400.jpg"
            alt="Unovue"
          >
          <div class="flex flex-col gap-[15px]">
            <div>
              <div class="text-mauve12 m-0 text-sm font-medium leading-[1.5]">
                Unovue
              </div>
              <div class="text-mauve10 m-0 text-sm leading-[1.5]">
                @unovue
              </div>
            </div>
            <div class="text-mauve12 m-0 text-sm leading-[1.5]">
              Components, icons, colors, and templates for building high-quality, accessible UI. Free and open-source.
            </div>
            <div class="flex gap-[15px]">
              <div class="flex gap-[5px]">
                <div class="text-mauve12 m-0 text-sm font-medium leading-[1.5]">
                  0
                </div>
                <div class="text-mauve10 m-0 text-sm leading-[1.5]">
                  Following
                </div>
              </div>
              <div class="flex gap-[5px]">
                <div class="text-mauve12 m-0 text-sm font-medium leading-[1.5]">
                  2,900
                </div>
                <div class="text-mauve10 m-0 text-sm leading-[1.5]">
                  Followers
                </div>
              </div>
            </div>
          </div>
        </div>

        <HoverCardArrow
          class="fill-white stroke-gray-300 -mt-[1px]"
          :width="12"
          :height="6"
        />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
