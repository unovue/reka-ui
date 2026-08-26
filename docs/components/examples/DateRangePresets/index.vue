<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import type { Preset } from './presets'
import { Icon } from '@iconify/vue'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { useMediaQuery } from '@vueuse/core'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger, RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from 'reka-ui'
import { computed, ref } from 'vue'
import { presets } from './presets'

const formatter = new DateFormatter('en-US', { dateStyle: 'medium' })
const isWide = useMediaQuery('(min-width: 768px)')

const open = ref(false)
const value = ref<DateRange>(presets[2].range())
// The calendar navigates from `placeholder`, so a preset has to move it too —
// otherwise picking "Last month" leaves the view sitting on the current month.
const placeholder = ref(value.value.start)

const activePreset = computed(() => presets.find((preset) => {
  const { start, end } = preset.range()
  return start && end
    && value.value.start?.compare(start) === 0
    && value.value.end?.compare(end) === 0
}))

const label = computed(() => {
  const { start, end } = value.value
  if (!start || !end)
    return 'Pick a date range'

  const range = `${formatter.format(start.toDate(getLocalTimeZone()))} – ${formatter.format(end.toDate(getLocalTimeZone()))}`
  return activePreset.value ? `${activePreset.value.label}: ${range}` : range
})

function applyPreset(preset: Preset) {
  value.value = preset.range()
  placeholder.value = value.value.start!
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-muted bg-card text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
      <Icon
        icon="lucide:calendar"
        class="size-4 shrink-0 text-muted-foreground"
      />
      {{ label }}
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-[100] rounded-xl border border-muted bg-card p-3 shadow-lg will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
        :side-offset="6"
        align="start"
      >
        <div class="flex flex-col gap-3 md:flex-row">
          <div class="flex flex-row flex-wrap gap-1 md:w-36 md:flex-col md:border-r md:border-muted md:pr-3">
            <button
              v-for="preset in presets"
              :key="preset.label"
              type="button"
              class="rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              :class="activePreset?.label === preset.label && 'bg-muted font-semibold'"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>

          <RangeCalendarRoot
            v-slot="{ weekDays, grid }"
            v-model="value"
            v-model:placeholder="placeholder"
            class="select-none"
            :number-of-months="isWide ? 2 : 1"
            :max-value="today(getLocalTimeZone())"
            paged-navigation
            fixed-weeks
          >
            <RangeCalendarHeader class="flex items-center justify-between px-1">
              <RangeCalendarPrev class="inline-flex size-7 items-center justify-center rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40">
                <Icon
                  icon="lucide:chevron-left"
                  class="size-4"
                />
              </RangeCalendarPrev>
              <RangeCalendarHeading class="text-sm font-medium text-foreground" />
              <RangeCalendarNext class="inline-flex size-7 items-center justify-center rounded-md text-foreground hover:bg-muted disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/40">
                <Icon
                  icon="lucide:chevron-right"
                  class="size-4"
                />
              </RangeCalendarNext>
            </RangeCalendarHeader>

            <div class="flex flex-col gap-4 pt-3 sm:flex-row">
              <RangeCalendarGrid
                v-for="month in grid"
                :key="month.value.toString()"
                class="w-full border-collapse"
              >
                <RangeCalendarGridHead>
                  <RangeCalendarGridRow class="mb-1 grid w-full grid-cols-7">
                    <RangeCalendarHeadCell
                      v-for="day in weekDays"
                      :key="day"
                      class="text-[11px] font-normal text-muted-foreground"
                    >
                      {{ day }}
                    </RangeCalendarHeadCell>
                  </RangeCalendarGridRow>
                </RangeCalendarGridHead>
                <RangeCalendarGridBody class="grid">
                  <RangeCalendarGridRow
                    v-for="(weekDates, index) in month.rows"
                    :key="`week-${index}`"
                    class="grid grid-cols-7"
                  >
                    <RangeCalendarCell
                      v-for="weekDate in weekDates"
                      :key="weekDate.toString()"
                      :date="weekDate"
                    >
                      <!-- `data-selected` covers every day inside the committed range;
                           `data-highlighted` previews the range being dragged out. -->
                      <RangeCalendarCellTrigger
                        :day="weekDate"
                        :month="month.value"
                        class="flex h-8 w-full items-center justify-center rounded-md text-sm text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-primary/40 data-[outside-view]:text-muted-foreground/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[today]:font-semibold data-[highlighted]:bg-primary/10 data-[selected]:bg-primary/15 data-[selection-end]:!bg-primary data-[selection-start]:!bg-primary data-[selection-end]:text-primary-foreground data-[selection-start]:text-primary-foreground"
                      />
                    </RangeCalendarCell>
                  </RangeCalendarGridRow>
                </RangeCalendarGridBody>
              </RangeCalendarGrid>
            </div>
          </RangeCalendarRoot>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
