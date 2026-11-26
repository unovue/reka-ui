import type { Component } from 'vue'
import { CalendarDate, JapaneseCalendar, parseZonedDateTime, toCalendar } from '@internationalized/date'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
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

const date = new CalendarDate(2024, 1, 15)
const zoned = parseZonedDateTime('2024-01-15T10:30:20[America/New_York]')
const japanese = toCalendar(date, new JapaneseCalendar())

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

describe('built-in accessible labels', () => {
  describe.each(Object.entries(fixtures))('%s', (_name, fixture) => {
    it('keeps its English strings when nothing is configured', async () => {
      await mountFixture(fixture)
      expect(fixture.defaults.map(read)).toEqual(fixture.defaults.map(check => check[2]))
    })

    it.runIf(fixture.consumer)('lets a consumer label win', async () => {
      await mountFixture(fixture, fixture.consumerTemplate)
      expect(fixture.consumer!.map(read)).toEqual(fixture.consumer!.map(check => check[2]))
    })
  })
})
