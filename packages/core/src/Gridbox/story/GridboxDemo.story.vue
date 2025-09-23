<script setup lang="ts">
import { computed, ref } from 'vue'
import { standardColorsList } from '@/shared/constant'
import { GridboxCell, GridboxContent, GridboxRoot, GridboxRow } from '..'

const selectedColor = ref<string>('blue')

const colorsGrid = computed(() => {
  const grid: string[][] = []
  const colsPerRow = 2

  for (let i = 0; i < standardColorsList.length; i += colsPerRow) {
    grid.push(standardColorsList.slice(i, i + colsPerRow))
  }

  return grid
})
</script>

<template>
  <Story
    title="Gridbox/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <GridboxRoot
      v-model="selectedColor"
      class="w-48 mx-auto p-2 rounded-lg bg-neutral-400"
    >
      <GridboxContent class="space-y-2">
        <GridboxRow
          v-for="(rowColors, rowIdx) in colorsGrid"
          :key="rowIdx"
          class="flex gap-x-2"
        >
          <GridboxCell
            v-for="(color, colIdx) in rowColors"
            :key="color"
            :value="color"
            :row="rowIdx"
            :col="colIdx"
            :style="{ 'background-color': color }"
            class="w-full p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative"
          >
            <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
          </GridboxCell>
        </GridboxRow>
      </GridboxContent>
    </GridboxRoot>

    <div class="mt-4 text-center">
      <p class="text-sm text-black">
        Selected: {{ selectedColor || 'None' }}
      </p>
    </div>
  </Story>
</template>
