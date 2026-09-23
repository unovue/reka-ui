<script setup lang="ts">
import type { DateRangePickerRootEmits, DateRangePickerRootProps } from '..'
import { Icon } from '@iconify/vue'
import { useForwardPropsEmits } from '@/shared'
import {
  DateRangePickerArrow,
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerInput,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,

  DateRangePickerTrigger,
} from '..'

const props = defineProps<DateRangePickerRootProps>()
const emits = defineEmits<DateRangePickerRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DateRangePickerRoot v-bind="forwarded">
    <DateRangePickerField
      v-slot="{ segments }"
      class="flex select-none items-center rounded-lg text-center text-green10 placeholder:text-mauve5 border border-gray9 p-1 bg-white data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments.start"
        :key="item.part"
      >
        <DateRangePickerInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </DateRangePickerInput>
        <DateRangePickerInput
          v-else
          type="start"
          :part="item.part"
          class="rounded-md p-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateRangePickerInput>
      </template>
      -

      <template
        v-for="item in segments.end"
        :key="item.part"
      >
        <DateRangePickerInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </DateRangePickerInput>
        <DateRangePickerInput
          v-else
          type="end"
          :part="item.part"
          class="rounded-md p-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DateRangePickerInput>
      </template>
      <DateRangePickerTrigger class="ml-4 focus:shadow-[0_0_0_2px] focus:shadow-black">
        <Icon
          icon="radix-icons:calendar"
          class="w-6 h-6"
        />
      </DateRangePickerTrigger>
    </DateRangePickerField>

    <DateRangePickerContent
      :side-offset="10"
      class="rounded-lg bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
    >
      <DateRangePickerArrow class="fill-white" />
      <DateRangePickerCalendar
        v-slot="{ weekDays, grid }"
        class="p-4"
      >
        <DateRangePickerHeader class="flex items-center justify-between">
          <DateRangePickerPrev
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent w-8 h-8 hover:bg-green10 hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-left"
              class="w-5 h-5"
            />
          </DateRangePickerPrev>

          <DateRangePickerHeading class="text-[15px] text-black font-medium" />
          <DateRangePickerNext
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-md bg-transparent w-8 h-8 hover:bg-green10 hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-right"
              class="w-5 h-5"
            />
          </DateRangePickerNext>
        </DateRangePickerHeader>
        <div
          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <DateRangePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1"
          >
            <DateRangePickerGridHead>
              <DateRangePickerGridRow class="mb-1 flex w-full justify-between">
                <DateRangePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="w-8 h-8 rounded-md text-xs font-normal text-black"
                >
                  {{ day }}
                </DateRangePickerHeadCell>
              </DateRangePickerGridRow>
            </DateRangePickerGridHead>
            <DateRangePickerGridBody>
              <DateRangePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
                class="flex w-full"
              >
                <DateRangePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="relative text-center text-sm p-0"
                >
                  <DateRangePickerCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="relative flex items-center justify-center whitespace-nowrap bg-transparent text-sm font-normal text-black w-8 h-8 outline-offset-0 outline-none data-[selection-start]:rounded-l-lg data-[selection-end]:rounded-r-lg focus:outline-black hover:outline-black data-[selected]:bg-green10 data-[selected]:font-medium data-[outside-view]:text-black/30 data-[selected]:text-white data-[highlighted]:bg-grass9/30 data-[selection-start]:bg-green10  data-[selection-end]:bg-green10  data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                  />
                </DateRangePickerCell>
              </DateRangePickerGridRow>
            </DateRangePickerGridBody>
          </DateRangePickerGrid>
        </div>
      </DateRangePickerCalendar>
    </DateRangePickerContent>
  </DateRangePickerRoot>
</template>
