import type { RekaElementEvent } from './events'
import type { RekaElement } from './RekaElement'
import type {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionRootEmits,
  AccordionRootProps,
  AccordionTriggerProps,
} from '@/Accordion'
import type {
  CalendarCellProps,
  CalendarCellTriggerProps,
  CalendarGridBodyProps,
  CalendarGridHeadProps,
  CalendarGridProps,
  CalendarGridRowProps,
  CalendarHeadCellProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNextProps,
  CalendarPrevProps,
  CalendarRootEmits,
  CalendarRootProps,
  CalendarViewProps,
  CalendarViewTriggerProps,
} from '@/Calendar'
import type {
  CheckboxGroupRootEmits,
  CheckboxGroupRootProps,
  CheckboxIndicatorProps,
  CheckboxRootEmits,
  CheckboxRootProps,
} from '@/Checkbox'
import type {
  CollapsibleContentEmits,
  CollapsibleContentProps,
  CollapsibleRootEmits,
  CollapsibleRootProps,
  CollapsibleTriggerProps,
} from '@/Collapsible'
import type {
  ColorAreaAreaProps,
  ColorAreaRootEmits,
  ColorAreaRootProps,
  ColorAreaThumbProps,
} from '@/ColorArea'
import type { ColorFieldInputProps, ColorFieldRootEmits, ColorFieldRootProps } from '@/ColorField'
import type {
  ColorSliderRootEmits,
  ColorSliderRootProps,
  ColorSliderThumbProps,
  ColorSliderTrackProps,
} from '@/ColorSlider'
import type { ColorSwatchProps } from '@/ColorSwatch'
import type {
  ColorSwatchPickerItemIndicatorProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerItemSwatchProps,
  ColorSwatchPickerRootEmits,
  ColorSwatchPickerRootProps,
} from '@/ColorSwatchPicker'
import type { DateFieldInputProps, DateFieldRootEmits, DateFieldRootProps } from '@/DateField'
import type {
  DatePickerAnchorProps,
  DatePickerArrowProps,
  DatePickerCellProps,
  DatePickerCellTriggerProps,
  DatePickerCloseProps,
  DatePickerContentEmits,
  DatePickerContentProps,
  DatePickerGridBodyProps,
  DatePickerGridHeadProps,
  DatePickerGridProps,
  DatePickerGridRowProps,
  DatePickerHeadCellProps,
  DatePickerHeaderProps,
  DatePickerHeadingProps,
  DatePickerInputProps,
  DatePickerNextProps,
  DatePickerPrevProps,
  DatePickerRootEmits,
  DatePickerRootProps,
  DatePickerTriggerProps,
  DatePickerViewProps,
  DatePickerViewTriggerProps,
} from '@/DatePicker'
import type { DateRangeFieldInputProps, DateRangeFieldRootEmits, DateRangeFieldRootProps } from '@/DateRangeField'
import type {
  DateRangePickerAnchorProps,
  DateRangePickerArrowProps,
  DateRangePickerCellProps,
  DateRangePickerCellTriggerProps,
  DateRangePickerCloseProps,
  DateRangePickerContentEmits,
  DateRangePickerContentProps,
  DateRangePickerGridBodyProps,
  DateRangePickerGridHeadProps,
  DateRangePickerGridProps,
  DateRangePickerGridRowProps,
  DateRangePickerHeadCellProps,
  DateRangePickerHeaderProps,
  DateRangePickerHeadingProps,
  DateRangePickerInputProps,
  DateRangePickerNextProps,
  DateRangePickerPrevProps,
  DateRangePickerRootEmits,
  DateRangePickerRootProps,
  DateRangePickerTriggerProps,
  DateRangePickerViewProps,
  DateRangePickerViewTriggerProps,
} from '@/DateRangePicker'
import type {
  DialogCloseProps,
  DialogContentEmits,
  DialogContentProps,
  DialogDescriptionProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogRootEmits,
  DialogRootProps,
  DialogTitleProps,
  DialogTriggerProps,
} from '@/Dialog'
import type {
  NumberFieldDecrementProps,
  NumberFieldIncrementProps,
  NumberFieldInputProps,
  NumberFieldRootEmits,
  NumberFieldRootProps,
} from '@/NumberField'
import type { PinInputInputProps, PinInputRootEmits, PinInputRootProps } from '@/PinInput'
import type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentEmits,
  PopoverContentProps,
  PopoverPortalProps,
  PopoverRootEmits,
  PopoverRootProps,
  PopoverTriggerProps,
} from '@/Popover'
import type {
  RangeCalendarCellProps,
  RangeCalendarCellTriggerProps,
  RangeCalendarGridBodyProps,
  RangeCalendarGridHeadProps,
  RangeCalendarGridProps,
  RangeCalendarGridRowProps,
  RangeCalendarHeadCellProps,
  RangeCalendarHeaderProps,
  RangeCalendarHeadingProps,
  RangeCalendarNextProps,
  RangeCalendarPrevProps,
  RangeCalendarRootEmits,
  RangeCalendarRootProps,
  RangeCalendarViewProps,
  RangeCalendarViewTriggerProps,
} from '@/RangeCalendar'
import type {
  RatingItemIndicatorProps,
  RatingItemProps,
  RatingRootEmits,
  RatingRootProps,
} from '@/Rating'
import type {
  SliderRangeProps,
  SliderRootEmits,
  SliderRootProps,
  SliderThumbProps,
  SliderTrackProps,
} from '@/Slider'
import type { SwitchRootEmits, SwitchRootProps, SwitchThumbProps } from '@/Switch'
import type {
  TabsContentProps,
  TabsIndicatorProps,
  TabsListProps,
  TabsRootEmits,
  TabsRootProps,
  TabsTriggerProps,
} from '@/Tabs'
import type { TimeFieldInputProps, TimeFieldRootEmits, TimeFieldRootProps } from '@/TimeField'
import type { TimeRangeFieldInputProps, TimeRangeFieldRootEmits, TimeRangeFieldRootProps } from '@/TimeRangeField'
import type { ToggleEmits, ToggleProps } from '@/Toggle'

type Hyphenate<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Head extends Lowercase<Head> ? Head : `-${Lowercase<Head>}`}${Hyphenate<Tail>}`
  : S
type ReplaceColons<S extends string> = S extends `${infer Head}:${infer Tail}` ? `${Head}-${ReplaceColons<Tail>}` : S
type PascalSegments<S extends string> = S extends `${infer Head}:${infer Tail}` ? `${Capitalize<Head>}${PascalSegments<Tail>}` : Capitalize<S>

/** DOM event type of a Vue emit, like `toEventType()`: `update:modelValue` → `update-model-value`. */
export type RekaEventType<Emit extends string> = Hyphenate<ReplaceColons<Emit>>

type EmitArgs<E, K extends keyof E> = E[K] extends readonly unknown[] ? E[K] : unknown[]
type EmitEvent<E, K extends keyof E> = RekaElementEvent<EmitArgs<E, K>[0], EmitArgs<E, K>[1]>

/** The `CustomEvent`s an element dispatches, by event type. */
export type RekaElementEventMap<Emits> = {
  [K in keyof Emits & string as RekaEventType<K>]: EmitEvent<Emits, K>
}

/** The element's props as properties: everything but `as` / `asChild`. */
export type RekaElementProps<Props> = Partial<Omit<Props, 'as' | 'asChild'>>

/**
 * A Reka element instance: its props as properties, and typed `addEventListener`
 * (listed first, so its overload wins over `HTMLElement`'s `string` one).
 */
export type RekaPartElement<Props, Emits = object> = {
  addEventListener: <K extends keyof RekaElementEventMap<Emits>>(
    type: K,
    listener: (this: HTMLElement, event: RekaElementEventMap<Emits>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void
  removeEventListener: <K extends keyof RekaElementEventMap<Emits>>(
    type: K,
    listener: (this: HTMLElement, event: RekaElementEventMap<Emits>[K]) => void,
    options?: boolean | EventListenerOptions,
  ) => void
} & RekaElement & RekaElementProps<Props>

/** Shown in a type error when a JSX handler uses React's camelCase event naming. */
export interface UseKebabCaseEventProp<Name extends string> {
  'Custom element events are named in kebab-case. Use this prop instead:': Name
}

/**
 * JSX props of an element for frameworks that set properties and listen to custom
 * events with `on<event-type>` (React 19, Preact, Solid with `prop:`/`on:` aside):
 * camelCase props, and `onupdate-model-value`-style event props. A camelCase handler
 * such as `onUpdateModelValue` is a type error: React would listen to an event
 * named `UpdateModelValue`, which never fires.
 */
export type RekaElementJSXProps<Props, Emits = object> = RekaElementProps<Props> & {
  [K in keyof Emits & string as `on${RekaEventType<K>}`]?: (event: EmitEvent<Emits, K>) => void
} & {
  [K in keyof Emits & string as `on${PascalSegments<K>}`]?: UseKebabCaseEventProp<`on${RekaEventType<K>}`>
}

interface Part<Props, Emits = object> {
  element: RekaPartElement<Props, Emits>
  jsx: RekaElementJSXProps<Props, Emits>
}

interface RekaElementParts {
  'reka-accordion-root': Part<AccordionRootProps, AccordionRootEmits>
  'reka-accordion-item': Part<AccordionItemProps>
  'reka-accordion-header': Part<AccordionHeaderProps>
  'reka-accordion-trigger': Part<AccordionTriggerProps>
  'reka-accordion-content': Part<AccordionContentProps>
  'reka-calendar-root': Part<CalendarRootProps, CalendarRootEmits>
  'reka-calendar-header': Part<CalendarHeaderProps>
  'reka-calendar-heading': Part<CalendarHeadingProps>
  'reka-calendar-prev': Part<CalendarPrevProps>
  'reka-calendar-next': Part<CalendarNextProps>
  'reka-calendar-grid': Part<CalendarGridProps>
  'reka-calendar-grid-head': Part<CalendarGridHeadProps>
  'reka-calendar-grid-body': Part<CalendarGridBodyProps>
  'reka-calendar-grid-row': Part<CalendarGridRowProps>
  'reka-calendar-head-cell': Part<CalendarHeadCellProps>
  'reka-calendar-cell': Part<CalendarCellProps>
  'reka-calendar-cell-trigger': Part<CalendarCellTriggerProps>
  'reka-calendar-view': Part<CalendarViewProps>
  'reka-calendar-view-trigger': Part<CalendarViewTriggerProps>
  'reka-checkbox-root': Part<CheckboxRootProps, CheckboxRootEmits>
  'reka-checkbox-indicator': Part<CheckboxIndicatorProps>
  'reka-checkbox-group-root': Part<CheckboxGroupRootProps, CheckboxGroupRootEmits>
  'reka-collapsible-root': Part<CollapsibleRootProps, CollapsibleRootEmits>
  'reka-collapsible-trigger': Part<CollapsibleTriggerProps>
  'reka-collapsible-content': Part<CollapsibleContentProps, CollapsibleContentEmits>
  'reka-color-area-root': Part<ColorAreaRootProps, ColorAreaRootEmits>
  'reka-color-area-area': Part<ColorAreaAreaProps>
  'reka-color-area-thumb': Part<ColorAreaThumbProps>
  'reka-color-field-root': Part<ColorFieldRootProps, ColorFieldRootEmits>
  'reka-color-field-input': Part<ColorFieldInputProps>
  'reka-color-slider-root': Part<ColorSliderRootProps, ColorSliderRootEmits>
  'reka-color-slider-track': Part<ColorSliderTrackProps>
  'reka-color-slider-thumb': Part<ColorSliderThumbProps>
  'reka-color-swatch': Part<ColorSwatchProps>
  'reka-color-swatch-picker-root': Part<ColorSwatchPickerRootProps, ColorSwatchPickerRootEmits>
  'reka-color-swatch-picker-item': Part<ColorSwatchPickerItemProps>
  'reka-color-swatch-picker-item-swatch': Part<ColorSwatchPickerItemSwatchProps>
  'reka-color-swatch-picker-item-indicator': Part<ColorSwatchPickerItemIndicatorProps>
  'reka-date-field-root': Part<DateFieldRootProps, DateFieldRootEmits>
  'reka-date-field-input': Part<DateFieldInputProps>
  'reka-date-picker-root': Part<DatePickerRootProps, DatePickerRootEmits>
  'reka-date-picker-field': Part<object>
  'reka-date-picker-input': Part<DatePickerInputProps>
  'reka-date-picker-trigger': Part<DatePickerTriggerProps>
  'reka-date-picker-anchor': Part<DatePickerAnchorProps>
  'reka-date-picker-content': Part<DatePickerContentProps, DatePickerContentEmits>
  'reka-date-picker-arrow': Part<DatePickerArrowProps>
  'reka-date-picker-close': Part<DatePickerCloseProps>
  'reka-date-picker-calendar': Part<object>
  'reka-date-picker-header': Part<DatePickerHeaderProps>
  'reka-date-picker-heading': Part<DatePickerHeadingProps>
  'reka-date-picker-prev': Part<DatePickerPrevProps>
  'reka-date-picker-next': Part<DatePickerNextProps>
  'reka-date-picker-grid': Part<DatePickerGridProps>
  'reka-date-picker-grid-head': Part<DatePickerGridHeadProps>
  'reka-date-picker-grid-body': Part<DatePickerGridBodyProps>
  'reka-date-picker-grid-row': Part<DatePickerGridRowProps>
  'reka-date-picker-head-cell': Part<DatePickerHeadCellProps>
  'reka-date-picker-cell': Part<DatePickerCellProps>
  'reka-date-picker-cell-trigger': Part<DatePickerCellTriggerProps>
  'reka-date-picker-view': Part<DatePickerViewProps>
  'reka-date-picker-view-trigger': Part<DatePickerViewTriggerProps>
  'reka-date-range-field-root': Part<DateRangeFieldRootProps, DateRangeFieldRootEmits>
  'reka-date-range-field-input': Part<DateRangeFieldInputProps>
  'reka-date-range-picker-root': Part<DateRangePickerRootProps, DateRangePickerRootEmits>
  'reka-date-range-picker-field': Part<object>
  'reka-date-range-picker-input': Part<DateRangePickerInputProps>
  'reka-date-range-picker-trigger': Part<DateRangePickerTriggerProps>
  'reka-date-range-picker-anchor': Part<DateRangePickerAnchorProps>
  'reka-date-range-picker-content': Part<DateRangePickerContentProps, DateRangePickerContentEmits>
  'reka-date-range-picker-arrow': Part<DateRangePickerArrowProps>
  'reka-date-range-picker-close': Part<DateRangePickerCloseProps>
  'reka-date-range-picker-calendar': Part<object>
  'reka-date-range-picker-header': Part<DateRangePickerHeaderProps>
  'reka-date-range-picker-heading': Part<DateRangePickerHeadingProps>
  'reka-date-range-picker-prev': Part<DateRangePickerPrevProps>
  'reka-date-range-picker-next': Part<DateRangePickerNextProps>
  'reka-date-range-picker-grid': Part<DateRangePickerGridProps>
  'reka-date-range-picker-grid-head': Part<DateRangePickerGridHeadProps>
  'reka-date-range-picker-grid-body': Part<DateRangePickerGridBodyProps>
  'reka-date-range-picker-grid-row': Part<DateRangePickerGridRowProps>
  'reka-date-range-picker-head-cell': Part<DateRangePickerHeadCellProps>
  'reka-date-range-picker-cell': Part<DateRangePickerCellProps>
  'reka-date-range-picker-cell-trigger': Part<DateRangePickerCellTriggerProps>
  'reka-date-range-picker-view': Part<DateRangePickerViewProps>
  'reka-date-range-picker-view-trigger': Part<DateRangePickerViewTriggerProps>
  'reka-dialog-root': Part<DialogRootProps, DialogRootEmits>
  'reka-dialog-trigger': Part<DialogTriggerProps>
  'reka-dialog-portal': Part<DialogPortalProps>
  'reka-dialog-overlay': Part<DialogOverlayProps>
  'reka-dialog-content': Part<DialogContentProps, DialogContentEmits>
  'reka-dialog-title': Part<DialogTitleProps>
  'reka-dialog-description': Part<DialogDescriptionProps>
  'reka-dialog-close': Part<DialogCloseProps>
  'reka-number-field-root': Part<NumberFieldRootProps, NumberFieldRootEmits>
  'reka-number-field-input': Part<NumberFieldInputProps>
  'reka-number-field-increment': Part<NumberFieldIncrementProps>
  'reka-number-field-decrement': Part<NumberFieldDecrementProps>
  'reka-pin-input-root': Part<PinInputRootProps, PinInputRootEmits>
  'reka-pin-input-input': Part<PinInputInputProps>
  'reka-popover-root': Part<PopoverRootProps, PopoverRootEmits>
  'reka-popover-trigger': Part<PopoverTriggerProps>
  'reka-popover-anchor': Part<PopoverAnchorProps>
  'reka-popover-portal': Part<PopoverPortalProps>
  'reka-popover-content': Part<PopoverContentProps, PopoverContentEmits>
  'reka-popover-close': Part<PopoverCloseProps>
  'reka-range-calendar-root': Part<RangeCalendarRootProps, RangeCalendarRootEmits>
  'reka-range-calendar-header': Part<RangeCalendarHeaderProps>
  'reka-range-calendar-heading': Part<RangeCalendarHeadingProps>
  'reka-range-calendar-prev': Part<RangeCalendarPrevProps>
  'reka-range-calendar-next': Part<RangeCalendarNextProps>
  'reka-range-calendar-grid': Part<RangeCalendarGridProps>
  'reka-range-calendar-grid-head': Part<RangeCalendarGridHeadProps>
  'reka-range-calendar-grid-body': Part<RangeCalendarGridBodyProps>
  'reka-range-calendar-grid-row': Part<RangeCalendarGridRowProps>
  'reka-range-calendar-head-cell': Part<RangeCalendarHeadCellProps>
  'reka-range-calendar-cell': Part<RangeCalendarCellProps>
  'reka-range-calendar-cell-trigger': Part<RangeCalendarCellTriggerProps>
  'reka-range-calendar-view': Part<RangeCalendarViewProps>
  'reka-range-calendar-view-trigger': Part<RangeCalendarViewTriggerProps>
  'reka-rating-root': Part<RatingRootProps, RatingRootEmits>
  'reka-rating-item': Part<RatingItemProps>
  'reka-rating-item-indicator': Part<RatingItemIndicatorProps>
  'reka-slider-root': Part<SliderRootProps, SliderRootEmits>
  'reka-slider-track': Part<SliderTrackProps>
  'reka-slider-range': Part<SliderRangeProps>
  'reka-slider-thumb': Part<SliderThumbProps>
  'reka-switch-root': Part<SwitchRootProps, SwitchRootEmits>
  'reka-switch-thumb': Part<SwitchThumbProps>
  'reka-tabs-root': Part<TabsRootProps, TabsRootEmits>
  'reka-tabs-list': Part<TabsListProps>
  'reka-tabs-trigger': Part<TabsTriggerProps>
  'reka-tabs-content': Part<TabsContentProps>
  'reka-tabs-indicator': Part<TabsIndicatorProps>
  'reka-time-field-root': Part<TimeFieldRootProps, TimeFieldRootEmits>
  'reka-time-field-input': Part<TimeFieldInputProps>
  'reka-time-range-field-root': Part<TimeRangeFieldRootProps, TimeRangeFieldRootEmits>
  'reka-time-range-field-input': Part<TimeRangeFieldInputProps>
  'reka-toggle': Part<ToggleProps, ToggleEmits>
}

/**
 * Element types of the default-prefixed tags. Opt in to typed
 * `document.querySelector('reka-switch-root')` / `createElement()` with:
 *
 * ```ts
 * /// <reference types="reka-ui/elements/global" />
 * ```
 *
 * (A separate, types-only entry: every JavaScript entry shares one declaration
 * chunk, so a global declared there would reach every `reka-ui` user.)
 */
export type RekaElementTagNameMap = {
  [Tag in keyof RekaElementParts]: RekaElementParts[Tag]['element']
}

/**
 * JSX intrinsic elements for the default-prefixed tags. `Base` is your framework's
 * own attributes type; the element's props replace the ones it shares with it
 * (`defaultValue`, `dir`, …).
 *
 * React 19 typings for these are in `reka-ui/elements/react`
 * (`/// <reference types="reka-ui/elements/react" />`).
 *
 * @example
 * ```ts
 * // React 19, by hand
 * import type { HTMLAttributes, RefAttributes } from 'react'
 * import type { RekaIntrinsicElements } from 'reka-ui/elements'
 *
 * declare module 'react' {
 *   namespace JSX {
 *     interface IntrinsicElements extends RekaIntrinsicElements<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>> {}
 *   }
 * }
 * ```
 */
export type RekaIntrinsicElements<Base = object> = {
  [Tag in keyof RekaElementParts]: Omit<Base, keyof RekaElementParts[Tag]['jsx']> & RekaElementParts[Tag]['jsx']
}
