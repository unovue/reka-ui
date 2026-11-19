<script setup lang="ts">
import type { CarouselRootEmits, CarouselRootProps } from '..'
import { computed } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { CarouselAutoplayToggle, CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '..'

const props = withDefaults(defineProps<CarouselRootProps & { count?: number }>(), {
  modelValue: undefined,
  playing: undefined,
  defaultPlaying: true,
  draggable: true,
  count: 5,
})
const emits = defineEmits<CarouselRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const rootProps = computed(() => {
  const { count: _count, ...rest } = forwarded.value as typeof forwarded.value & { count?: number }
  return rest
})
</script>

<template>
  <CarouselRoot
    v-slot="{ snapCount }"
    v-bind="rootProps"
    aria-label="Featured"
    class="relative w-[300px]"
  >
    <CarouselAutoplayToggle
      v-if="autoplay || autoScroll"
      v-slot="{ playing: isPlaying }"
      class="mb-2 rounded border px-2"
    >
      {{ isPlaying ? 'Pause' : 'Play' }}
    </CarouselAutoplayToggle>
    <CarouselViewport class="rounded outline-none focus-visible:ring-2">
      <CarouselContent>
        <CarouselItem
          v-for="i in count"
          :key="i"
          class="basis-full p-1 transition-opacity duration-300"
        >
          <div class="flex h-32 items-center justify-center rounded bg-grass4 text-2xl">
            {{ i }}
          </div>
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>
    <div class="mt-2 flex items-center justify-between">
      <CarouselPrevious class="rounded border px-2 disabled:opacity-50">
        ‹
      </CarouselPrevious>
      <div class="flex gap-1">
        <CarouselIndicator
          v-for="(_, index) in snapCount"
          :key="index"
          :index="index"
          class="size-2.5 rounded-full bg-grass6 data-[active]:bg-grass11"
        />
      </div>
      <CarouselNext class="rounded border px-2 disabled:opacity-50">
        ›
      </CarouselNext>
    </div>
  </CarouselRoot>
</template>
