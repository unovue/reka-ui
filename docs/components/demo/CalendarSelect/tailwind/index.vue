<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { createCalendar, getLocalTimeZone, toCalendar, today } from '@internationalized/date'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot, Label, SelectContent, SelectGroup, SelectItem, SelectItemIndicator, SelectItemText, SelectLabel, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
import { computed, ref } from 'vue'

const preferences = [
  { locale: 'en-US', label: 'Default', ordering: 'gregory' },
  { label: 'Arabic (Algeria)', locale: 'ar-DZ', territories: 'DJ DZ EH ER IQ JO KM LB LY MA MR OM PS SD SY TD TN YE', ordering: 'gregory islamic islamic-civil islamic-tbla' },
  { label: 'Arabic (United Arab Emirates)', locale: 'ar-AE', territories: 'AE BH KW QA', ordering: 'gregory islamic-umalqura islamic islamic-civil islamic-tbla' },
  { label: 'Arabic (Egypt)', locale: 'AR-EG', territories: 'EG', ordering: 'gregory coptic islamic islamic-civil islamic-tbla' },
  { label: 'Arabic (Saudi Arabia)', locale: 'ar-SA', territories: 'SA', ordering: 'islamic-umalqura gregory islamic islamic-rgsa' },
  { label: 'Farsi (Iran)', locale: 'fa-IR', territories: 'IR', ordering: 'persian gregory islamic islamic-civil islamic-tbla' },
  { label: 'Farsi (Afghanistan)', locale: 'fa-AF', territories: 'AF IR', ordering: 'persian gregory islamic islamic-civil islamic-tbla' },
  { label: 'Amharic (Ethiopia)', locale: 'am-ET', territories: 'ET', ordering: 'gregory ethiopic ethioaa' },
  { label: 'Hebrew (Israel)', locale: 'he-IL', territories: 'IL', ordering: 'gregory hebrew islamic islamic-civil islamic-tbla' },
  { label: 'Hindi (India)', locale: 'hi-IN', territories: 'IN', ordering: 'gregory indian' },
  { label: 'Japanese (Japan)', locale: 'ja-JP', territories: 'JP', ordering: 'gregory japanese' },
  { label: 'Thai (Thailand)', locale: 'th-TH', territories: 'TH', ordering: 'buddhist gregory' },
  { label: 'Chinese (Taiwan)', locale: 'zh-TW', territories: 'TW', ordering: 'gregory roc chinese' },
]

const calendars = [
  { key: 'gregory', name: 'Gregorian' },
  { key: 'japanese', name: 'Japanese' },
  { key: 'buddhist', name: 'Buddhist' },
  { key: 'roc', name: 'Taiwan' },
  { key: 'persian', name: 'Persian' },
  { key: 'indian', name: 'Indian' },
  { key: 'islamic-umalqura', name: 'Islamic (Umm al-Qura)' },
  { key: 'islamic-civil', name: 'Islamic Civil' },
  { key: 'islamic-tbla', name: 'Islamic Tabular' },
  { key: 'hebrew', name: 'Hebrew' },
  { key: 'coptic', name: 'Coptic' },
  { key: 'ethiopic', name: 'Ethiopic' },
  { key: 'ethioaa', name: 'Ethiopic (Amete Alem)' },
]

const locale = ref(preferences[0].locale)
const calendar = ref(calendars[0].key)

const pref = computed(() => preferences.find(p => p.locale === locale.value))
const preferredCalendars = computed(() => pref.value ? pref.value.ordering.split(' ').map(p => calendars.find(c => c.key === p)).filter(Boolean) : [calendars[0]])
const otherCalendars = computed(() => calendars.filter(c => !preferredCalendars.value.some(p => p!.key === c.key)))

function updateLocale(newLocale: string) {
  locale.value = newLocale
  calendar.value = pref.value!.ordering.split(' ')[0]
}
const value = computed(() => toCalendar(today(getLocalTimeZone()), createCalendar(calendar.value)))
</script>

<template>
  <div class="flex flex-col gap-4">
    <Label class="text-white">Locale</Label>
    <SelectRoot
      v-model="locale"
      @update:model-value="updateLocale"
    >
      <SelectTrigger
        class="inline-flex min-w-[160px] items-center justify-between rounded-md px-[15px] text-xs leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9 outline-none"
        aria-label="Select a locale"
      >
        <SelectValue placeholder="Please select a locale">
          {{ pref!.label }}
        </SelectValue>
        <Icon
          icon="radix-icons:chevron-down"
          class="h-3.5 w-3.5"
        />
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="min-w-[160px] bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-[100]"
          :side-offset="5"
        >
          <SelectScrollUpButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
            <Icon icon="radix-icons:chevron-up" />
          </SelectScrollUpButton>

          <SelectViewport class="p-[5px]">
            <SelectItem
              v-for="(option, index) in preferences"
              :key="index"
              class="text-xs leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1"
              :value="option.locale"
            >
              <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                <Icon icon="radix-icons:check" />
              </SelectItemIndicator>
              <SelectItemText>
                {{ option.label }}
              </SelectItemText>
            </SelectItem>
          </SelectViewport>

          <SelectScrollDownButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
            <Icon icon="radix-icons:chevron-down" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <Label class="text-white">Calendar</Label>
    <SelectRoot v-model="calendar">
      <SelectTrigger
        class="inline-flex min-w-[160px] items-center justify-between rounded-md px-[15px] text-xs leading-none h-[35px] gap-[5px] bg-white text-grass11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green9 outline-none"
        aria-label="Select a calendar"
      >
        <SelectValue placeholder="Please select a calendar">
          {{ calendars.find(c => c.key === calendar)?.name }}
        </SelectValue>

        <Icon
          icon="radix-icons:chevron-down"
          class="h-3.5 w-3.5"
        />
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="min-w-[160px] bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-[100]"
          :side-offset="5"
        >
          <SelectScrollUpButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
            <Icon icon="radix-icons:chevron-up" />
          </SelectScrollUpButton>

          <SelectViewport class="p-[5px]">
            <SelectLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
              Preferred
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in preferredCalendars"
                :key="index"
                class="text-xs leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1"
                :value="option!.key"
              >
                <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option!.name }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator class="h-[1px] bg-green6 m-[5px]" />
            <SelectLabel class="px-[25px] text-xs leading-[25px] text-mauve11">
              Other
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in otherCalendars"
                :key="index"
                class="text-xs leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1"
                :value="option.key"
              >
                <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option.name }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
          </SelectViewport>

          <SelectScrollDownButton class="flex items-center justify-center h-[25px] bg-white text-violet11 cursor-default">
            <Icon icon="radix-icons:chevron-down" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <CalendarRoot
      v-slot="{ weekDays, grid }"
      :model-value="value"
      :locale="locale"
      class="mt-6 rounded-xl bg-white p-4 shadow-md"
      fixed-weeks
    >
      <CalendarHeader class="flex items-center justify-between">
        <CalendarPrev
          class="inline-flex items-center cursor-pointer text-black justify-center rounded-[9px] bg-transparent w-8 h-8 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
        >
          <Icon
            icon="radix-icons:chevron-left"
            class="w-4 h-4"
          />
        </CalendarPrev>
        <CalendarHeading class="text-sm text-black font-medium" />

        <CalendarNext
          class="inline-flex items-center cursor-pointer justify-center text-black rounded-[9px] bg-transparent w-8 h-8 hover:bg-black hover:text-white active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black"
        >
          <Icon
            icon="radix-icons:chevron-right"
            class="w-4 h-4"
          />
        </CalendarNext>
      </CalendarHeader>
      <div
        class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
      >
        <CalendarGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="w-full border-collapse select-none space-y-1"
        >
          <CalendarGridHead>
            <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
              <CalendarHeadCell
                v-for="day in weekDays"
                :key="day"
                class="rounded-md text-xs text-green8"
              >
                {{ day }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody class="grid">
            <CalendarGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`weekDate-${index}`"
              class="grid grid-cols-7"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                class="relative text-center text-sm"
              >
                <CalendarCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  class="relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal text-black w-8 h-8 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[outside-view]:text-black/30 data-[selected]:!bg-green10 data-[selected]:text-white hover:bg-green5 data-[highlighted]:bg-green5 data-[unavailable]:pointer-events-none data-[unavailable]:text-black/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-green9 "
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    </CalendarRoot>
  </div>
</template>
