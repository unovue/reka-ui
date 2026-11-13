<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from 'reka-ui'

const slides = ['Mountains', 'Lakes', 'Forests', 'Deserts', 'Coasts']
</script>

<template>
  <CarouselRoot
    v-slot="{ snapCount }"
    class="w-full sm:w-[320px]"
    aria-label="Landscapes"
    loop
  >
    <CarouselViewport class="rounded-lg outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-black">
      <CarouselContent>
        <CarouselItem
          v-for="slide in slides"
          :key="slide"
          class="basis-full"
        >
          <div class="flex h-40 items-center justify-center rounded-lg border bg-white text-lg font-medium text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-white">
            {{ slide }}
          </div>
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>

    <div class="mt-3 flex items-center justify-between">
      <CarouselPrevious class="flex size-8 items-center justify-center rounded-full border bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:bg-stone-800 dark:border-stone-700 dark:text-white">
        <Icon icon="radix-icons:chevron-left" />
      </CarouselPrevious>
      <div class="flex gap-1.5">
        <CarouselIndicator
          v-for="(_, index) in snapCount"
          :key="index"
          :index="index"
          class="size-2 rounded-full bg-stone-300 transition data-[active]:w-5 data-[active]:bg-grass9 dark:bg-stone-600"
        />
      </div>
      <CarouselNext class="flex size-8 items-center justify-center rounded-full border bg-white text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:bg-stone-800 dark:border-stone-700 dark:text-white">
        <Icon icon="radix-icons:chevron-right" />
      </CarouselNext>
    </div>
  </CarouselRoot>
</template>
