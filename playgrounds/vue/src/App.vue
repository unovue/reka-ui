<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { useTemplateRef } from 'vue'

const divEl = useTemplateRef('div-el')
</script>

<template>
  <div class="w-full flex flex-col items-center bg-gray-600">
    <div class="max-w-6xl w-full grid grid-cols-3 gap-4 pt-40 pb-40">
      <Card>
        <div class="flex gap-4">
          <TooltipProvider :delay-duration="0">
            <TooltipRoot>
              <TooltipTrigger as-child>
                <div class="bg-blue-400 size-40 cursor-pointer">
                  Trigger 1
                </div>
              </TooltipTrigger>

              <TooltipPortal>
                <TooltipContent>
                  Tooltip content
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>

            <div
              ref="div-el"
              class="bg-blue-400 size-40 cursor-pointer"
            >
              Trigger 2
            </div>

            <TooltipRoot>
              <TooltipTrigger
                :reference="divEl"
                as-child
              />

              <TooltipPortal>
                <TooltipContent>
                  Tooltip content
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </TooltipProvider>
        </div>
      </Card>
    </div>
  </div>
</template>
