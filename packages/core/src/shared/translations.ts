/**
 * The text reka-ui gives to assistive technology on its own: labels, role
 * descriptions and announcements that no prop or slot sets. A `{name}` in a
 * message is replaced by the value of that name.
 */
export const defaultTranslations = {
  /** Calendar, RangeCalendar: the calendar's name, read before the visible month. */
  calendarLabel: 'Event Date',
  /** CalendarPrev, RangeCalendarPrev. */
  calendarPrev: 'Previous page',
  /** CalendarNext, RangeCalendarNext. */
  calendarNext: 'Next page',

  /** CarouselRoot: `aria-roledescription`. */
  carouselRoleDescription: 'carousel',
  /** CarouselItem: `aria-roledescription`. */
  carouselSlideRoleDescription: 'slide',
  /** CarouselItem: its position among the slides. */
  carouselSlideLabel: '{index} of {total}',
  /** CarouselPrevious. */
  carouselPrev: 'Previous slide',
  /** CarouselNext. */
  carouselNext: 'Next slide',
  /** CarouselIndicatorGroup. */
  carouselIndicatorGroup: 'Choose slide to display',
  /** CarouselIndicator outside a CarouselIndicatorGroup. */
  carouselIndicator: 'Go to slide {index}',
  /** CarouselIndicator inside a CarouselIndicatorGroup, where it is a tab. */
  carouselIndicatorTab: 'Slide {index}',
  /** CarouselAutoplayToggle while the slides rotate. */
  carouselStopRotation: 'Stop slide rotation',
  /** CarouselAutoplayToggle while the rotation is stopped. */
  carouselStartRotation: 'Start slide rotation',

  /** ColorAreaArea: `aria-roledescription`. */
  colorAreaRoleDescription: 'Color picker',
  /** ColorAreaThumb: `aria-roledescription`. */
  colorAreaThumbRoleDescription: 'Color thumb',
  /** ColorAreaThumb, ColorSliderThumb: the name of a color channel. */
  colorChannelRed: 'Red',
  colorChannelGreen: 'Green',
  colorChannelBlue: 'Blue',
  colorChannelHue: 'Hue',
  colorChannelSaturation: 'Saturation',
  colorChannelLightness: 'Lightness',
  colorChannelBrightness: 'Brightness',
  colorChannelAlpha: 'Alpha',
  /** ColorSwatch: `aria-roledescription`. */
  colorSwatchRoleDescription: 'color swatch',
  /** ColorSwatch: the name of no color, or of a fully transparent one. */
  colorSwatchTransparent: 'transparent',

  /** ComboboxTrigger. */
  comboboxTrigger: 'Show popup',

  /**
   * DateField, TimeField, DateRangeField, TimeRangeField and the date pickers: the name of a segment.
   * In a locale other than English a segment is named by `Intl.DisplayNames` unless its message is set.
   */
  dateFieldDay: 'day,',
  dateFieldMonth: 'month, ',
  dateFieldYear: 'year, ',
  dateFieldHour: 'hour, ',
  dateFieldMinute: 'minute, ',
  dateFieldSecond: 'second, ',
  dateFieldDayPeriod: 'AM/PM',
  dateFieldTimeZoneName: 'timezone, ',
  dateFieldEra: 'era',
  /** The value of a segment that is not filled in. */
  dateFieldEmpty: 'Empty',

  /** EditableInput, when it has no label of its own. */
  editableInput: 'editable input',
  /** EditableEditTrigger. */
  editableEdit: 'edit',
  /** EditableSubmitTrigger. */
  editableSubmit: 'submit',
  /** EditableCancelTrigger. */
  editableCancel: 'cancel',

  /** MonthPicker, MonthRangePicker: the picker's name, read before the visible year. */
  monthPickerLabel: 'Month Picker',
  /** MonthPickerPrev, MonthRangePickerPrev. */
  monthPickerPrev: 'Previous year',
  /** MonthPickerNext, MonthRangePickerNext. */
  monthPickerNext: 'Next year',

  /** NumberFieldInput: `aria-roledescription`. */
  numberFieldRoleDescription: 'Number field',
  /** NumberFieldIncrement. */
  numberFieldIncrement: 'Increase',
  /** NumberFieldDecrement. */
  numberFieldDecrement: 'Decrease',

  /** PaginationRoot, when it renders a `<nav>`. */
  paginationLabel: 'pagination',
  /** PaginationFirst. */
  paginationFirst: 'First Page',
  /** PaginationPrev. */
  paginationPrev: 'Previous Page',
  /** PaginationNext. */
  paginationNext: 'Next Page',
  /** PaginationLast. */
  paginationLast: 'Last Page',
  /** PaginationListItem. */
  paginationPage: 'Page {page}',

  /** PinInputInput before its position is known. */
  pinInputLabel: 'pin input',
  /** PinInputInput. */
  pinInputLabelIndexed: 'pin input {index} of {total}',

  /** SliderThumb, SliderAreaThumb: the first of two thumbs. */
  sliderMinimum: 'Minimum',
  /** SliderThumb, SliderAreaThumb: the second of two thumbs. */
  sliderMaximum: 'Maximum',
  /** SliderThumb, SliderAreaThumb: one of three or more thumbs. */
  sliderValue: 'Value {index} of {total}',
  /** SliderAreaThumb: `aria-roledescription`. */
  sliderAreaRoleDescription: '2D slider',

  /** StepperRoot. */
  stepperLabel: 'progress',
  /** StepperRoot: announced when the step changes, unless the `announce` prop sets it. */
  stepperAnnouncement: 'Step {step} of {total}',

  /** TagGroupItemDelete. */
  tagGroupRemove: 'Remove',

  /** ToastProvider: the default of its `label` prop, read before each toast. */
  toastLabel: 'Notification',
  /** ToastViewport: the default of its `label` prop. */
  toastViewportLabel: 'Notifications ({hotkey})',

  /** YearPicker, YearRangePicker: the picker's name, read before the visible years. */
  yearPickerLabel: 'Year Picker',
  /** YearPickerPrev, YearRangePickerPrev. */
  yearPickerPrev: 'Previous page',
  /** YearPickerNext, YearRangePickerNext. */
  yearPickerNext: 'Next page',
} as const satisfies Record<string, string>

export type TranslationKey = keyof typeof defaultTranslations

/** The values a message is given, for the messages that have any. */
export interface TranslationParams {
  carouselSlideLabel: { index: number, total: number }
  carouselIndicator: { index: number }
  carouselIndicatorTab: { index: number }
  paginationPage: { page: number }
  pinInputLabelIndexed: { index: number, total: number }
  sliderValue: { index: number, total: number }
  stepperAnnouncement: { step: number, total: number }
  toastViewportLabel: { hotkey: string }
}

/**
 * Every message, by key. A message that is given values is either a string
 * with `{name}` placeholders or a function of those values.
 */
export type Translations = {
  [K in TranslationKey]: K extends keyof TranslationParams
    ? string | ((params: TranslationParams[K]) => string)
    : string
}

export type Translate = <K extends TranslationKey>(
  key: K,
  ...params: K extends keyof TranslationParams ? [params: TranslationParams[K]] : []
) => string

const PLACEHOLDER = /\{(\w+)\}/g

function format(message: string | ((params: any) => string), params?: Record<string, unknown>): string {
  if (typeof message === 'function')
    return message(params ?? {})
  return params
    ? message.replace(PLACEHOLDER, (placeholder, name) => name in params ? String(params[name]) : placeholder)
    : message
}

export const defaultTranslate: Translate = (key, ...params) => format(defaultTranslations[key], params[0])

/**
 * A translate function over `messages`. A key they leave out is looked up in
 * `parent`, which ends at the built-in English.
 */
export function createTranslate(messages: () => Partial<Translations> | undefined, parent: Translate = defaultTranslate): Translate {
  return (key, ...params) => {
    const message = messages()?.[key]
    return message === undefined ? parent(key, ...params) : format(message, params[0])
  }
}

/** `('colorChannel', 'hue')` is the key `colorChannelHue`. */
export function translationKey<Prefix extends string, Name extends string>(prefix: Prefix, name: Name) {
  return `${prefix}${name[0].toUpperCase()}${name.slice(1)}` as Extract<TranslationKey, `${Prefix}${Capitalize<Name>}`>
}

/** The parts of a date or time field, which are also the field codes of `Intl.DisplayNames`. */
export type DateSegmentName = 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second' | 'dayPeriod' | 'timeZoneName' | 'era'

const ENGLISH = /^en(?:-|$)/i
const fieldNames = new Map<string, Intl.DisplayNames | null>()

function getFieldNames(locale: string) {
  let names = fieldNames.get(locale)
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames(locale, { type: 'dateTimeField' })
      // A locale the runtime has no data for resolves to its default one.
      if (ENGLISH.test(names.resolvedOptions().locale))
        names = null
    }
    catch {
      names = null
    }
    fieldNames.set(locale, names)
  }
  return names
}

/**
 * The name of a date or time segment: its message when one is set, else in
 * English the built-in string, and in any other locale the name
 * `Intl.DisplayNames` has for that field ("Tag" for `day` in German).
 */
export function getDateSegmentLabel(t: Translate, part: DateSegmentName, locale: string): string {
  const key = translationKey('dateField', part)
  const label = t(key)
  if (label !== defaultTranslations[key] || ENGLISH.test(locale))
    return label
  return getFieldNames(locale)?.of(part) || label
}
