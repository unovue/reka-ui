<script setup lang="ts">
import type { GenericComponentInstance } from '@/shared/types'
import { computed, ref } from 'vue'
import { colorList } from '@/shared/constant'
import { GridboxCell, GridboxContent, GridboxRoot, GridboxRow } from '..'

const singleControl = ref()
const multipleControl = ref()

const gridboxRef = ref<GenericComponentInstance<typeof GridboxRoot>>()

const options = colorList.slice(0, 18).map(color => color.toLowerCase())
const colorsGrid = computed(() => {
  const grid: string[][] = []
  const colsPerRow = 3

  for (let i = 0; i < options.length; i += colsPerRow) {
    grid.push(options.slice(i, i + colsPerRow))
  }

  return grid
})
</script>

<template>
  <Story
    title="Gridbox/Chromatic"
    :layout="{ type: 'grid', iframe: false, width: '50%' }"
  >
    <Variant title="Uncontrolled (Single)">
      <GridboxRoot class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto">
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Uncontrolled (Multiple)">
      <GridboxRoot
        :multiple="true"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Controlled (Single)">
      <GridboxRoot
        v-model="singleControl"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Controlled (Multiple)">
      <GridboxRoot
        v-model="multipleControl"
        :multiple="true"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Object (Single)">
      <GridboxRoot class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto">
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid.map(row => row.map(color => ({ label: color, value: color.toLowerCase() })))"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(colorObj, colIdx) in rowColors"
              :key="colorObj.value"
              :value="colorObj"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': colorObj.label }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ colorObj.label }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Object (Multiple)">
      <GridboxRoot
        by="value"
        :multiple="true"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid.map(row => row.map(color => ({ label: color, value: color.toLowerCase() })))"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(colorObj, colIdx) in rowColors"
              :key="colorObj.value"
              :value="colorObj"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': colorObj.label }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ colorObj.label }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Replace behavior (Single)">
      <GridboxRoot
        default-value="red"
        selection-behavior="replace"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Replace behavior (Multiple)">
      <GridboxRoot
        multiple
        selection-behavior="replace"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Highlight on hover">
      <GridboxRoot
        highlight-on-hover
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Highlight imperative">
      <button @click="gridboxRef?.highlightFirstItem()">
        Highlight First
      </button>
      <GridboxRoot
        ref="gridboxRef"
        class="w-fit p-2 rounded-lg bg-neutral-400 mx-auto"
      >
        <GridboxContent class="space-y-2">
          <GridboxRow
            v-for="(rowColors, rowIdx) in colorsGrid"
            :key="rowIdx"
            class="grid gap-x-2"
            :style="{ 'grid-template-columns': `repeat(${rowColors.length}, minmax(0, 1fr))` }"
          >
            <GridboxCell
              v-for="(color, colIdx) in rowColors"
              :key="color"
              :value="color"
              :row="rowIdx"
              :col="colIdx"
              :style="{ 'background-color': color }"
              class="p-2 rounded-md text-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
            >
              <span class="bg-white px-1 py-0.5 rounded text-sm text-black">{{ color }}</span>
            </GridboxCell>
          </GridboxRow>
        </GridboxContent>
      </GridboxRoot>
    </Variant>
  </Story>
</template>
