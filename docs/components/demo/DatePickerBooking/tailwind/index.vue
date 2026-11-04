<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import { Icon } from '@iconify/vue'
import {
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
  FieldError,
  FieldLabel,
  FieldRoot,
  FormRoot,
} from 'reka-ui'
import { isWeekend, today } from 'reka-ui/date'
import { ref } from 'vue'

// Temporal.PlainDate values: `today()` reads the user's time zone.
const now = today()
const minValue = now.add({ days: 1 })
const maxValue = now.add({ months: 3 })

// Days that are already fully booked, as ISO strings (`2026-11-12`).
const booked = new Set([now.add({ days: 3 }), now.add({ days: 4 })].map(date => date.toString()))

function isUnavailable(date: DateValue) {
  return isWeekend(date, 'en-US') || booked.has(date.toString())
}

// The calendar never offers an unavailable day, but the segments accept any
// date, so the field explains what's wrong with a typed one.
function validateDay(value: unknown) {
  const date = value as DateValue | undefined
  if (!date)
    return null
  if (isWeekend(date, 'en-US'))
    return 'We\'re closed on weekends.'
  if (booked.has(date.toString()))
    return 'That day is fully booked.'
  return null
}

const confirmed = ref<string>()

function onFormSubmit(values: Record<string, unknown>) {
  confirmed.value = (values.appointment as DateValue).toString()
}
</script>

<template>
  <FormRoot
    class="flex flex-col gap-3"
    @form-submit="onFormSubmit"
  >
    <FieldRoot
      name="appointment"
      required
      :validate="validateDay"
      class="flex flex-col gap-1.5"
    >
      <FieldLabel class="text-sm font-medium text-foreground">
        Appointment
      </FieldLabel>
      <DatePickerRoot
        :min-value="minValue"
        :max-value="maxValue"
        :is-date-unavailable="isUnavailable"
      >
        <DatePickerField
          v-slot="{ segments }"
          class="flex w-44 select-none items-center justify-between rounded-lg border border-muted bg-card p-1 text-sm text-foreground data-[invalid]:border-red-500"
        >
          <div class="flex items-center">
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
                class="rounded p-0.5 focus:bg-muted focus:outline-none data-[placeholder]:text-muted-foreground"
              >
                {{ item.value }}
              </DatePickerInput>
            </template>
          </div>
          <DatePickerTrigger
            class="rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Open calendar"
          >
            <Icon
              icon="radix-icons:calendar"
              class="h-4 w-4"
            />
          </DatePickerTrigger>
        </DatePickerField>

        <DatePickerContent
          :side-offset="4"
          class="z-[100] rounded-xl border border-muted bg-card shadow-sm data-[state=open]:data-[side=bottom]:animate-slideUpAndFade"
        >
          <DatePickerCalendar
            v-slot="{ weekDays, grid }"
            class="p-3"
          >
            <DatePickerHeader class="flex items-center justify-between">
              <DatePickerPrev class="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30">
                <Icon
                  icon="radix-icons:chevron-left"
                  class="h-4 w-4"
                />
              </DatePickerPrev>
              <DatePickerHeading class="text-sm font-medium text-foreground" />
              <DatePickerNext class="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30">
                <Icon
                  icon="radix-icons:chevron-right"
                  class="h-4 w-4"
                />
              </DatePickerNext>
            </DatePickerHeader>
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              :value="month.value"
              class="mt-3 w-full border-collapse select-none"
            >
              <DatePickerGridHead>
                <DatePickerGridRow class="mb-1 flex w-full justify-between">
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="w-8 text-xs text-muted-foreground"
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
                    :value="weekDate"
                  >
                    <DatePickerCellTrigger
                      :value="weekDate"
                      class="flex h-8 w-8 items-center justify-center rounded-md text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40 data-[outside-view]:text-muted-foreground/50 data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground/40 data-[unavailable]:pointer-events-none data-[unavailable]:text-muted-foreground/40 data-[unavailable]:line-through data-[selected]:bg-primary data-[selected]:text-primary-foreground"
                    />
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </DatePickerCalendar>
        </DatePickerContent>
      </DatePickerRoot>
      <FieldError
        match="valueMissing"
        class="text-xs text-red-500"
      >
        Pick a day for your appointment.
      </FieldError>
      <FieldError
        match="customError"
        class="text-xs text-red-500"
      />
    </FieldRoot>

    <button
      type="submit"
      class="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      Book
    </button>

    <p
      v-if="confirmed"
      class="text-xs text-muted-foreground"
      data-testid="confirmed"
    >
      Booked for {{ confirmed }}.
    </p>
  </FormRoot>
</template>
