<script setup lang="ts">
import { ref } from 'vue'
import { CarouselContent, CarouselItem, CarouselRoot, CarouselViewport } from '..'
import Carousel from './_Carousel.vue'

const current = ref(2)
</script>

<template>
  <Story
    title="Carousel/Demo"
    :layout="{ type: 'grid', width: '360px' }"
  >
    <Variant title="default">
      <Carousel />
    </Variant>

    <Variant title="loop">
      <Carousel loop />
    </Variant>

    <Variant title="controlled">
      <Carousel v-model="current" />
      <p class="mt-2 text-sm">
        Current snap: {{ current }}
      </p>
    </Variant>

    <Variant title="three per view, center, slidesToScroll auto">
      <CarouselRoot
        aria-label="Thumbnails"
        align="center"
        slides-to-scroll="auto"
        class="w-[300px]"
      >
        <CarouselViewport>
          <CarouselContent class="-ml-2">
            <CarouselItem
              v-for="i in 10"
              :key="i"
              class="basis-1/3 pl-2 data-[in-view]:opacity-100 opacity-40 transition-opacity"
            >
              <div class="flex h-20 items-center justify-center rounded bg-grass4">
                {{ i }}
              </div>
            </CarouselItem>
          </CarouselContent>
        </CarouselViewport>
      </CarouselRoot>
    </Variant>

    <Variant title="vertical">
      <CarouselRoot
        aria-label="Vertical"
        orientation="vertical"
        class="w-[300px]"
      >
        <CarouselViewport class="h-40">
          <CarouselContent>
            <CarouselItem
              v-for="i in 5"
              :key="i"
              class="h-40 p-1"
            >
              <div class="flex h-full items-center justify-center rounded bg-grass4 text-2xl">
                {{ i }}
              </div>
            </CarouselItem>
          </CarouselContent>
        </CarouselViewport>
      </CarouselRoot>
    </Variant>

    <Variant title="rtl">
      <Carousel dir="rtl" />
    </Variant>

    <Variant title="fade">
      <Carousel
        fade
        loop
        wheel
      />
    </Variant>

    <Variant title="autoplay">
      <Carousel
        loop
        :autoplay="{ delay: 2000 }"
      />
    </Variant>

    <Variant title="auto scroll">
      <Carousel
        loop
        :auto-scroll="{ speed: 40, stopOnInteraction: false }"
      />
    </Variant>

    <Variant title="drag free">
      <Carousel
        drag-free
        :count="8"
      />
    </Variant>

    <Variant title="auto height">
      <CarouselRoot
        aria-label="Auto height"
        auto-height
        class="w-[300px]"
      >
        <CarouselViewport class="transition-[height] duration-300">
          <CarouselContent>
            <CarouselItem
              v-for="h in [80, 160, 120, 200]"
              :key="h"
              class="basis-full p-1"
            >
              <div
                class="flex items-center justify-center rounded bg-grass4"
                :style="{ height: `${h}px` }"
              >
                {{ h }}px
              </div>
            </CarouselItem>
          </CarouselContent>
        </CarouselViewport>
      </CarouselRoot>
    </Variant>
  </Story>
</template>
