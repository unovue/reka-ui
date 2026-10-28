<script setup>
// Tooltip: N instances of a typical composition (closed/default state)
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <TooltipProvider
    :delay-duration="0"
    :skip-delay-duration="0"
  >
    <div
      v-for="i in n"
      :key="i"
      class="ci"
    >
      <TooltipRoot>
        <TooltipTrigger class="trg">
          +
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent class="tt-content">
            Add<TooltipArrow />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>
  </TooltipProvider>
</template>
