<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { YearPickerCell, YearPickerCellTrigger, YearPickerGrid, YearPickerGridBody, YearPickerGridRow, YearPickerHeader, YearPickerHeading, YearPickerNext, YearPickerPrev, YearPickerRoot } from '..'
</script>

<template>
  <Story
    title="YearPicker/Default"
    :layout="{ type: 'single' }"
  >
    <Variant title="default">
      <YearPickerRoot
        v-slot="{ grid }"
        class="mt-6 rounded-xl border border-black bg-white p-4 shadow-md"
      >
        <YearPickerHeader class="flex items-center justify-between">
          <YearPickerPrev
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </YearPickerPrev>

          <YearPickerHeading class="text-[15px] text-black font-medium" />

          <YearPickerNext
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </YearPickerNext>
        </YearPickerHeader>

        <YearPickerGrid class="w-full border-collapse select-none space-y-1 mt-4">
          <YearPickerGridBody class="grid">
            <YearPickerGridRow
              v-for="(yearRow, rowIndex) in grid.rows"
              :key="`yearRow-${rowIndex}`"
              class="grid grid-cols-4 gap-1"
            >
              <YearPickerCell
                v-for="year in yearRow"
                :key="year.toString()"
                :date="year"
                class="relative text-center text-sm"
              >
                <YearPickerCellTrigger
                  :year="year"
                  class="relative flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent text-sm font-normal text-black w-full h-10 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black data-[selected]:bg-black data-[selected]:font-medium data-[selected]:text-white data-[unavailable]:text-black/30 data-[unavailable]:line-through data-[disabled]:text-black/30 data-[disabled]:pointer-events-none before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                />
              </YearPickerCell>
            </YearPickerGridRow>
          </YearPickerGridBody>
        </YearPickerGrid>
      </YearPickerRoot>
    </Variant>
  </Story>
</template>
