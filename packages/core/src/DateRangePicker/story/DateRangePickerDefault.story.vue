<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Label } from '@/Label'
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
</script>

<template>
  <Story title="Date Range Picker/Default">
    <Variant title="default">
      <div class="flex flex-col gap-2">
        <Label
          class="text-sm text-gray9"
          for="date-field"
        >Hotel Booking Dates</Label>
        <DateRangePickerRoot
          id="date-field"
          :is-date-unavailable="date => date.day === 19"
        >
          <DateRangePickerField
            v-slot="{ segments }"
            class="flex select-none items-center rounded text-center text-green10 placeholder:text-mauve5 border border-gray9 p-2 data-[invalid]:border-red-500"
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
                class="rounded-5px px-1 py-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black ]:text-grass6"
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
                class="rounded-5px px-1 py-1 hover:bg-grass4 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black ]:text-grass6"
              >
                {{ item.value }}
              </DateRangePickerInput>
            </template>
            <DateRangePickerTrigger class="focus:shadow-[0_0_0_2px] focus:shadow-black">
              <Icon
                icon="radix-icons:calendar"
                class="w-6 h-6"
              />
            </DateRangePickerTrigger>
          </DateRangePickerField>

          <DateRangePickerContent
            align="end"
            :side-offset="16"
            class="rounded-lg bg-white shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.green7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
          >
            <DateRangePickerArrow class="fill-white" />
            <DateRangePickerCalendar
              v-slot="{ weekDays, grid }"
              class="p-[22px]"
            >
              <DateRangePickerHeader class="flex items-center justify-between">
                <DateRangePickerPrev
                  class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
                >
                  <Icon
                    icon="radix-icons:chevron-left"
                    class="w-6 h-6"
                  />
                </DateRangePickerPrev>

                <DateRangePickerHeading class="text-[15px] text-black font-medium" />
                <DateRangePickerNext
                  class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-10 h-10 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
                >
                  <Icon
                    icon="radix-icons:chevron-right"
                    class="w-6 h-6"
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
                        class="w-10 rounded-md text-xs !font-normal text-black"
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
                        class="relative !p-0 text-center text-sm w-10 h-10"
                      >
                        <DateRangePickerCellTrigger
                          :day="weekDate"
                          :month="month.value"
                          class="relative flex items-center justify-center whitespace-nowrap rounded-[9px] border border-transparent bg-transparent text-sm font-normal text-black p-2 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black hover:border-black data-[selected]:bg-black data-[selected]:font-medium data-[outside-view]:text-black/30 data-[selected]:text-white data-[highlighted]:bg-grass9/30 data-[highlighted]:rounded-none data-[selection-start]:bg-black data-[selection-start]:rounded-none data-[selection-start]:rounded-l-[9px] data-[selection-end]:rounded-none data-[selection-end]:bg-black data-[selection-end]:rounded-r-[9px] data-[selected]:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-grass9 data-[selected]:before:bg-white"
                        />
                      </DateRangePickerCell>
                    </DateRangePickerGridRow>
                  </DateRangePickerGridBody>
                </DateRangePickerGrid>
              </div>
            </DateRangePickerCalendar>
          </DateRangePickerContent>
        </DateRangePickerRoot>
      </div>
    </Variant>
  </Story>
</template>
