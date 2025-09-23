<script setup lang="ts">
import type { GridboxRootEmits, GridboxRootProps } from '..'
import { computed } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { standardColorsList } from '@/shared/constant'
import { GridboxCell, GridboxContent, GridboxRoot, GridboxRow } from '..'

const props = defineProps<GridboxRootProps>()
const emits = defineEmits<GridboxRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

// Use the same grid structure as the demo - 2 colors per row
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
  <GridboxRoot
    v-bind="forwarded"
    class="w-48 p-2 rounded-lg bg-neutral-400"
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
</template>
