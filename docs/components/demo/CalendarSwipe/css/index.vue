<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot } from 'reka-ui'
import './styles.css'
import { onMounted, ref, useTemplateRef } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { usePointerSwipe } from '@vueuse/core'

const calendarRef = useTemplateRef('calendarRef')
const date = ref(new CalendarDate(2023, 1, 1))

function nextPage() {
  date.value = date.value.add({ months: 1 }).copy()
}

function prevPage() {
  date.value = date.value.subtract({ months: 1 }).copy()
}

onMounted(() => {
  if (calendarRef.value) {
    usePointerSwipe(calendarRef.value.$el, {
      onSwipeEnd(_e, direction) {
        if (direction === 'none') {
          // eslint-disable-next-line no-useless-return
          return
        }
        else if (['down', 'right'].includes(direction)) {
          prevPage()
        }
        else {
          nextPage()
        }
      },
    })
  }
})
</script>

<template>
  <CalendarRoot
    ref="calendarRef"
    v-slot="{ weekDays, grid }"
    v-model:placeholder="date"
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
</template>
