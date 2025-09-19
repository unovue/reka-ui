<script setup lang="ts">
import type { DatePickerRootEmits, DatePickerRootProps } from '..'
import { Icon } from '@iconify/vue'
import { useForwardPropsEmits } from '@/shared'
import {
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,

  DatePickerTrigger,
} from '..'

const props = defineProps<DatePickerRootProps>()
const emits = defineEmits<DatePickerRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DatePickerRoot
    v-bind="forwarded"
  >
    <DatePickerField
      v-slot="{ segments }"
      class="bg-white flex select-none items-center rounded-lg text-center text-green10 placeholder:text-mauve5 border border-gray9 p-1 data-[invalid]:border-red-500"
    >
      <template
        v-for="item in segments"
        :key="item.part"
      >
        <DatePickerInput
          v-if="item.part === 'literal'"
          :part="item.part"
        >
          {{ item.value }}
        </DatePickerInput>
        <DatePickerInput
          v-else
          :part="item.part"
          class="rounded-5px px-1 py-1 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9"
        >
          {{ item.value }}
        </DatePickerInput>
      </template>

      <DatePickerTrigger class="ml-4 mr-1 focus:shadow-[0_0_0_2px] focus:shadow-black">
        <Icon
          icon="radix-icons:calendar"
          class="w-6 h-6"
        />
      </DatePickerTrigger>
    </DatePickerField>

    <DatePickerContent
      :side-offset="8"
      class="rounded-lg bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
    >
      <DatePickerArrow class="fill-white" />
      <DatePickerCalendar
        v-slot="{ weekDays, grid }"
        class="p-4"
      >
        <DatePickerHeader class="flex items-center justify-between">
          <DatePickerPrev
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-8 h-8 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-left"
              class="w-6 h-6"
            />
          </DatePickerPrev>

          <DatePickerHeading class="text-[15px] text-black font-medium" />
          <DatePickerNext
            class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-8 h-8 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              icon="radix-icons:chevron-right"
              class="w-6 h-6"
            />
          </DatePickerNext>
        </DatePickerHeader>
        <div
          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <DatePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1"
          >
            <DatePickerGridHead>
              <DatePickerGridRow class="mb-1 grid w-full grid-cols-7">
                <DatePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="text-xs !font-normal text-black"
                >
                  {{ day }}
                </DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>
            <DatePickerGridBody>
              <DatePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
                class="flex w-full"
              >
                <DatePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                >
                  <DatePickerCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="relative flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent text-sm font-normal text-black w-8 h-8 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black data-[selected]:bg-black data-[selected]:font-medium data-[outside-view]:text-black/30 data-[selected]:text-white data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                  />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </div>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
