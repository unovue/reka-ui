<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { createCalendar, getLocalTimeZone, toCalendar, today } from '@internationalized/date'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot, Label, SelectContent, SelectGroup, SelectItem, SelectItemIndicator, SelectItemText, SelectLabel, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
import { computed, ref } from 'vue'

const preferences = [
  { locale: 'en-US', label: 'Default', ordering: 'gregory' },
  { label: 'Arabic (Algeria)', locale: 'ar-DZ', territories: 'DJ DZ EH ER IQ JO KM LB LY MA MR OM PS SD SY TD TN YE', ordering: 'gregory islamic islamic-civil islamic-tbla' },
  { label: 'Arabic (United Arab Emirates)', locale: 'ar-AE', territories: 'AE BH KW QA', ordering: 'gregory islamic-umalqura islamic islamic-civil islamic-tbla' },
  { label: 'Arabic (Egypt)', locale: 'ar-EG', territories: 'EG', ordering: 'gregory coptic islamic islamic-civil islamic-tbla' },
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
  <div class="Wrapper">
    <Label class="Label">Locale</Label>
    <SelectRoot
      v-model="locale"
      @update:model-value="updateLocale"
    >
      <SelectTrigger
        class="SelectTrigger"
        aria-label="Select a locale"
      >
        <SelectValue placeholder="Please select a locale">
          {{ pref!.label }}
        </SelectValue>
        <Icon
          icon="radix-icons:chevron-down"
          class="Icon"
        />
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="SelectContent"
          :side-offset="5"
        >
          <SelectScrollUpButton class="SelectScrollButton">
            <Icon icon="radix-icons:chevron-up" />
          </SelectScrollUpButton>

          <SelectViewport class="SelectViewport">
            <SelectItem
              v-for="(option, index) in preferences"
              :key="index"
              class="SelectItem"
              :value="option.locale"
            >
              <SelectItemIndicator class="SelectItemIndicator">
                <Icon icon="radix-icons:check" />
              </SelectItemIndicator>
              <SelectItemText>
                {{ option.label }}
              </SelectItemText>
            </SelectItem>
          </SelectViewport>

          <SelectScrollDownButton class="SelectScrollButton">
            <Icon icon="radix-icons:chevron-down" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <Label class="Label">Calendar</Label>
    <SelectRoot v-model="calendar">
      <SelectTrigger
        class="SelectTrigger"
        aria-label="Select a calendar"
      >
        <SelectValue placeholder="Please select a calendar">
          {{ calendars.find(c => c.key === calendar)?.name }}
        </SelectValue>

        <Icon
          icon="radix-icons:chevron-down"
          class="Icon"
        />
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="SelectContent"
          :side-offset="5"
        >
          <SelectScrollUpButton class="SelectScrollButton">
            <Icon icon="radix-icons:chevron-up" />
          </SelectScrollUpButton>

          <SelectViewport class="SelectViewport">
            <SelectLabel class="SelectLabel">
              Preferred
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in preferredCalendars"
                :key="index"
                class="SelectItem"
                :value="option!.key"
              >
                <SelectItemIndicator class="SelectItemIndicator">
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option!.name }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator class="SelectSeparator" />
            <SelectLabel class="SelectLabel">
              Other
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in otherCalendars"
                :key="index"
                class="SelectItem"
                :value="option.key"
              >
                <SelectItemIndicator class="SelectItemIndicator">
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option.name }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
          </SelectViewport>

          <SelectScrollDownButton class="SelectScrollButton">
            <Icon icon="radix-icons:chevron-down" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <CalendarRoot
      v-slot="{ weekDays, grid }"
      :model-value="value"
      :locale="locale"
      class="Calendar"
      fixed-weeks
    >
      <CalendarHeader class="CalendarHeader">
        <CalendarPrev
          class="CalendarNavButton"
        >
          <Icon
            icon="radix-icons:chevron-left"
            class="Icon"
          />
        </CalendarPrev>
        <CalendarHeading class="CalendarHeading" />
        <CalendarNext
          class="CalendarNavButton"
        >
          <Icon
            icon="radix-icons:chevron-right"
            class="Icon"
          />
        </CalendarNext>
      </CalendarHeader>
      <div
        class="CalendarWrapper"
      >
        <CalendarGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="CalendarGrid"
        >
          <CalendarGridHead>
            <CalendarGridRow class="CalendarGridRow">
              <CalendarHeadCell
                v-for="day in weekDays"
                :key="day"
                class="CalendarHeadCell"
              >
                {{ day }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody class="CalendarGridWrapper">
            <CalendarGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`weekDate-${index}`"
              class="CalendarGridRow"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                class="CalendarCell"
              >
                <CalendarCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  class="CalendarCellTrigger"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    </CalendarRoot>
  </div>
</template>
