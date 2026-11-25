<script setup vapor lang="ts">
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '#reka'
import { ref } from 'vue'

const tooltip = ref(false)
const card = ref(false)
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div style="padding: 40px">
      <TooltipRoot v-model:open="tooltip">
        <!-- asChild, template form -->
        <TooltipTrigger as-child>
          <button
            id="tooltip-trigger"
            data-state="mine"
          >
            Hover me
          </button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            id="tooltip-content"
            side="bottom"
            :side-offset="4"
          >
            Add to library
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>
  </TooltipProvider>
  <span id="tooltip">{{ tooltip }}</span>

  <div style="padding: 40px">
    <HoverCardRoot
      v-model:open="card"
      :open-delay="0"
      :close-delay="0"
    >
      <!-- asChild, v-slot form -->
      <HoverCardTrigger
        v-slot="{ props }"
        as-child
      >
        <a
          v-bind="props"
          id="card-trigger"
          href="#profile"
        >@vue</a>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          id="card-content"
          :side-offset="4"
        >
          Vue profile
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCardRoot>
  </div>
  <span id="card">{{ card }}</span>
  <div
    id="away"
    style="height: 40px"
  >
    away
  </div>
</template>
