import type { Component } from 'vue'
import type { Translations } from '..'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive } from 'vue'
import { createDateSegmentTranslations, createTranslate, defaultTranslate, defaultTranslations, translationKey } from '@/shared/translations'
import * as reka from '..'

enableAutoUnmount(afterEach)

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** `[selector, attribute, value]`; the attribute `text` reads the trimmed text content. */
type Check = [selector: string, attribute: string, value: string | undefined]

interface Fixture {
  /** Rendered as is: what the family announces with nothing configured. */
  template: string
  /** The built-in strings, as they were before they became translatable. */
  defaults: Check[]
  /** The same template with a consumer label on each part that takes one. */
  consumerTemplate?: string
  consumer?: Check[]
  data?: Record<string, unknown>
  /** Milliseconds to wait for output that is rendered a few frames after mount. */
  settle?: number
}

const date = new Temporal.PlainDate(2024, 1, 15)
const zoned = Temporal.ZonedDateTime.from('2024-01-15T10:30:20[America/New_York]')
const japanese = date.withCalendar('japanese')

export const fixtures: Record<string, Fixture> = {
  Calendar: {
    data: { date },
    template: `
      <CalendarRoot data-root :default-placeholder="date" locale="en">
        <CalendarPrev data-prev /><CalendarNext data-next />
      </CalendarRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Event Date, January 2024'],
      ['[data-prev]', 'aria-label', 'Previous page'],
      ['[data-next]', 'aria-label', 'Next page'],
    ],
    consumerTemplate: `
      <CalendarRoot data-root :default-placeholder="date" locale="en" calendar-label="Departure">
        <CalendarPrev data-prev aria-label="Earlier" /><CalendarNext data-next aria-label="Later" />
      </CalendarRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Departure, January 2024'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  RangeCalendar: {
    data: { date },
    template: `
      <RangeCalendarRoot data-root :default-placeholder="date" locale="en">
        <RangeCalendarPrev data-prev /><RangeCalendarNext data-next />
      </RangeCalendarRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Event Date, January 2024'],
      ['[data-prev]', 'aria-label', 'Previous page'],
      ['[data-next]', 'aria-label', 'Next page'],
    ],
    consumerTemplate: `
      <RangeCalendarRoot data-root :default-placeholder="date" locale="en" calendar-label="Stay">
        <RangeCalendarPrev data-prev aria-label="Earlier" /><RangeCalendarNext data-next aria-label="Later" />
      </RangeCalendarRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Stay, January 2024'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  MonthPicker: {
    data: { date },
    template: `
      <MonthPickerRoot data-root :default-placeholder="date" locale="en">
        <MonthPickerPrev data-prev /><MonthPickerNext data-next />
      </MonthPickerRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Month Picker, 2024'],
      ['[data-prev]', 'aria-label', 'Previous year'],
      ['[data-next]', 'aria-label', 'Next year'],
    ],
    consumerTemplate: `
      <MonthPickerRoot data-root :default-placeholder="date" locale="en" calendar-label="Billing month">
        <MonthPickerPrev data-prev aria-label="Earlier" /><MonthPickerNext data-next aria-label="Later" />
      </MonthPickerRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Billing month, 2024'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  MonthRangePicker: {
    data: { date },
    template: `
      <MonthRangePickerRoot data-root :default-placeholder="date" locale="en">
        <MonthRangePickerPrev data-prev /><MonthRangePickerNext data-next />
      </MonthRangePickerRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Month Picker, 2024'],
      ['[data-prev]', 'aria-label', 'Previous year'],
      ['[data-next]', 'aria-label', 'Next year'],
    ],
    consumerTemplate: `
      <MonthRangePickerRoot data-root :default-placeholder="date" locale="en" calendar-label="Billing months">
        <MonthRangePickerPrev data-prev aria-label="Earlier" /><MonthRangePickerNext data-next aria-label="Later" />
      </MonthRangePickerRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Billing months, 2024'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  YearPicker: {
    data: { date },
    template: `
      <YearPickerRoot data-root :default-placeholder="date" locale="en">
        <YearPickerPrev data-prev /><YearPickerNext data-next />
      </YearPickerRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Year Picker, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Previous page'],
      ['[data-next]', 'aria-label', 'Next page'],
    ],
    consumerTemplate: `
      <YearPickerRoot data-root :default-placeholder="date" locale="en" calendar-label="Model year">
        <YearPickerPrev data-prev aria-label="Earlier" /><YearPickerNext data-next aria-label="Later" />
      </YearPickerRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Model year, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  YearRangePicker: {
    data: { date },
    template: `
      <YearRangePickerRoot data-root :default-placeholder="date" locale="en">
        <YearRangePickerPrev data-prev /><YearRangePickerNext data-next />
      </YearRangePickerRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'Year Picker, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Previous page'],
      ['[data-next]', 'aria-label', 'Next page'],
    ],
    consumerTemplate: `
      <YearRangePickerRoot data-root :default-placeholder="date" locale="en" calendar-label="Model years">
        <YearRangePickerPrev data-prev aria-label="Earlier" /><YearRangePickerNext data-next aria-label="Later" />
      </YearRangePickerRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Model years, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Earlier'],
      ['[data-next]', 'aria-label', 'Later'],
    ],
  },
  Carousel: {
    template: `
      <CarouselRoot data-root :autoplay="{ delay: 4000 }">
        <CarouselAutoplayToggle data-toggle />
        <CarouselPrevious data-prev /><CarouselNext data-next />
        <CarouselViewport><CarouselContent>
          <CarouselItem data-item>One</CarouselItem><CarouselItem>Two</CarouselItem>
        </CarouselContent></CarouselViewport>
        <CarouselIndicator data-indicator :index="1" />
      </CarouselRoot>`,
    defaults: [
      ['[data-root]', 'aria-roledescription', 'carousel'],
      ['[data-toggle]', 'aria-label', 'Stop slide rotation'],
      ['[data-prev]', 'aria-label', 'Previous slide'],
      ['[data-next]', 'aria-label', 'Next slide'],
      ['[data-item]', 'aria-roledescription', 'slide'],
      ['[data-item]', 'aria-label', '1 of 2'],
      ['[data-indicator]', 'aria-label', 'Go to slide 2'],
    ],
    consumerTemplate: `
      <CarouselRoot data-root aria-roledescription="gallery">
        <CarouselAutoplayToggle data-toggle aria-label="Pause" />
        <CarouselPrevious data-prev aria-label="Back" /><CarouselNext data-next aria-label="Forward" />
        <CarouselViewport><CarouselContent>
          <CarouselItem data-item aria-label="Cover" aria-roledescription="photo">One</CarouselItem><CarouselItem>Two</CarouselItem>
        </CarouselContent></CarouselViewport>
        <CarouselIndicator data-indicator :index="1" aria-label="Second photo" />
      </CarouselRoot>`,
    consumer: [
      ['[data-root]', 'aria-roledescription', 'gallery'],
      ['[data-toggle]', 'aria-label', 'Pause'],
      ['[data-prev]', 'aria-label', 'Back'],
      ['[data-next]', 'aria-label', 'Forward'],
      ['[data-item]', 'aria-roledescription', 'photo'],
      ['[data-item]', 'aria-label', 'Cover'],
      ['[data-indicator]', 'aria-label', 'Second photo'],
    ],
  },
  CarouselTabs: {
    template: `
      <CarouselRoot :autoplay="{ delay: 4000 }" :default-playing="false">
        <CarouselAutoplayToggle data-toggle />
        <CarouselViewport><CarouselContent>
          <CarouselItem>One</CarouselItem><CarouselItem>Two</CarouselItem>
        </CarouselContent></CarouselViewport>
        <CarouselIndicatorGroup data-group>
          <CarouselIndicator data-indicator :index="1" />
        </CarouselIndicatorGroup>
      </CarouselRoot>`,
    defaults: [
      ['[data-toggle]', 'aria-label', 'Start slide rotation'],
      ['[data-group]', 'aria-label', 'Choose slide to display'],
      ['[data-indicator]', 'aria-label', 'Slide 2'],
    ],
    consumerTemplate: `
      <CarouselRoot>
        <CarouselViewport><CarouselContent>
          <CarouselItem>One</CarouselItem><CarouselItem>Two</CarouselItem>
        </CarouselContent></CarouselViewport>
        <CarouselIndicatorGroup data-group aria-label="Photos">
          <CarouselIndicator data-indicator :index="1" aria-label="Second photo" />
        </CarouselIndicatorGroup>
      </CarouselRoot>`,
    consumer: [
      ['[data-group]', 'aria-label', 'Photos'],
      ['[data-indicator]', 'aria-label', 'Second photo'],
    ],
  },
  ColorArea: {
    template: `
      <ColorAreaRoot model-value="#ff0000">
        <ColorAreaArea data-area><ColorAreaThumb data-thumb /></ColorAreaArea>
      </ColorAreaRoot>`,
    defaults: [
      ['[data-area]', 'aria-roledescription', 'Color picker'],
      ['[data-thumb]', 'aria-roledescription', 'Color thumb'],
      ['[data-thumb]', 'aria-label', 'Hue, Saturation'],
      ['[data-thumb]', 'aria-valuetext', 'Hue 0, Saturation 100'],
    ],
    consumerTemplate: `
      <ColorAreaRoot model-value="#ff0000">
        <ColorAreaArea data-area aria-roledescription="Palette"><ColorAreaThumb data-thumb aria-label="Shade" aria-roledescription="Handle" /></ColorAreaArea>
      </ColorAreaRoot>`,
    consumer: [
      ['[data-area]', 'aria-roledescription', 'Palette'],
      ['[data-thumb]', 'aria-roledescription', 'Handle'],
      ['[data-thumb]', 'aria-label', 'Shade'],
    ],
  },
  ColorSlider: {
    template: `
      <div>
        <ColorSliderRoot v-for="channel in channels" :key="channel" model-value="#ff0000" :channel="channel" :color-space="space(channel)">
          <ColorSliderTrack /><ColorSliderThumb :data-thumb="channel" />
        </ColorSliderRoot>
      </div>`,
    data: {
      channels: ['red', 'green', 'blue', 'hue', 'saturation', 'lightness', 'brightness', 'alpha'],
      space: (channel: string) => ['red', 'green', 'blue'].includes(channel) ? 'rgb' : channel === 'brightness' ? 'hsb' : 'hsl',
    },
    defaults: [
      ['[data-thumb="red"]', 'aria-label', 'Red'],
      ['[data-thumb="green"]', 'aria-label', 'Green'],
      ['[data-thumb="blue"]', 'aria-label', 'Blue'],
      ['[data-thumb="hue"]', 'aria-label', 'Hue'],
      ['[data-thumb="saturation"]', 'aria-label', 'Saturation'],
      ['[data-thumb="lightness"]', 'aria-label', 'Lightness'],
      ['[data-thumb="brightness"]', 'aria-label', 'Brightness'],
      ['[data-thumb="alpha"]', 'aria-label', 'Alpha'],
    ],
  },
  ColorSwatch: {
    template: `<div><ColorSwatch data-swatch color="#ff0000" /><ColorSwatch data-empty color="" /></div>`,
    defaults: [
      ['[data-swatch]', 'aria-roledescription', 'color swatch'],
      ['[data-empty]', 'aria-label', 'transparent'],
    ],
    consumerTemplate: `<div><ColorSwatch data-swatch color="#ff0000" aria-roledescription="paint chip" /><ColorSwatch data-empty color="" label="No colour" /></div>`,
    consumer: [
      ['[data-swatch]', 'aria-roledescription', 'paint chip'],
      ['[data-empty]', 'aria-label', 'No colour'],
    ],
  },
  Combobox: {
    template: `<ComboboxRoot><ComboboxAnchor><ComboboxInput /><ComboboxTrigger data-trigger /></ComboboxAnchor></ComboboxRoot>`,
    defaults: [['[data-trigger]', 'aria-label', 'Show popup']],
    consumerTemplate: `<ComboboxRoot><ComboboxAnchor><ComboboxInput /><ComboboxTrigger data-trigger aria-label="Open fruits" /></ComboboxAnchor></ComboboxRoot>`,
    consumer: [['[data-trigger]', 'aria-label', 'Open fruits']],
  },
  DateField: {
    data: { zoned, japanese },
    template: `
      <div>
        <DateFieldRoot v-slot="{ segments }" :default-value="zoned" granularity="second" locale="en">
          <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-filled="item.part">{{ item.value }}</DateFieldInput>
        </DateFieldRoot>
        <DateFieldRoot v-slot="{ segments }" granularity="second" locale="en">
          <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-empty="item.part">{{ item.value }}</DateFieldInput>
        </DateFieldRoot>
        <DateFieldRoot v-slot="{ segments }" :default-value="japanese" locale="en-u-ca-japanese">
          <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-japanese="item.part">{{ item.value }}</DateFieldInput>
        </DateFieldRoot>
      </div>`,
    defaults: [
      ['[data-filled="day"]', 'aria-label', 'day,'],
      ['[data-filled="month"]', 'aria-label', 'month, '],
      ['[data-filled="year"]', 'aria-label', 'year, '],
      ['[data-filled="hour"]', 'aria-label', 'hour, '],
      ['[data-filled="minute"]', 'aria-label', 'minute, '],
      ['[data-filled="second"]', 'aria-label', 'second, '],
      ['[data-filled="dayPeriod"]', 'aria-label', 'AM/PM'],
      ['[data-filled="timeZoneName"]', 'aria-label', 'timezone, '],
      ['[data-japanese="era"]', 'aria-label', 'era'],
      ['[data-filled="day"]', 'aria-valuetext', '15'],
      ['[data-filled="month"]', 'aria-valuetext', '1 - January'],
      ['[data-empty="day"]', 'aria-valuetext', 'Empty'],
      ['[data-empty="month"]', 'aria-valuetext', 'Empty'],
      ['[data-empty="year"]', 'aria-valuetext', 'Empty'],
      ['[data-empty="hour"]', 'aria-valuetext', 'Empty'],
      ['[data-empty="minute"]', 'aria-valuetext', 'Empty'],
      ['[data-empty="second"]', 'aria-valuetext', 'Empty'],
    ],
    consumerTemplate: `
      <DateFieldRoot v-slot="{ segments }" :default-value="zoned" locale="en">
        <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-filled="item.part" :aria-label="'Custom ' + item.part">{{ item.value }}</DateFieldInput>
      </DateFieldRoot>`,
    consumer: [
      ['[data-filled="day"]', 'aria-label', 'Custom day'],
      ['[data-filled="month"]', 'aria-label', 'Custom month'],
      ['[data-filled="year"]', 'aria-label', 'Custom year'],
    ],
  },
  TimeField: {
    template: `
      <TimeFieldRoot v-slot="{ segments }" granularity="second" locale="en">
        <TimeFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-part="item.part">{{ item.value }}</TimeFieldInput>
      </TimeFieldRoot>`,
    defaults: [
      ['[data-part="hour"]', 'aria-label', 'hour, '],
      ['[data-part="minute"]', 'aria-label', 'minute, '],
      ['[data-part="second"]', 'aria-label', 'second, '],
      ['[data-part="dayPeriod"]', 'aria-label', 'AM/PM'],
      ['[data-part="hour"]', 'aria-valuetext', 'Empty'],
    ],
  },
  Editable: {
    template: `
      <EditableRoot default-value="Title">
        <EditableArea><EditablePreview /><EditableInput data-input /></EditableArea>
        <EditableEditTrigger data-edit /><EditableSubmitTrigger data-submit /><EditableCancelTrigger data-cancel />
      </EditableRoot>`,
    defaults: [
      ['[data-input]', 'aria-label', 'editable input'],
      ['[data-edit]', 'aria-label', 'edit'],
      ['[data-submit]', 'aria-label', 'submit'],
      ['[data-cancel]', 'aria-label', 'cancel'],
    ],
    consumerTemplate: `
      <EditableRoot default-value="Title">
        <EditableArea><EditablePreview /><EditableInput data-input aria-label="Document title" /></EditableArea>
        <EditableEditTrigger data-edit aria-label="Rename" /><EditableSubmitTrigger data-submit aria-label="Save" /><EditableCancelTrigger data-cancel aria-label="Discard" />
      </EditableRoot>`,
    consumer: [
      ['[data-input]', 'aria-label', 'Document title'],
      ['[data-edit]', 'aria-label', 'Rename'],
      ['[data-submit]', 'aria-label', 'Save'],
      ['[data-cancel]', 'aria-label', 'Discard'],
    ],
  },
  NumberField: {
    template: `
      <NumberFieldRoot :default-value="1">
        <NumberFieldDecrement data-decrement /><NumberFieldInput data-input /><NumberFieldIncrement data-increment />
      </NumberFieldRoot>`,
    defaults: [
      ['[data-input]', 'aria-roledescription', 'Number field'],
      ['[data-decrement]', 'aria-label', 'Decrease'],
      ['[data-increment]', 'aria-label', 'Increase'],
    ],
    consumerTemplate: `
      <NumberFieldRoot :default-value="1">
        <NumberFieldDecrement data-decrement aria-label="Fewer" /><NumberFieldInput data-input aria-roledescription="Quantity" /><NumberFieldIncrement data-increment aria-label="More" />
      </NumberFieldRoot>`,
    consumer: [
      ['[data-input]', 'aria-roledescription', 'Quantity'],
      ['[data-decrement]', 'aria-label', 'Fewer'],
      ['[data-increment]', 'aria-label', 'More'],
    ],
  },
  Pagination: {
    template: `
      <PaginationRoot data-root :total="30" :items-per-page="10">
        <PaginationList v-slot="{ items }">
          <PaginationFirst data-first /><PaginationPrev data-prev />
          <template v-for="item in items" :key="item.value">
            <PaginationListItem v-if="item.type === 'page'" :value="item.value" :data-page="item.value" />
          </template>
          <PaginationNext data-next /><PaginationLast data-last />
        </PaginationList>
      </PaginationRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'pagination'],
      ['[data-first]', 'aria-label', 'First Page'],
      ['[data-prev]', 'aria-label', 'Previous Page'],
      ['[data-page="2"]', 'aria-label', 'Page 2'],
      ['[data-next]', 'aria-label', 'Next Page'],
      ['[data-last]', 'aria-label', 'Last Page'],
    ],
    consumerTemplate: `
      <PaginationRoot data-root :total="30" :items-per-page="10" aria-label="Search results">
        <PaginationList v-slot="{ items }">
          <PaginationFirst data-first aria-label="Start" /><PaginationPrev data-prev aria-label="Back" />
          <template v-for="item in items" :key="item.value">
            <PaginationListItem v-if="item.type === 'page'" :value="item.value" :data-page="item.value" :aria-label="'Results ' + item.value" />
          </template>
          <PaginationNext data-next aria-label="Forward" /><PaginationLast data-last aria-label="End" />
        </PaginationList>
      </PaginationRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Search results'],
      ['[data-first]', 'aria-label', 'Start'],
      ['[data-prev]', 'aria-label', 'Back'],
      ['[data-page="2"]', 'aria-label', 'Results 2'],
      ['[data-next]', 'aria-label', 'Forward'],
      ['[data-last]', 'aria-label', 'End'],
    ],
  },
  PinInput: {
    template: `
      <PinInputRoot>
        <PinInputInput v-for="index in 3" :key="index" :index="index - 1" :data-pin="index" />
      </PinInputRoot>`,
    defaults: [
      ['[data-pin="1"]', 'aria-label', 'pin input 1 of 3'],
      ['[data-pin="3"]', 'aria-label', 'pin input 3 of 3'],
    ],
    consumerTemplate: `
      <PinInputRoot>
        <PinInputInput v-for="index in 3" :key="index" :index="index - 1" :data-pin="index" :aria-label="'Digit ' + index" />
      </PinInputRoot>`,
    consumer: [['[data-pin="1"]', 'aria-label', 'Digit 1']],
  },
  Slider: {
    template: `
      <div>
        <SliderRoot :default-value="[20, 80]"><SliderTrack><SliderRange /></SliderTrack><SliderThumb data-two="0" /><SliderThumb data-two="1" /></SliderRoot>
        <SliderRoot :default-value="[20, 50, 80]"><SliderTrack><SliderRange /></SliderTrack><SliderThumb data-three="0" /><SliderThumb data-three="1" /><SliderThumb data-three="2" /></SliderRoot>
      </div>`,
    defaults: [
      ['[data-two="0"]', 'aria-label', 'Minimum'],
      ['[data-two="1"]', 'aria-label', 'Maximum'],
      ['[data-three="1"]', 'aria-label', 'Value 2 of 3'],
    ],
    consumerTemplate: `
      <SliderRoot :default-value="[20, 80]"><SliderTrack><SliderRange /></SliderTrack><SliderThumb data-two="0" aria-label="Cheapest" /><SliderThumb data-two="1" aria-label="Priciest" /></SliderRoot>`,
    consumer: [
      ['[data-two="0"]', 'aria-label', 'Cheapest'],
      ['[data-two="1"]', 'aria-label', 'Priciest'],
    ],
  },
  SliderArea: {
    template: `
      <SliderAreaRoot :default-value="[[10, 10], [50, 50]]">
        <SliderAreaArea><SliderAreaThumb data-thumb="0" /><SliderAreaThumb data-thumb="1" /></SliderAreaArea>
      </SliderAreaRoot>`,
    defaults: [
      ['[data-thumb="0"]', 'aria-roledescription', '2D slider'],
      ['[data-thumb="0"]', 'aria-label', 'Minimum'],
      ['[data-thumb="1"]', 'aria-label', 'Maximum'],
    ],
    consumerTemplate: `
      <SliderAreaRoot :default-value="[[10, 10], [50, 50]]">
        <SliderAreaArea><SliderAreaThumb data-thumb="0" aria-label="Start" /><SliderAreaThumb data-thumb="1" /></SliderAreaArea>
      </SliderAreaRoot>`,
    consumer: [['[data-thumb="0"]', 'aria-label', 'Start']],
  },
  Stepper: {
    template: `
      <StepperRoot data-root :default-value="2">
        <StepperItem v-for="step in 3" :key="step" :step="step"><StepperTrigger>Step</StepperTrigger></StepperItem>
      </StepperRoot>`,
    defaults: [
      ['[data-root]', 'aria-label', 'progress'],
      ['[data-root] > [role="status"]', 'text', 'Step 2 of 3'],
    ],
    consumerTemplate: `
      <StepperRoot data-root :default-value="2" aria-label="Checkout" :announce="(step, total) => step + '/' + total">
        <StepperItem v-for="step in 3" :key="step" :step="step"><StepperTrigger>Step</StepperTrigger></StepperItem>
      </StepperRoot>`,
    consumer: [
      ['[data-root]', 'aria-label', 'Checkout'],
      ['[data-root] > [role="status"]', 'text', '2/3'],
    ],
  },
  TagGroup: {
    template: `
      <TagGroupRoot aria-label="Frameworks" @remove="() => {}">
        <TagGroupItem value="Vue"><TagGroupItemText>Vue</TagGroupItemText><TagGroupItemDelete data-delete>x</TagGroupItemDelete></TagGroupItem>
      </TagGroupRoot>`,
    defaults: [['[data-delete]', 'aria-label', 'Remove']],
    consumerTemplate: `
      <TagGroupRoot aria-label="Frameworks" @remove="() => {}">
        <TagGroupItem value="Vue"><TagGroupItemText>Vue</TagGroupItemText><TagGroupItemDelete data-delete aria-label="Delete">x</TagGroupItemDelete></TagGroupItem>
      </TagGroupRoot>`,
    consumer: [['[data-delete]', 'aria-label', 'Delete']],
  },
  Toast: {
    template: `
      <ToastProvider>
        <ToastRoot :open="true"><ToastTitle>Saved</ToastTitle></ToastRoot>
        <ToastViewport data-viewport />
      </ToastProvider>`,
    defaults: [
      ['[role="region"]', 'aria-label', 'Notifications (F8)'],
      ['[role="alert"]', 'text', 'Notification Saved'],
    ],
    settle: 60,
    consumerTemplate: `
      <ToastProvider label="Alert">
        <ToastRoot :open="true"><ToastTitle>Saved</ToastTitle></ToastRoot>
        <ToastViewport data-viewport label="Alerts, press {hotkey}" />
      </ToastProvider>`,
    consumer: [
      ['[role="region"]', 'aria-label', 'Alerts, press F8'],
      ['[role="alert"]', 'text', 'Alert Saved'],
    ],
  },
}

export async function mountFixture(fixture: Fixture, template = fixture.template, config: Record<string, unknown> = {}) {
  document.body.innerHTML = ''
  const wrapper = mount(defineComponent({
    components: reka as unknown as Record<string, Component>,
    setup: () => ({ ...fixture.data, config }),
    template: `<ConfigProvider v-bind="config">${template}</ConfigProvider>`,
  }), { attachTo: document.body })
  await nextTick()
  await nextTick()
  if (fixture.settle)
    await new Promise(resolve => setTimeout(resolve, fixture.settle))
  return wrapper
}

export function read([selector, attribute]: Check) {
  const element = document.body.querySelector(selector)
  if (!element)
    throw new Error(`Nothing matches ${selector}`)
  return attribute === 'text' ? element.textContent?.replace(/\s+/g, ' ').trim() : element.getAttribute(attribute) ?? undefined
}

/** For each fixture: messages for every key it shows, and what it then announces. */
const translated: Record<string, { translations: Partial<Translations>, checks: Check[] }> = {
  Calendar: {
    translations: { calendarLabel: 'Datum', calendarPrev: 'Vorherige Seite', calendarNext: 'Nächste Seite' },
    checks: [
      ['[data-root]', 'aria-label', 'Datum, January 2024'],
      ['[data-prev]', 'aria-label', 'Vorherige Seite'],
      ['[data-next]', 'aria-label', 'Nächste Seite'],
    ],
  },
  RangeCalendar: {
    translations: { calendarLabel: 'Zeitraum', calendarPrev: 'Vorherige Seite', calendarNext: 'Nächste Seite' },
    checks: [
      ['[data-root]', 'aria-label', 'Zeitraum, January 2024'],
      ['[data-prev]', 'aria-label', 'Vorherige Seite'],
      ['[data-next]', 'aria-label', 'Nächste Seite'],
    ],
  },
  MonthPicker: {
    translations: { monthPickerLabel: 'Monat wählen', monthPickerPrev: 'Vorheriges Jahr', monthPickerNext: 'Nächstes Jahr' },
    checks: [
      ['[data-root]', 'aria-label', 'Monat wählen, 2024'],
      ['[data-prev]', 'aria-label', 'Vorheriges Jahr'],
      ['[data-next]', 'aria-label', 'Nächstes Jahr'],
    ],
  },
  MonthRangePicker: {
    translations: { monthPickerLabel: 'Monate wählen', monthPickerPrev: 'Vorheriges Jahr', monthPickerNext: 'Nächstes Jahr' },
    checks: [
      ['[data-root]', 'aria-label', 'Monate wählen, 2024'],
      ['[data-prev]', 'aria-label', 'Vorheriges Jahr'],
      ['[data-next]', 'aria-label', 'Nächstes Jahr'],
    ],
  },
  YearPicker: {
    translations: { yearPickerLabel: 'Jahr wählen', yearPickerPrev: 'Frühere Jahre', yearPickerNext: 'Spätere Jahre' },
    checks: [
      ['[data-root]', 'aria-label', 'Jahr wählen, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Frühere Jahre'],
      ['[data-next]', 'aria-label', 'Spätere Jahre'],
    ],
  },
  YearRangePicker: {
    translations: { yearPickerLabel: 'Jahre wählen', yearPickerPrev: 'Frühere Jahre', yearPickerNext: 'Spätere Jahre' },
    checks: [
      ['[data-root]', 'aria-label', 'Jahre wählen, 2020 - 2031'],
      ['[data-prev]', 'aria-label', 'Frühere Jahre'],
      ['[data-next]', 'aria-label', 'Spätere Jahre'],
    ],
  },
  Carousel: {
    translations: {
      carouselRoleDescription: 'Karussell',
      carouselStopRotation: 'Wechsel anhalten',
      carouselPrev: 'Vorherige Folie',
      carouselNext: 'Nächste Folie',
      carouselSlideRoleDescription: 'Folie',
      carouselSlideLabel: '{index} von {total}',
      carouselIndicator: ({ index }) => `Gehe zu Folie ${index}`,
    },
    checks: [
      ['[data-root]', 'aria-roledescription', 'Karussell'],
      ['[data-toggle]', 'aria-label', 'Wechsel anhalten'],
      ['[data-prev]', 'aria-label', 'Vorherige Folie'],
      ['[data-next]', 'aria-label', 'Nächste Folie'],
      ['[data-item]', 'aria-roledescription', 'Folie'],
      ['[data-item]', 'aria-label', '1 von 2'],
      ['[data-indicator]', 'aria-label', 'Gehe zu Folie 2'],
    ],
  },
  CarouselTabs: {
    translations: { carouselStartRotation: 'Wechsel starten', carouselIndicatorGroup: 'Folie wählen', carouselIndicatorTab: 'Folie {index}' },
    checks: [
      ['[data-toggle]', 'aria-label', 'Wechsel starten'],
      ['[data-group]', 'aria-label', 'Folie wählen'],
      ['[data-indicator]', 'aria-label', 'Folie 2'],
    ],
  },
  ColorArea: {
    translations: { colorAreaRoleDescription: 'Farbwähler', colorAreaThumbRoleDescription: 'Farbregler', colorChannelHue: 'Farbton', colorChannelSaturation: 'Sättigung' },
    checks: [
      ['[data-area]', 'aria-roledescription', 'Farbwähler'],
      ['[data-thumb]', 'aria-roledescription', 'Farbregler'],
      ['[data-thumb]', 'aria-label', 'Farbton, Sättigung'],
      ['[data-thumb]', 'aria-valuetext', 'Farbton 0, Sättigung 100'],
    ],
  },
  ColorSlider: {
    translations: {
      colorChannelRed: 'Rot',
      colorChannelGreen: 'Grün',
      colorChannelBlue: 'Blau',
      colorChannelHue: 'Farbton',
      colorChannelSaturation: 'Sättigung',
      colorChannelLightness: 'Helligkeit',
      colorChannelBrightness: 'Leuchtkraft',
      colorChannelAlpha: 'Deckkraft',
    },
    checks: [
      ['[data-thumb="red"]', 'aria-label', 'Rot'],
      ['[data-thumb="green"]', 'aria-label', 'Grün'],
      ['[data-thumb="blue"]', 'aria-label', 'Blau'],
      ['[data-thumb="hue"]', 'aria-label', 'Farbton'],
      ['[data-thumb="saturation"]', 'aria-label', 'Sättigung'],
      ['[data-thumb="lightness"]', 'aria-label', 'Helligkeit'],
      ['[data-thumb="brightness"]', 'aria-label', 'Leuchtkraft'],
      ['[data-thumb="alpha"]', 'aria-label', 'Deckkraft'],
    ],
  },
  ColorSwatch: {
    translations: { colorSwatchRoleDescription: 'Farbfeld', colorSwatchTransparent: 'durchsichtig' },
    checks: [
      ['[data-swatch]', 'aria-roledescription', 'Farbfeld'],
      ['[data-empty]', 'aria-label', 'durchsichtig'],
    ],
  },
  Combobox: {
    translations: { comboboxTrigger: 'Liste öffnen' },
    checks: [['[data-trigger]', 'aria-label', 'Liste öffnen']],
  },
  DateField: {
    translations: {
      dateFieldDay: 'Tag',
      dateFieldMonth: 'Monat',
      dateFieldYear: 'Jahr',
      dateFieldHour: 'Stunde',
      dateFieldMinute: 'Minute',
      dateFieldSecond: 'Sekunde',
      dateFieldDayPeriod: 'Tageshälfte',
      dateFieldTimeZoneName: 'Zeitzone',
      dateFieldEra: 'Epoche',
      dateFieldEmpty: 'Leer',
    },
    checks: [
      ['[data-filled="day"]', 'aria-label', 'Tag'],
      ['[data-filled="month"]', 'aria-label', 'Monat'],
      ['[data-filled="year"]', 'aria-label', 'Jahr'],
      ['[data-filled="hour"]', 'aria-label', 'Stunde'],
      ['[data-filled="minute"]', 'aria-label', 'Minute'],
      ['[data-filled="second"]', 'aria-label', 'Sekunde'],
      ['[data-filled="dayPeriod"]', 'aria-label', 'Tageshälfte'],
      ['[data-filled="timeZoneName"]', 'aria-label', 'Zeitzone'],
      ['[data-japanese="era"]', 'aria-label', 'Epoche'],
      ['[data-filled="day"]', 'aria-valuetext', '15'],
      ['[data-empty="day"]', 'aria-valuetext', 'Leer'],
      ['[data-empty="month"]', 'aria-valuetext', 'Leer'],
      ['[data-empty="year"]', 'aria-valuetext', 'Leer'],
      ['[data-empty="hour"]', 'aria-valuetext', 'Leer'],
      ['[data-empty="minute"]', 'aria-valuetext', 'Leer'],
      ['[data-empty="second"]', 'aria-valuetext', 'Leer'],
    ],
  },
  TimeField: {
    translations: { dateFieldHour: 'Stunde', dateFieldMinute: 'Minute', dateFieldSecond: 'Sekunde', dateFieldDayPeriod: 'Tageshälfte', dateFieldEmpty: 'Leer' },
    checks: [
      ['[data-part="hour"]', 'aria-label', 'Stunde'],
      ['[data-part="minute"]', 'aria-label', 'Minute'],
      ['[data-part="second"]', 'aria-label', 'Sekunde'],
      ['[data-part="dayPeriod"]', 'aria-label', 'Tageshälfte'],
      ['[data-part="hour"]', 'aria-valuetext', 'Leer'],
    ],
  },
  Editable: {
    translations: { editableInput: 'Eingabe', editableEdit: 'Bearbeiten', editableSubmit: 'Speichern', editableCancel: 'Abbrechen' },
    checks: [
      ['[data-input]', 'aria-label', 'Eingabe'],
      ['[data-edit]', 'aria-label', 'Bearbeiten'],
      ['[data-submit]', 'aria-label', 'Speichern'],
      ['[data-cancel]', 'aria-label', 'Abbrechen'],
    ],
  },
  NumberField: {
    translations: { numberFieldRoleDescription: 'Zahlenfeld', numberFieldDecrement: 'Verringern', numberFieldIncrement: 'Erhöhen' },
    checks: [
      ['[data-input]', 'aria-roledescription', 'Zahlenfeld'],
      ['[data-decrement]', 'aria-label', 'Verringern'],
      ['[data-increment]', 'aria-label', 'Erhöhen'],
    ],
  },
  Pagination: {
    translations: {
      paginationLabel: 'Seiten',
      paginationFirst: 'Erste Seite',
      paginationPrev: 'Vorherige Seite',
      paginationPage: 'Seite {page}',
      paginationNext: 'Nächste Seite',
      paginationLast: 'Letzte Seite',
    },
    checks: [
      ['[data-root]', 'aria-label', 'Seiten'],
      ['[data-first]', 'aria-label', 'Erste Seite'],
      ['[data-prev]', 'aria-label', 'Vorherige Seite'],
      ['[data-page="2"]', 'aria-label', 'Seite 2'],
      ['[data-next]', 'aria-label', 'Nächste Seite'],
      ['[data-last]', 'aria-label', 'Letzte Seite'],
    ],
  },
  PinInput: {
    translations: { pinInputLabel: 'PIN', pinInputLabelIndexed: ({ index, total }) => `PIN-Stelle ${index} von ${total}` },
    checks: [
      ['[data-pin="1"]', 'aria-label', 'PIN-Stelle 1 von 3'],
      ['[data-pin="3"]', 'aria-label', 'PIN-Stelle 3 von 3'],
    ],
  },
  Slider: {
    translations: { sliderMinimum: 'Minimum (de)', sliderMaximum: 'Maximum (de)', sliderValue: 'Wert {index} von {total}' },
    checks: [
      ['[data-two="0"]', 'aria-label', 'Minimum (de)'],
      ['[data-two="1"]', 'aria-label', 'Maximum (de)'],
      ['[data-three="1"]', 'aria-label', 'Wert 2 von 3'],
    ],
  },
  SliderArea: {
    translations: { sliderAreaRoleDescription: '2D-Regler', sliderMinimum: 'Anfang', sliderMaximum: 'Schluss' },
    checks: [
      ['[data-thumb="0"]', 'aria-roledescription', '2D-Regler'],
      ['[data-thumb="0"]', 'aria-label', 'Anfang'],
      ['[data-thumb="1"]', 'aria-label', 'Schluss'],
    ],
  },
  Stepper: {
    translations: { stepperLabel: 'Fortschritt', stepperAnnouncement: 'Schritt {step} von {total}' },
    checks: [
      ['[data-root]', 'aria-label', 'Fortschritt'],
      ['[data-root] > [role="status"]', 'text', 'Schritt 2 von 3'],
    ],
  },
  TagGroup: {
    translations: { tagGroupRemove: 'Entfernen' },
    checks: [['[data-delete]', 'aria-label', 'Entfernen']],
  },
  Toast: {
    translations: { toastLabel: 'Hinweis', toastViewportLabel: 'Hinweise ({hotkey})' },
    checks: [
      ['[role="region"]', 'aria-label', 'Hinweise (F8)'],
      ['[role="alert"]', 'text', 'Hinweis Saved'],
    ],
  },
}

// TODO(v3-port): #3418 the other parts keep hard-coded labels in v3
const TRANSLATED_IN_V3 = new Set(['Carousel', 'CarouselTabs', 'ColorSlider', 'ColorSwatch', 'Editable', 'NumberField', 'PinInput', 'Slider', 'SliderArea'])
// TODO(v3-port): #3418 the Month/Year pickers are deleted in v3
const DELETED_IN_V3 = new Set(['MonthPicker', 'MonthRangePicker', 'YearPicker', 'YearRangePicker'])
// TODO(v3-port): #3418 #3388 v3's ColorArea and PaginationRoot have no built-in roledescription / aria-label
const NO_DEFAULT_LABEL_IN_V3 = new Set(['ColorArea', 'Pagination'])
// TODO(v3-port): #3116 v3's StepperRoot has no `announce` prop
const NO_CONSUMER_LABEL_IN_V3 = new Set(['Stepper'])
const itDefaults = (name: string) => DELETED_IN_V3.has(name) || NO_DEFAULT_LABEL_IN_V3.has(name) ? it.skip : it
const itConsumer = (name: string, fixture: Fixture) => DELETED_IN_V3.has(name) || NO_CONSUMER_LABEL_IN_V3.has(name) ? it.skip : it.runIf(fixture.consumer)

describe('built-in accessible labels', () => {
  describe.each(Object.entries(fixtures))('%s', (name, fixture) => {
    itDefaults(name)('keeps its English strings when nothing is configured', async () => {
      await mountFixture(fixture)
      expect(fixture.defaults.map(read)).toEqual(fixture.defaults.map(check => check[2]))
    })

    itConsumer(name, fixture)('lets a consumer label win', async () => {
      await mountFixture(fixture, fixture.consumerTemplate)
      expect(fixture.consumer!.map(read)).toEqual(fixture.consumer!.map(check => check[2]))
    })
  })
})

describe('translations on ConfigProvider', () => {
  describe.each(Object.entries(fixtures))('%s', (name, fixture) => {
    ;(TRANSLATED_IN_V3.has(name) ? it : it.skip)('announces the messages it is given', async () => {
      await mountFixture(fixture, fixture.template, { translations: translated[name].translations })
      expect(translated[name].checks.map(read)).toEqual(translated[name].checks.map(check => check[2]))
    })

    itDefaults(name)('is unchanged by a provider that sets nothing, or spreads the defaults', async () => {
      await mountFixture(fixture, fixture.template, { translations: {} })
      expect(fixture.defaults.map(read)).toEqual(fixture.defaults.map(check => check[2]))
      await mountFixture(fixture, fixture.template, { translations: { ...defaultTranslations } })
      expect(fixture.defaults.map(read)).toEqual(fixture.defaults.map(check => check[2]))
    })

    itConsumer(name, fixture)('lets a consumer label win over a message', async () => {
      await mountFixture(fixture, fixture.consumerTemplate, { translations: translated[name].translations })
      expect(fixture.consumer!.map(read)).toEqual(fixture.consumer!.map(check => check[2]))
    })
  })

  it('has a fixture for every key', () => {
    const covered = new Set(Object.values(translated).flatMap(entry => Object.keys(entry.translations)))
    expect(Object.keys(defaultTranslations).filter(key => !covered.has(key))).toEqual([])
  })

  // TODO(v3-port): #3418 the i18n guide was resolved to v3's, which has no translations table
  it.skip('is documented key by key, with the defaults', () => {
    const guide = readFileSync(resolve(__dirname, '../../../../docs/content/docs/guides/i18n.md'), 'utf8')
    const missing = Object.entries(defaultTranslations).filter(([key, message]) => !guide.includes(`| \`${key}\` | \`${message}\` |`))
    expect(missing).toEqual([])
  })

  it('names the pin input before its position is known', () => {
    // The position is known from the first render in every fixture, so the message is looked up directly.
    expect(createTranslate(() => translated.PinInput.translations)('pinInputLabel')).toBe('PIN')
  })

  // TODO(v3-port): #3418 v3's Pagination parts do not call useTranslations
  it.skip('follows a change of the messages', async () => {
    const config = reactive<{ translations: Partial<Translations> }>({ translations: { paginationNext: 'Weiter' } })
    await mountFixture(fixtures.Pagination, fixtures.Pagination.template, config)
    expect(read(['[data-next]', 'aria-label', ''])).toBe('Weiter')

    config.translations = { paginationNext: 'Suivant' }
    await nextTick()
    expect(read(['[data-next]', 'aria-label', ''])).toBe('Suivant')

    config.translations = {}
    await nextTick()
    expect(read(['[data-next]', 'aria-label', ''])).toBe('Next Page')
  })

  // TODO(v3-port): #3418 v3's Pagination parts do not call useTranslations
  it.skip('inherits the keys a nested provider leaves out', async () => {
    document.body.innerHTML = ''
    mount(defineComponent({
      components: reka as unknown as Record<string, Component>,
      template: `
        <ConfigProvider :translations="{ paginationNext: 'Weiter', paginationPrev: 'Zurück' }">
          <ConfigProvider :translations="{ paginationNext: 'Voran' }">
            <PaginationRoot :total="30" :items-per-page="10">
              <PaginationList><PaginationFirst data-first /><PaginationPrev data-prev /><PaginationNext data-next /></PaginationList>
            </PaginationRoot>
          </ConfigProvider>
        </ConfigProvider>`,
    }), { attachTo: document.body })
    await nextTick()

    expect(read(['[data-next]', 'aria-label', ''])).toBe('Voran')
    expect(read(['[data-prev]', 'aria-label', ''])).toBe('Zurück')
    expect(read(['[data-first]', 'aria-label', ''])).toBe('First Page')
  })
})

describe('a nested ConfigProvider', () => {
  // What v2 has always done, which the guide describes: only the translations are inherited.
  // TODO(v3-port): #3418 v3's CalendarRoot does not call useTranslations
  it.skip('goes back to the default locale and dir unless it is given them again', async () => {
    document.body.innerHTML = ''
    mount(defineComponent({
      components: reka as unknown as Record<string, Component>,
      setup: () => ({ date }),
      template: `
        <ConfigProvider locale="de" dir="rtl" :translations="{ calendarLabel: 'Datum' }">
          <CalendarRoot data-outer :default-placeholder="date" />
          <ConfigProvider :translations="{ calendarPrev: 'Zurück' }">
            <CalendarRoot data-inner :default-placeholder="date"><CalendarPrev data-prev /></CalendarRoot>
          </ConfigProvider>
        </ConfigProvider>`,
    }), { attachTo: document.body })
    await nextTick()

    expect(read(['[data-outer]', 'aria-label', ''])).toBe('Datum, Januar 2024')
    expect(read(['[data-outer]', 'dir', ''])).toBe('rtl')
    expect(read(['[data-inner]', 'aria-label', ''])).toBe('Datum, January 2024')
    expect(read(['[data-inner]', 'dir', ''])).toBe('ltr')
    expect(read(['[data-prev]', 'aria-label', ''])).toBe('Zurück')
  })
})

describe('translate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns the built-in English for a key that is not set', () => {
    const t = createTranslate(() => undefined)
    expect(t('paginationNext')).toBe('Next Page')
    expect(t('pinInputLabelIndexed', { index: 2, total: 4 })).toBe('pin input 2 of 4')
    expect(defaultTranslate('toastViewportLabel', { hotkey: 'F8' })).toBe('Notifications (F8)')
  })

  it('treats undefined and null as not set', () => {
    const t = createTranslate(() => ({ paginationNext: undefined, paginationPrev: null } as unknown as Partial<Translations>))
    expect(t('paginationNext')).toBe('Next Page')
    expect(t('paginationPrev')).toBe('Previous Page')
  })

  it('keeps a message that equals the default, over the provider above', () => {
    const outer = createTranslate(() => ({ dateFieldDay: 'Tag' }))
    const inner = createTranslate(() => ({ dateFieldDay: 'day,' }), outer)
    expect(inner('dateFieldDay')).toBe('day,')
  })

  it('fills each placeholder, as often as it appears', () => {
    const t = createTranslate(() => ({ sliderValue: '{index}/{total} ({index})' }))
    expect(t('sliderValue', { index: 2, total: 3 })).toBe('2/3 (2)')
  })

  it('leaves an unknown placeholder alone and warns about it in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const t = createTranslate(() => ({ sliderValue: '{index} of {count}', paginationNext: 'Next {page}' }))

    expect(t('sliderValue', { index: 2, total: 3 })).toBe('2 of {count}')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('`sliderValue`')
    expect(warn.mock.calls[0][0]).toContain('{count}')
    expect(warn.mock.calls[0][0]).toContain('index, total')

    expect(t('paginationNext')).toBe('Next {page}')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('does not warn in production, or for the built-in messages', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const key of Object.keys(defaultTranslations) as (keyof Translations)[])
      (defaultTranslate as (key: string, params: object) => string)(key, { index: 1, total: 2, page: 1, step: 1, hotkey: 'F8' })
    expect(warn).not.toHaveBeenCalled()

    vi.stubEnv('NODE_ENV', 'production')
    expect(createTranslate(() => ({ sliderValue: '{count}' }))('sliderValue', { index: 2, total: 3 })).toBe('{count}')
    expect(warn).not.toHaveBeenCalled()
  })

  it('calls a function message with the values', () => {
    const message = vi.fn(({ step, total }: { step: number, total: number }) => `${total - step} to go`)
    const t = createTranslate(() => ({ stepperAnnouncement: message }))
    expect(t('stepperAnnouncement', { step: 1, total: 4 })).toBe('3 to go')
    expect(message).toHaveBeenCalledWith({ step: 1, total: 4 })
  })

  it('keeps an empty string, which is a message', () => {
    expect(createTranslate(() => ({ stepperLabel: '' }))('stepperLabel')).toBe('')
  })

  it('reads the messages on each call', () => {
    let messages: Partial<Translations> = {}
    const t = createTranslate(() => messages)
    expect(t('tagGroupRemove')).toBe('Remove')
    messages = { tagGroupRemove: 'Entfernen' }
    expect(t('tagGroupRemove')).toBe('Entfernen')
  })

  it('builds the key of a named message', () => {
    expect(translationKey('colorChannel', 'hue')).toBe('colorChannelHue')
    expect(translationKey('dateField', 'timeZoneName')).toBe('dateFieldTimeZoneName')
  })

  it('exports the defaults frozen', () => {
    expect(Object.isFrozen(defaultTranslations)).toBe(true)
    expect(() => {
      (defaultTranslations as Record<string, string>).paginationNext = 'Changed'
    }).toThrow(TypeError)
    expect(defaultTranslations.paginationNext).toBe('Next Page')
  })
})

describe('date and time segment names', () => {
  const parts = ['day', 'month', 'year', 'hour', 'minute', 'second', 'dayPeriod', 'timeZoneName', 'era'] as const
  const keys = parts.map(part => translationKey('dateField', part))
  const english = ['day,', 'month, ', 'year, ', 'hour, ', 'minute, ', 'second, ', 'AM/PM', 'timezone, ']
  const field = `
    <DateFieldRoot v-slot="{ segments }" :default-value="zoned" granularity="second" :hour-cycle="12" :locale="locale">
      <DateFieldInput v-for="item in segments" :key="item.part" :part="item.part" :data-part="item.part">{{ item.value }}</DateFieldInput>
    </DateFieldRoot>`
  const labels = () => parts.slice(0, -1).map(part => read([`[data-part="${part}"]`, 'aria-label', '']))

  afterEach(() => vi.unstubAllGlobals())

  it.each(['en', 'en-GB', 'de', 'ja', 'ar', 'fr-CA'])('are the built-in strings in a %s field when nothing is configured', async (locale) => {
    await mountFixture({ template: field, defaults: [], data: { zoned, locale } })
    expect(labels()).toEqual(english)
    expect(read(['[data-part="month"]', 'aria-valuetext', ''])).not.toBe('Empty')
  })

  it.each(['de', 'ja', 'ar'])('are the built-in strings under a ConfigProvider with locale %s', async (locale) => {
    await mountFixture({ template: field, defaults: [], data: { zoned, locale: undefined } }, undefined, { locale })
    expect(labels()).toEqual(english)
  })

  it.each([
    ['de', ['Tag', 'Monat', 'Jahr']],
    ['ja', ['日', '月', '年']],
    ['ar', ['يوم', 'الشهر', 'السنة']],
  ])('createDateSegmentTranslations names them in %s', (locale, dayMonthYear) => {
    const intl = new Intl.DisplayNames(locale, { type: 'dateTimeField' })
    const messages = createDateSegmentTranslations(locale)
    expect(Object.keys(messages)).toEqual(keys)
    expect(Object.values(messages)).toEqual(parts.map(part => intl.of(part)))
    expect(Object.values(messages).slice(0, 3)).toEqual(dayMonthYear)
  })

  // TODO(v3-port): #3418 v3's DateField segments do not call useTranslations
  it.skip.each([
    ['de', ['Tag', 'Monat', 'Jahr']],
    ['ja', ['日', '月', '年']],
    ['ar', ['يوم', 'الشهر', 'السنة']],
  ])('a field announces the %s names once they are passed as translations', async (locale, dayMonthYear) => {
    const messages = createDateSegmentTranslations(locale)
    await mountFixture({ template: field, defaults: [], data: { zoned, locale } }, undefined, { translations: messages })
    expect(labels().slice(0, 3)).toEqual(dayMonthYear)
    expect(labels()).toEqual(keys.slice(0, -1).map(key => messages[key]))
    expect(labels().filter(label => english.includes(label!))).toEqual([])
  })

  // TODO(v3-port): #3418 v3's DateField segments do not call useTranslations
  it.skip('lets a message set after them win, also one that equals the default', async () => {
    const translations = { ...createDateSegmentTranslations('de'), dateFieldDay: 'day,', dateFieldMonth: 'Kalendermonat' }
    await mountFixture({ template: field, defaults: [], data: { zoned, locale: 'de' } }, undefined, { translations })
    expect(labels().slice(0, 3)).toEqual(['day,', 'Kalendermonat', 'Jahr'])
  })

  it('is empty for a locale the runtime answers in another language', () => {
    // What `new Intl.DisplayNames('tlh')` does on a German machine: it resolves to the default locale.
    vi.stubGlobal('Intl', { ...Intl, Locale: Intl.Locale, DisplayNames: class {
      resolvedOptions = () => ({ locale: 'de-DE' })
      of = () => 'Tag'
    } })
    expect(createDateSegmentTranslations('tlh')).toEqual({})
    expect(createDateSegmentTranslations('en-US')).toEqual({})
    // The same language in another region or script is that language.
    expect(createDateSegmentTranslations('de-AT').dateFieldDay).toBe('Tag')
    expect(createDateSegmentTranslations('DE').dateFieldDay).toBe('Tag')
  })

  it('is empty for an unknown locale on this runtime', () => {
    expect(createDateSegmentTranslations('tlh')).toEqual({})
  })

  it('is empty where Intl.DisplayNames is missing or has no field names', () => {
    vi.stubGlobal('Intl', { ...Intl, DisplayNames: undefined })
    expect(createDateSegmentTranslations('fr')).toEqual({})
    vi.stubGlobal('Intl', { ...Intl, DisplayNames: class {
      constructor() {
        throw new RangeError('Invalid option : type')
      }
    } })
    expect(createDateSegmentTranslations('es')).toEqual({})
  })

  it('leaves out a field the runtime has no name for', () => {
    vi.stubGlobal('Intl', { ...Intl, DisplayNames: class {
      resolvedOptions = () => ({ locale: 'de' })
      of = (part: string) => part === 'era' ? undefined : 'Name'
    } })
    const messages = createDateSegmentTranslations('de')
    expect('dateFieldEra' in messages).toBe(false)
    expect(messages.dateFieldDay).toBe('Name')
  })
})
