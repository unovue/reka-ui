<script setup>
// Carousel: N instances of a typical composition (5 slides, controls, indicators)
import { CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
    style="width: 200px"
  >
    <CarouselRoot
      v-slot="{ snapCount }"
      aria-label="Bench"
    >
      <CarouselViewport>
        <CarouselContent>
          <CarouselItem
            v-for="s in 5"
            :key="s"
            style="width: 200px"
          >
            Slide {{ s }}
          </CarouselItem>
        </CarouselContent>
      </CarouselViewport>
      <CarouselPrevious>‹</CarouselPrevious>
      <CarouselNext class="next">
        ›
      </CarouselNext>
      <CarouselIndicator
        v-for="(_, index) in snapCount"
        :key="index"
        :index="index"
      />
    </CarouselRoot>
  </div>
</template>
