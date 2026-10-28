import type { DefineRekaElementsOptions } from './define'
import type { AttributeKind, RekaElementFamily } from './meta'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  CalendarView,
  CalendarViewTrigger,
} from '@/Calendar'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '@/ColorSlider'
import { ColorSwatch } from '@/ColorSwatch'
import { ColorSwatchPickerItem, ColorSwatchPickerItemIndicator, ColorSwatchPickerItemSwatch, ColorSwatchPickerRoot } from '@/ColorSwatchPicker'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import {
  DatePickerAnchor,
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerClose,
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
  DatePickerView,
  DatePickerViewTrigger,
} from '@/DatePicker'
import { DateRangeFieldInput, DateRangeFieldRoot } from '@/DateRangeField'
import {
  DateRangePickerAnchor,
  DateRangePickerArrow,
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerClose,
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
  DateRangePickerView,
  DateRangePickerViewTrigger,
} from '@/DateRangePicker'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
  RangeCalendarView,
  RangeCalendarViewTrigger,
} from '@/RangeCalendar'
import { RatingItem, RatingItemIndicator, RatingRoot } from '@/Rating'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TimeFieldInput, TimeFieldRoot } from '@/TimeField'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '@/TimeRangeField'
import { Toggle } from '@/Toggle'
import { defineRekaElements } from './define'

// Each family is a plain object, so a bundler drops the ones an app never imports.

/** `<reka-accordion-root>`, `-item`, `-header`, `-trigger`, `-content`. */
export const accordionElements: RekaElementFamily = {
  name: 'accordion',
  parts: {
    AccordionRoot,
    AccordionItem,
    AccordionHeader,
    // Renders `CollapsibleTrigger`, a `<button>` by default.
    AccordionTrigger: { component: AccordionTrigger, semantics: 'button' },
    AccordionContent,
  },
}

/** `<reka-checkbox-root>`, `-indicator`, `<reka-checkbox-group-root>`. */
export const checkboxElements: RekaElementFamily = {
  name: 'checkbox',
  parts: {
    CheckboxRoot: { component: CheckboxRoot, attributes: { modelValue: 'booleanish', defaultValue: 'booleanish' } },
    CheckboxIndicator,
    CheckboxGroupRoot,
  },
}

/** `<reka-collapsible-root>`, `-trigger`, `-content`. */
export const collapsibleElements: RekaElementFamily = {
  name: 'collapsible',
  parts: {
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
  },
}

/** `<reka-dialog-root>`, `-trigger`, `-portal`, `-overlay`, `-content`, `-title`, `-description`, `-close`. */
export const dialogElements: RekaElementFamily = {
  name: 'dialog',
  parts: {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  },
}

/** `<reka-popover-root>`, `-trigger`, `-anchor`, `-portal`, `-content`, `-close`. */
export const popoverElements: RekaElementFamily = {
  name: 'popover',
  parts: {
    PopoverRoot,
    PopoverTrigger,
    PopoverAnchor: { component: PopoverAnchor, attributes: { reference: 'property' } },
    PopoverPortal,
    PopoverContent: {
      component: PopoverContent,
      attributes: { reference: 'property', collisionBoundary: 'property' },
    },
    PopoverClose,
  },
}

/** `<reka-switch-root>`, `-thumb`. */
export const switchElements: RekaElementFamily = {
  name: 'switch',
  parts: {
    SwitchRoot: { component: SwitchRoot, attributes: { modelValue: 'booleanish', defaultValue: 'booleanish' } },
    SwitchThumb,
  },
}

/** `<reka-tabs-root>`, `-list`, `-trigger`, `-content`, `-indicator`. */
export const tabsElements: RekaElementFamily = {
  name: 'tabs',
  parts: {
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsIndicator,
  },
}

/** `<reka-toggle>`. */
export const toggleElements: RekaElementFamily = {
  name: 'toggle',
  parts: {
    Toggle,
  },
}

// Date and time props are Temporal values: as attributes they take ISO 8601
// strings (see `AttributeKind`), as properties the Temporal objects themselves.
const DATE_ATTRIBUTES: Record<string, AttributeKind> = {
  modelValue: 'date',
  defaultValue: 'date',
  placeholder: 'date',
  defaultPlaceholder: 'date',
  minValue: 'date',
  maxValue: 'date',
  value: 'date',
}
const DATE_RANGE_ATTRIBUTES: Record<string, AttributeKind> = {
  modelValue: 'date-range',
  defaultValue: 'date-range',
  placeholder: 'date',
  defaultPlaceholder: 'date',
  minValue: 'date',
  maxValue: 'date',
}
const TIME_ATTRIBUTES: Record<string, AttributeKind> = {
  modelValue: 'time',
  defaultValue: 'time',
  placeholder: 'time',
  defaultPlaceholder: 'time',
  minValue: 'time',
  maxValue: 'time',
}
const TIME_RANGE_ATTRIBUTES: Record<string, AttributeKind> = {
  modelValue: 'time-range',
  defaultValue: 'time-range',
  placeholder: 'time',
  defaultPlaceholder: 'time',
  minValue: 'time',
  maxValue: 'time',
}

/**
 * `<reka-calendar-root>`, `-header`, `-heading`, `-prev`, `-next`, `-grid`,
 * `-grid-head`, `-grid-body`, `-grid-row`, `-head-cell`, `-cell`, `-cell-trigger`,
 * `-view`, `-view-trigger`.
 */
export const calendarElements: RekaElementFamily = {
  name: 'calendar',
  parts: {
    // The visually hidden heading the grids are labelled by goes inside the root.
    CalendarRoot: { component: CalendarRoot, attributes: DATE_ATTRIBUTES, siblingsInside: true },
    CalendarHeader,
    CalendarHeading,
    CalendarPrev,
    CalendarNext,
    CalendarGrid: { component: CalendarGrid, attributes: DATE_ATTRIBUTES },
    CalendarGridHead,
    CalendarGridBody,
    CalendarGridRow,
    CalendarHeadCell,
    CalendarCell: { component: CalendarCell, attributes: DATE_ATTRIBUTES },
    CalendarCellTrigger: { component: CalendarCellTrigger, attributes: DATE_ATTRIBUTES },
    CalendarView,
    CalendarViewTrigger,
  },
}

/** `<reka-range-calendar-root>` and the same parts as `calendarElements`. */
export const rangeCalendarElements: RekaElementFamily = {
  name: 'range-calendar',
  parts: {
    RangeCalendarRoot: { component: RangeCalendarRoot, attributes: DATE_RANGE_ATTRIBUTES, siblingsInside: true },
    RangeCalendarHeader,
    RangeCalendarHeading,
    RangeCalendarPrev,
    RangeCalendarNext,
    RangeCalendarGrid: { component: RangeCalendarGrid, attributes: DATE_ATTRIBUTES },
    RangeCalendarGridHead,
    RangeCalendarGridBody,
    RangeCalendarGridRow,
    RangeCalendarHeadCell,
    RangeCalendarCell: { component: RangeCalendarCell, attributes: DATE_ATTRIBUTES },
    RangeCalendarCellTrigger: { component: RangeCalendarCellTrigger, attributes: DATE_ATTRIBUTES },
    RangeCalendarView,
    RangeCalendarViewTrigger,
  },
}

/** `<reka-date-field-root>`, `-input`. */
export const dateFieldElements: RekaElementFamily = {
  name: 'date-field',
  parts: {
    DateFieldRoot: { component: DateFieldRoot, attributes: DATE_ATTRIBUTES },
    DateFieldInput,
  },
}

/** `<reka-date-range-field-root>`, `-input`. */
export const dateRangeFieldElements: RekaElementFamily = {
  name: 'date-range-field',
  parts: {
    DateRangeFieldRoot: { component: DateRangeFieldRoot, attributes: DATE_RANGE_ATTRIBUTES },
    DateRangeFieldInput,
  },
}

/** `<reka-time-field-root>`, `-input`. */
export const timeFieldElements: RekaElementFamily = {
  name: 'time-field',
  parts: {
    TimeFieldRoot: { component: TimeFieldRoot, attributes: TIME_ATTRIBUTES },
    TimeFieldInput,
  },
}

/** `<reka-time-range-field-root>`, `-input`. */
export const timeRangeFieldElements: RekaElementFamily = {
  name: 'time-range-field',
  parts: {
    TimeRangeFieldRoot: { component: TimeRangeFieldRoot, attributes: TIME_RANGE_ATTRIBUTES },
    TimeRangeFieldInput,
  },
}

/**
 * `<reka-date-picker-root>`, `-field`, `-input`, `-trigger`, `-anchor`, `-content`,
 * `-arrow`, `-close`, `-calendar` and the calendar parts (`-header`, `-grid`,
 * `-cell-trigger`, …).
 */
export const datePickerElements: RekaElementFamily = {
  name: 'date-picker',
  // Most parts render the `Popover` / `Calendar` ones, which default to buttons
  // and table parts: `semantics` stands in for their `as` default.
  parts: {
    DatePickerRoot: { component: DatePickerRoot, attributes: DATE_ATTRIBUTES },
    // The field and the calendar have no props of their own: `asChild` falls
    // through to the `DateFieldRoot` / `CalendarRoot` they render. The field
    // renders the hidden input of the root's `name`, so it is the one that submits.
    DatePickerField: { component: DatePickerField, asChild: true, formAssociated: true },
    DatePickerInput,
    DatePickerTrigger: { component: DatePickerTrigger, semantics: 'button' },
    DatePickerAnchor: { component: DatePickerAnchor, attributes: { reference: 'property' } },
    DatePickerContent: {
      component: DatePickerContent,
      attributes: { reference: 'property', collisionBoundary: 'property' },
    },
    DatePickerArrow: { component: DatePickerArrow, target: 'svg' },
    DatePickerClose: { component: DatePickerClose, semantics: 'button' },
    DatePickerCalendar: { component: DatePickerCalendar, asChild: true, siblingsInside: true },
    DatePickerHeader,
    DatePickerHeading,
    DatePickerPrev: { component: DatePickerPrev, semantics: 'button' },
    DatePickerNext: { component: DatePickerNext, semantics: 'button' },
    DatePickerGrid: { component: DatePickerGrid, attributes: DATE_ATTRIBUTES, semantics: 'table' },
    DatePickerGridHead: { component: DatePickerGridHead, semantics: 'thead' },
    DatePickerGridBody: { component: DatePickerGridBody, semantics: 'tbody' },
    DatePickerGridRow: { component: DatePickerGridRow, semantics: 'tr' },
    DatePickerHeadCell: { component: DatePickerHeadCell, semantics: 'th' },
    DatePickerCell: { component: DatePickerCell, attributes: DATE_ATTRIBUTES, semantics: 'td' },
    DatePickerCellTrigger: { component: DatePickerCellTrigger, attributes: DATE_ATTRIBUTES },
    DatePickerView,
    DatePickerViewTrigger: { component: DatePickerViewTrigger, semantics: 'button' },
  },
}

/** `<reka-date-range-picker-root>` and the same parts as `datePickerElements`. */
export const dateRangePickerElements: RekaElementFamily = {
  name: 'date-range-picker',
  parts: {
    DateRangePickerRoot: { component: DateRangePickerRoot, attributes: DATE_RANGE_ATTRIBUTES },
    DateRangePickerField: { component: DateRangePickerField, asChild: true, formAssociated: true },
    DateRangePickerInput,
    DateRangePickerTrigger: { component: DateRangePickerTrigger, semantics: 'button' },
    DateRangePickerAnchor: { component: DateRangePickerAnchor, attributes: { reference: 'property' } },
    DateRangePickerContent: {
      component: DateRangePickerContent,
      attributes: { reference: 'property', collisionBoundary: 'property' },
    },
    DateRangePickerArrow: { component: DateRangePickerArrow, target: 'svg' },
    DateRangePickerClose: { component: DateRangePickerClose, semantics: 'button' },
    DateRangePickerCalendar: { component: DateRangePickerCalendar, asChild: true, siblingsInside: true },
    DateRangePickerHeader,
    DateRangePickerHeading,
    DateRangePickerPrev: { component: DateRangePickerPrev, semantics: 'button' },
    DateRangePickerNext: { component: DateRangePickerNext, semantics: 'button' },
    DateRangePickerGrid: { component: DateRangePickerGrid, attributes: DATE_ATTRIBUTES, semantics: 'table' },
    DateRangePickerGridHead: { component: DateRangePickerGridHead, semantics: 'thead' },
    DateRangePickerGridBody: { component: DateRangePickerGridBody, semantics: 'tbody' },
    DateRangePickerGridRow: { component: DateRangePickerGridRow, semantics: 'tr' },
    DateRangePickerHeadCell: { component: DateRangePickerHeadCell, semantics: 'th' },
    DateRangePickerCell: { component: DateRangePickerCell, attributes: DATE_ATTRIBUTES, semantics: 'td' },
    DateRangePickerCellTrigger: { component: DateRangePickerCellTrigger, attributes: DATE_ATTRIBUTES },
    DateRangePickerView,
    DateRangePickerViewTrigger: { component: DateRangePickerViewTrigger, semantics: 'button' },
  },
}

/** `<reka-color-area-root>`, `-area`, `-thumb`. */
export const colorAreaElements: RekaElementFamily = {
  name: 'color-area',
  parts: {
    ColorAreaRoot,
    ColorAreaArea,
    // Its two range inputs hold focus: they go inside the thumb.
    ColorAreaThumb: { component: ColorAreaThumb, siblingsInside: true },
  },
}

/** `<reka-color-field-root>`, `-input` (renders onto an `<input>` inside it). */
export const colorFieldElements: RekaElementFamily = {
  name: 'color-field',
  parts: {
    ColorFieldRoot,
    ColorFieldInput: { component: ColorFieldInput, target: 'input' },
  },
}

/** `<reka-color-slider-root>`, `-track`, `-thumb`. */
export const colorSliderElements: RekaElementFamily = {
  name: 'color-slider',
  parts: {
    ColorSliderRoot,
    ColorSliderTrack,
    ColorSliderThumb,
  },
}

/** `<reka-color-swatch>`. */
export const colorSwatchElements: RekaElementFamily = {
  name: 'color-swatch',
  parts: {
    ColorSwatch,
  },
}

/** `<reka-color-swatch-picker-root>`, `-item`, `-item-swatch`, `-item-indicator`. */
export const colorSwatchPickerElements: RekaElementFamily = {
  name: 'color-swatch-picker',
  parts: {
    ColorSwatchPickerRoot,
    ColorSwatchPickerItem,
    ColorSwatchPickerItemSwatch,
    ColorSwatchPickerItemIndicator,
  },
}

/** `<reka-number-field-root>`, `-input` (renders onto an `<input>` inside it), `-increment`, `-decrement`. */
export const numberFieldElements: RekaElementFamily = {
  name: 'number-field',
  parts: {
    NumberFieldRoot,
    NumberFieldInput: { component: NumberFieldInput, target: 'input' },
    NumberFieldIncrement,
    NumberFieldDecrement,
  },
}

/** `<reka-pin-input-root>`, `-input` (renders onto an `<input>` inside it). */
export const pinInputElements: RekaElementFamily = {
  name: 'pin-input',
  parts: {
    PinInputRoot,
    PinInputInput: { component: PinInputInput, target: 'input' },
  },
}

/** `<reka-slider-root>`, `-track`, `-range`, `-thumb`. */
export const sliderElements: RekaElementFamily = {
  name: 'slider',
  parts: {
    // One value per thumb: `default-value="20 80"`.
    SliderRoot: { component: SliderRoot, attributes: { modelValue: 'numbers', defaultValue: 'numbers' } },
    SliderTrack,
    SliderRange,
    SliderThumb,
  },
}

/** `<reka-rating-root>`, `-item`, `-item-indicator`. */
export const ratingElements: RekaElementFamily = {
  name: 'rating',
  parts: {
    RatingRoot,
    RatingItem,
    // Renders a `RadioGroupItem`, a `<button>` by default.
    RatingItemIndicator: { component: RatingItemIndicator, semantics: 'button' },
  },
}

/** Every family available as custom elements. Importing it bundles all of them. */
export const rekaElementFamilies: readonly RekaElementFamily[] = [
  accordionElements,
  calendarElements,
  checkboxElements,
  collapsibleElements,
  colorAreaElements,
  colorFieldElements,
  colorSliderElements,
  colorSwatchElements,
  colorSwatchPickerElements,
  dateFieldElements,
  datePickerElements,
  dateRangeFieldElements,
  dateRangePickerElements,
  dialogElements,
  numberFieldElements,
  pinInputElements,
  popoverElements,
  rangeCalendarElements,
  ratingElements,
  sliderElements,
  switchElements,
  tabsElements,
  timeFieldElements,
  timeRangeFieldElements,
  toggleElements,
]

/**
 * Registers every supported family: a single call for a page that uses many of
 * them (or a CDN build). Importing it bundles all of them; prefer the per-family
 * helpers otherwise.
 */
export function defineAllRekaElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements(rekaElementFamilies, options)
}

export function defineAccordionElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([accordionElements], options)
}

export function defineCheckboxElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([checkboxElements], options)
}

export function defineCollapsibleElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([collapsibleElements], options)
}

export function defineDialogElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dialogElements], options)
}

export function definePopoverElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([popoverElements], options)
}

export function defineSwitchElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([switchElements], options)
}

export function defineTabsElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tabsElements], options)
}

export function defineToggleElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([toggleElements], options)
}

export function defineCalendarElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([calendarElements], options)
}

export function defineRangeCalendarElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([rangeCalendarElements], options)
}

export function defineDateFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dateFieldElements], options)
}

export function defineDateRangeFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dateRangeFieldElements], options)
}

export function defineTimeFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([timeFieldElements], options)
}

export function defineTimeRangeFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([timeRangeFieldElements], options)
}

export function defineDatePickerElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([datePickerElements], options)
}

export function defineDateRangePickerElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dateRangePickerElements], options)
}

export function defineColorAreaElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([colorAreaElements], options)
}

export function defineColorFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([colorFieldElements], options)
}

export function defineColorSliderElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([colorSliderElements], options)
}

export function defineColorSwatchElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([colorSwatchElements], options)
}

export function defineColorSwatchPickerElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([colorSwatchPickerElements], options)
}

export function defineNumberFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([numberFieldElements], options)
}

export function definePinInputElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([pinInputElements], options)
}

export function defineSliderElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([sliderElements], options)
}

export function defineRatingElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([ratingElements], options)
}
