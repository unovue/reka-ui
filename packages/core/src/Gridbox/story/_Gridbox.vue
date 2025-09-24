<script setup lang="ts">
import type { GridboxRootEmits, GridboxRootProps } from '..'
import { computed } from 'vue'
import { useForwardPropsEmits } from '@/shared'
import { colorList } from '@/shared/constant'
import { GridboxCell, GridboxContent, GridboxRoot, GridboxRow } from '..'

const props = defineProps<GridboxRootProps>()
const emits = defineEmits<GridboxRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const options = colorList.slice(0, 12).map(color => color.toLowerCase())
const colorsGrid = computed(() => {
  const grid: string[][] = []
  const colsPerRow = 2

  for (let i = 0; i < options.length; i += colsPerRow) {
    grid.push(options.slice(i, i + colsPerRow))
  }

  return grid
})
</script>

<template>
  <GridboxRoot
    v-bind="forwarded"
    class="w-fit p-2 rounded-lg bg-neutral-400"
  >
    <GridboxContent class="space-y-2">
      <GridboxRow
        v-for="(rowColors, rowIdx) in colorsGrid"
        :key="rowIdx"
        class="gridx gap-x-2"
        :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
      >
        <GridboxCell
          v-for="(color, colIdx) in rowColors"
          :key="color"
          :value="color"
          :row="rowIdx"
          :col="colIdx"
          :style="{ 'background-color': color }"
          class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative"
        >
          <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
        </GridboxCell>
      </GridboxRow>
    </GridboxContent>
  </GridboxRoot>
</template>
