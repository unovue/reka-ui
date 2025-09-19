<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '..'

const lastEvent = ref('')
</script>

<template>
  <Story
    title="Tooltip/Content"
    :layout="{ type: 'grid', width: '300px' }"
  >
    <Variant title="Aria Label">
      <div class="grid w-full h-28 place-content-center">
        <TooltipProvider :disable-closing-trigger="true">
          <TooltipRoot
            :delay-duration="1000"
            :default-open="true"
          >
            <TooltipTrigger
              class="text-violet11 shadow-blackA7 hover:bg-violet3 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
            >
              <Icon icon="radix-icons:plus" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                as-child
                align="start"
                side="bottom"
                :align-offset="20"
                aria-label="label tooltip content"
                :side-offset="5"
                class="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
              >
                <ul>
                  <h4>Add to library</h4>
                  <p>
                    We will make sure that the files synchronise <b>immediately</b>
                  </p>
                  <TooltipArrow class="fill-white" />
                </ul>
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>
    </Variant>

    <Variant title="Events">
      <div class="grid w-full h-28 place-content-center">
        <p class="mb-4">
          <template v-if="lastEvent">
            The event <code>{{ lastEvent }}</code> has been triggered
          </template>
          <template v-else>
            No event has been emitted yet
          </template>
        </p>

        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger
              class="text-violet11 shadow-blackA7 hover:bg-violet3 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
              @click.prevent
            >
              <Icon icon="radix-icons:plus" />
            </TooltipTrigger>
            <Teleport to="body">
              <TooltipContent
                :side-offset="5"
                class="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
                @escape-key-down="lastEvent = '@on-escape-key-down'"
                @pointer-down-outside="lastEvent = '@pointer-down-outside'"
              >
                Add to library
                <TooltipArrow class="fill-white" />
              </TooltipContent>
            </Teleport>
          </TooltipRoot>
        </TooltipProvider>
      </div>
    </Variant>
  </Story>
</template>
