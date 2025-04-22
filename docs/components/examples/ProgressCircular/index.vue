<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed, onMounted, ref } from 'vue'

const RADIUS = 45
const circumference = 2 * Math.PI * RADIUS

const progress = ref(0)

const dashOffset = computed(() =>
  (progress.value / 100) * circumference,
)

const trackPath = computed(() => {
  const r = RADIUS
  return `
          M 50 50
          m 0 -${r}
          a ${r} ${r} 0 1 1 0 ${r * 2}
          a ${r} ${r} 0 1 1 0 -${r * 2}
          `
})

onMounted(() => {
  setInterval(() => {
    if (progress.value < 100) {
      progress.value += 10
    }
    else {
      progress.value = 0
    }
  }, 1000)
})
</script>

<template>
  <div class="relative w-40 h-40">
    <ProgressRoot
      v-model="progress"
      as-child
    >
      <svg
        class="w-full h-full"
        viewBox="0 0 100 100"
      >
        <!-- Background circle -->
        <path
          :d="trackPath"
          class="fill-none stroke-muted stroke-[6px]"
        />
        <!-- Progress circle -->
        <ProgressIndicator as-child>
          <path
            :d="trackPath"
            class="fill-none stroke-primary stroke-[6px] transition-[stroke-dasharray,opacity] duration-700 data-[value='0']:opacity-0"
            :style="{
              'stroke-linecap': 'round',
              'stroke-dasharray': `${dashOffset}px, ${circumference}px`,
              'stroke-dashoffset': '0px',
            }"
          />
        </ProgressIndicator>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-lg font-bold text-foreground">{{ progress }}%</span>
      </div>
    </ProgressRoot>
  </div>
</template>
