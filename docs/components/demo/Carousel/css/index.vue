<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from 'reka-ui'
import './styles.css'

const slides = ['Mountains', 'Lakes', 'Forests', 'Deserts', 'Coasts']
</script>

<template>
  <CarouselRoot
    v-slot="{ snapCount }"
    class="CarouselRoot"
    aria-label="Landscapes"
    loop
  >
    <CarouselViewport class="CarouselViewport">
      <CarouselContent>
        <CarouselItem
          v-for="slide in slides"
          :key="slide"
          class="CarouselItem"
        >
          <div class="CarouselSlide">
            {{ slide }}
          </div>
        </CarouselItem>
      </CarouselContent>
    </CarouselViewport>

    <div class="CarouselControls">
      <CarouselPrevious class="CarouselButton">
        <Icon icon="radix-icons:chevron-left" />
      </CarouselPrevious>
      <div class="CarouselIndicators">
        <CarouselIndicator
          v-for="(_, index) in snapCount"
          :key="index"
          :index="index"
          class="CarouselIndicator"
        />
      </div>
      <CarouselNext class="CarouselButton">
        <Icon icon="radix-icons:chevron-right" />
      </CarouselNext>
    </div>
  </CarouselRoot>
</template>
