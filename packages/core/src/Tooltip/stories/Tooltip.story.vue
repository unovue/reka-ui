<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '..'

const toggleState = ref(false)
const disableTooltip = ref(false)

const scrollItems = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: `Button ${i + 1}`,
}))
</script>

<template>
  <Story
    title="Tooltip/Default"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="py-20">
        <TooltipProvider :disabled="disableTooltip">
          <TooltipRoot v-model:open="toggleState">
            <TooltipTrigger
              class="text-violet11 shadow-blackA7 hover:bg-violet3 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
            >
              <Icon icon="radix-icons:plus" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                :side-offset="5"
                class="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
              >
                Add to library
                <TooltipArrow class="fill-white" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>
    </Variant>
    <Variant title="closeAnimation">
      <div class="py-20">
        <TooltipProvider :disabled="disableTooltip">
          <TooltipRoot v-model:open="toggleState">
            <TooltipTrigger
              class="text-violet11 shadow-blackA7 hover:bg-violet3 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
            >
              <Icon icon="radix-icons:plus" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                :side-offset="5"
                class="data-[state=closed]:animate-fadeOut data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
              >
                Add to library
                <TooltipArrow class="fill-white" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>
    </Variant>

    <Variant title="closeOnAncestorScroll">
      <div class="flex flex-col gap-6 p-8">
        <div>
          <p class="text-mauve11 mb-1 text-[13px] font-medium">
            closeOnAncestorScroll: true (default)
          </p>
          <p class="text-mauve10 mb-3 text-[12px]">
            Hover a button, then scroll horizontally — tooltip closes.
          </p>
          <div class="overflow-x-auto rounded-[6px] border border-mauve6 bg-mauve2 p-4">
            <div
              class="flex gap-3"
              style="width: max-content"
            >
              <TooltipProvider>
                <TooltipRoot
                  v-for="item in scrollItems"
                  :key="item.id"
                >
                  <TooltipTrigger
                    class="text-violet11 shadow-blackA4 hover:bg-violet3 inline-flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_6px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
                  >
                    <Icon icon="radix-icons:plus" />
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent
                      :side-offset="8"
                      class="text-violet11 select-none rounded-[4px] bg-white px-[12px] py-[8px] text-[13px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
                    >
                      {{ item.label }}
                      <TooltipArrow class="fill-white" />
                    </TooltipContent>
                  </TooltipPortal>
                </TooltipRoot>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div>
          <p class="text-mauve11 mb-1 text-[13px] font-medium">
            closeOnAncestorScroll: false
          </p>
          <p class="text-mauve10 mb-3 text-[12px]">
            Hover a button, then scroll horizontally — tooltip stays open.
          </p>
          <div class="overflow-x-auto rounded-[6px] border border-mauve6 bg-mauve2 p-4">
            <div
              class="flex gap-3"
              style="width: max-content"
            >
              <TooltipProvider>
                <TooltipRoot
                  v-for="item in scrollItems"
                  :key="item.id"
                  :close-on-ancestor-scroll="false"
                >
                  <TooltipTrigger
                    class="text-violet11 shadow-blackA4 hover:bg-violet3 inline-flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_6px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
                  >
                    <Icon icon="radix-icons:plus" />
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent
                      :side-offset="8"
                      class="text-violet11 select-none rounded-[4px] bg-white px-[12px] py-[8px] text-[13px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
                    >
                      {{ item.label }}
                      <TooltipArrow class="fill-white" />
                    </TooltipContent>
                  </TooltipPortal>
                </TooltipRoot>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
