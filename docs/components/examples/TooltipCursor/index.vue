<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

const open = ref(false)
const anchor = ref({
  x: 0,
  y: 0,
})

const position = computed(() => ({
  getBoundingClientRect: () =>
    ({
      width: 0,
      height: 0,
      left: anchor.value.x,
      right: anchor.value.x,
      top: anchor.value.y,
      bottom: anchor.value.y,
      ...anchor.value,
    } as DOMRect),
}))
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      class="w-48 h-32 border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center dark:text-foreground text-sm font-medium"
      @pointerenter="open = true"
      @pointerleave="open = false"
      @pointermove="(ev) => {
        anchor.x = ev.clientX
        anchor.y = ev.clientY
      }"
    >
      Container
    </div>
    <TooltipRoot :open="open">
      <TooltipTrigger :reference="position" />
      <TooltipPortal>
        <TooltipContent
          side="top"
          :side-offset="12"
          class="bg-card px-4 py-2 rounded-md text-sm border border-muted-foreground/30"
          update-position-strategy="always"
        >
          Following

          <TooltipArrow class="fill-card stroke-muted-foreground/30 -translate-y-[1px]" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
