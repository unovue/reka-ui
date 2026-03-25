<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '..'
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '../../Tooltip'

const items = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`,
}))
</script>

<template>
  <Story
    title="Dialog/With Scrollable Tooltip"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="closeOnAncestorScroll (default: true)">
      <div class="flex items-center justify-center p-8">
        <TooltipProvider>
          <DialogRoot>
            <DialogTrigger
              class="text-violet11 shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
            >
              Open Dialog
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="bg-blackA9 fixed inset-0" />
              <DialogContent
                class="fixed top-[50%] left-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
              >
                <div class="flex items-center justify-between border-b border-mauve6 px-6 py-4">
                  <DialogTitle class="text-mauve12 text-[17px] font-medium">
                    Scrollable list
                  </DialogTitle>
                  <DialogClose
                    class="text-mauve11 hover:bg-mauve4 inline-flex h-[25px] w-[25px] items-center justify-center rounded-full focus:outline-none"
                    aria-label="Close"
                  >
                    <Icon icon="lucide:x" />
                  </DialogClose>
                </div>

                <p class="text-mauve11 px-6 py-2 text-[13px]">
                  Hover an item to open its tooltip, then scroll — the tooltip will close automatically.
                </p>

                <div class="max-h-[320px] overflow-y-auto px-6 pb-6">
                  <ul class="flex flex-col gap-2 pt-2">
                    <li
                      v-for="item in items"
                      :key="item.id"
                      class="flex items-center justify-between rounded-[4px] border border-mauve6 px-4 py-3"
                    >
                      <span class="text-mauve12 text-[14px]">{{ item.name }}</span>
                      <TooltipRoot>
                        <TooltipTrigger
                          class="text-mauve11 hover:bg-mauve4 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full focus:outline-none"
                          :aria-label="`Info about ${item.name}`"
                        >
                          <Icon
                            icon="lucide:info"
                            class="h-4 w-4"
                          />
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent
                            side="left"
                            :side-offset="8"
                            class="text-mauve12 select-none rounded-[4px] bg-white px-[12px] py-[8px] text-[13px] leading-normal shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
                          >
                            {{ item.description }}
                            <TooltipArrow class="fill-white" />
                          </TooltipContent>
                        </TooltipPortal>
                      </TooltipRoot>
                    </li>
                  </ul>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </TooltipProvider>
      </div>
    </Variant>

    <Variant title="closeOnAncestorScroll: false (stays open on scroll)">
      <div class="flex items-center justify-center p-8">
        <TooltipProvider>
          <DialogRoot>
            <DialogTrigger
              class="text-violet11 shadow-blackA7 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none"
            >
              Open Dialog
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="bg-blackA9 fixed inset-0" />
              <DialogContent
                class="fixed top-[50%] left-[50%] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
              >
                <div class="flex items-center justify-between border-b border-mauve6 px-6 py-4">
                  <DialogTitle class="text-mauve12 text-[17px] font-medium">
                    Scrollable list
                  </DialogTitle>
                  <DialogClose
                    class="text-mauve11 hover:bg-mauve4 inline-flex h-[25px] w-[25px] items-center justify-center rounded-full focus:outline-none"
                    aria-label="Close"
                  >
                    <Icon icon="lucide:x" />
                  </DialogClose>
                </div>

                <p class="text-mauve11 px-6 py-2 text-[13px]">
                  Hover an item to open its tooltip, then scroll — the tooltip will stay open (legacy behavior).
                </p>

                <div class="max-h-[320px] overflow-y-auto px-6 pb-6">
                  <ul class="flex flex-col gap-2 pt-2">
                    <li
                      v-for="item in items"
                      :key="item.id"
                      class="flex items-center justify-between rounded-[4px] border border-mauve6 px-4 py-3"
                    >
                      <span class="text-mauve12 text-[14px]">{{ item.name }}</span>
                      <TooltipRoot :close-on-ancestor-scroll="false">
                        <TooltipTrigger
                          class="text-mauve11 hover:bg-mauve4 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full focus:outline-none"
                          :aria-label="`Info about ${item.name}`"
                        >
                          <Icon
                            icon="lucide:info"
                            class="h-4 w-4"
                          />
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent
                            side="left"
                            :side-offset="8"
                            class="text-mauve12 select-none rounded-[4px] bg-white px-[12px] py-[8px] text-[13px] leading-normal shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
                          >
                            {{ item.description }}
                            <TooltipArrow class="fill-white" />
                          </TooltipContent>
                        </TooltipPortal>
                      </TooltipRoot>
                    </li>
                  </ul>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </TooltipProvider>
      </div>
    </Variant>
  </Story>
</template>
