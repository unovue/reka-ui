// The built-in English, one object per key prefix. A component looks its
// messages up in the objects it can show (`useTranslations(sliderMessages)`),
// so a bundle carries only the text of the components it has, not every
// message. `defaultTranslations` joins them for the `ConfigProvider` and the
// public export.

export const calendarMessages = {
  /** Calendar, RangeCalendar: the calendar's name, read before the visible month. */
  calendarLabel: 'Event Date',
  /** CalendarPrev, RangeCalendarPrev in the day view. */
  calendarPrev: 'Previous page',
  /** CalendarNext, RangeCalendarNext in the day view. */
  calendarNext: 'Next page',
} as const

export const carouselMessages = {
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
} as const

export const colorAreaMessages = {
  /** @deprecated Unused: ColorArea renders two range inputs, with no element for it. Kept so existing translations still type-check. */
  colorAreaRoleDescription: 'Color picker',
  /** @deprecated Unused: ColorArea renders two range inputs, with no element for it. Kept so existing translations still type-check. */
  colorAreaThumbRoleDescription: 'Color thumb',
} as const

export const colorChannelMessages = {
  /** ColorArea's range inputs, ColorSliderThumb: the name of a color channel. */
  colorChannelRed: 'Red',
  colorChannelGreen: 'Green',
  colorChannelBlue: 'Blue',
  colorChannelHue: 'Hue',
  colorChannelSaturation: 'Saturation',
  colorChannelLightness: 'Lightness',
  colorChannelBrightness: 'Brightness',
  colorChannelAlpha: 'Alpha',
} as const

export const colorSwatchMessages = {
  /** ColorSwatch: `aria-roledescription`. */
  colorSwatchRoleDescription: 'color swatch',
  /** ColorSwatch: the name of no color, or of a fully transparent one. */
  colorSwatchTransparent: 'transparent',
} as const

export const comboboxMessages = {
  /** ComboboxTrigger. */
  comboboxTrigger: 'Show popup',
} as const

export const dateFieldMessages = {
  /**
   * DateField, TimeField, DateRangeField, TimeRangeField and the date pickers: the name of a segment.
   * `createDateSegmentTranslations(locale)` builds these from the names the locale has.
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
} as const

export const editableMessages = {
  /** EditableInput, when it has no label of its own. */
  editableInput: 'editable input',
  /** EditableEditTrigger. */
  editableEdit: 'edit',
  /** EditableSubmitTrigger. */
  editableSubmit: 'submit',
  /** EditableCancelTrigger. */
  editableCancel: 'cancel',
} as const

export const monthPickerMessages = {
  /** CalendarRoot with `view="month"`: the calendar's name, read before the visible year. */
  monthPickerLabel: 'Month Picker',
  /** CalendarPrev, RangeCalendarPrev in the month view. */
  monthPickerPrev: 'Previous year',
  /** CalendarNext, RangeCalendarNext in the month view. */
  monthPickerNext: 'Next year',
} as const

export const numberFieldMessages = {
  /** NumberFieldInput: `aria-roledescription`. */
  numberFieldRoleDescription: 'Number field',
  /** NumberFieldIncrement. */
  numberFieldIncrement: 'Increase',
  /** NumberFieldDecrement. */
  numberFieldDecrement: 'Decrease',
} as const

export const paginationMessages = {
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
} as const

export const pinInputMessages = {
  /** PinInputInput before its position is known. */
  pinInputLabel: 'pin input',
  /** PinInputInput. */
  pinInputLabelIndexed: 'pin input {index} of {total}',
  /** PinInputRoot: the validation message of a required PIN with an empty input (`requireComplete`). */
  pinInputIncomplete: 'Please fill in every PIN field.',
} as const

export const sliderMessages = {
  /** SliderThumb, SliderAreaThumb: the first of two thumbs. */
  sliderMinimum: 'Minimum',
  /** SliderThumb, SliderAreaThumb: the second of two thumbs. */
  sliderMaximum: 'Maximum',
  /** SliderThumb, SliderAreaThumb: one of three or more thumbs. */
  sliderValue: 'Value {index} of {total}',
} as const

export const sliderAreaMessages = {
  /** SliderAreaThumb, and the range inputs of ColorArea: `aria-roledescription`. */
  sliderAreaRoleDescription: '2D slider',
} as const

export const stepperMessages = {
  /** StepperRoot. */
  stepperLabel: 'progress',
  /** StepperRoot: announced when the step changes, unless the `announce` prop sets it. */
  stepperAnnouncement: 'Step {step} of {total}',
} as const

export const tagGroupMessages = {
  /** TagGroupItemDelete. */
  tagGroupRemove: 'Remove',
} as const

export const toastMessages = {
  /** ToastProvider: the default of its `label` prop, read before each toast. */
  toastLabel: 'Notification',
  /** ToastViewport: the default of its `label` prop. */
  toastViewportLabel: 'Notifications ({hotkey})',
} as const

export const yearPickerMessages = {
  /** CalendarRoot with `view="year"`: the calendar's name, read before the visible years. */
  yearPickerLabel: 'Year Picker',
  /** CalendarPrev, RangeCalendarPrev in the year view. */
  yearPickerPrev: 'Previous page',
  /** CalendarNext, RangeCalendarNext in the year view. */
  yearPickerNext: 'Next page',
} as const

/** Calendar, RangeCalendar: the names of the day, month and year views. */
export const calendarViewMessages = /* @__PURE__ */ Object.assign({}, calendarMessages, monthPickerMessages, yearPickerMessages)

/** SliderAreaThumb: the names of the thumbs and its `aria-roledescription`. */
export const sliderAreaThumbMessages = /* @__PURE__ */ Object.assign({}, sliderMessages, sliderAreaMessages)

/** ColorArea's range inputs: the channel names and their `aria-roledescription`. */
export const colorAreaInputMessages = /* @__PURE__ */ Object.assign({}, colorChannelMessages, sliderAreaMessages)

/** The date and time composables, which name both calendar views and field segments. */
export const dateMessages = /* @__PURE__ */ Object.assign({}, calendarViewMessages, dateFieldMessages)

/**
 * The text reka-ui gives to assistive technology on its own: labels, role
 * descriptions and announcements that no prop or slot sets. A `{name}` in a
 * message is replaced by the value of that name.
 */
export const defaultTranslations: Readonly<typeof calendarMessages & typeof carouselMessages & typeof colorAreaMessages & typeof colorChannelMessages & typeof colorSwatchMessages & typeof comboboxMessages & typeof dateFieldMessages & typeof editableMessages & typeof monthPickerMessages & typeof numberFieldMessages & typeof paginationMessages & typeof pinInputMessages & typeof sliderMessages & typeof sliderAreaMessages & typeof stepperMessages & typeof tagGroupMessages & typeof toastMessages & typeof yearPickerMessages>
  // `Object.assign` rather than a spread: a bundler drops the pure call, and with
  // it every message, when nothing reads the result. It keeps a spread.
  = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.assign({}, calendarMessages, carouselMessages, colorAreaMessages, colorChannelMessages, colorSwatchMessages, comboboxMessages, dateFieldMessages, editableMessages, monthPickerMessages, numberFieldMessages, paginationMessages, pinInputMessages, sliderMessages, sliderAreaMessages, stepperMessages, tagGroupMessages, toastMessages, yearPickerMessages))

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

function format(key: string, message: string | ((params: any) => string), params: Record<string, unknown> = {}): string {
  if (typeof message === 'function')
    return message(params)
  return message.replace(PLACEHOLDER, (placeholder, name) => {
    if (name in params)
      return String(params[name])
    if (process.env.NODE_ENV !== 'production')
      console.warn(`[reka-ui] The \`${key}\` message has the placeholder ${placeholder}, which it is not given a value for. Its values are: ${Object.keys(params).join(', ') || 'none'}.`)
    return placeholder
  })
}

export const defaultTranslate: Translate = (key, ...params) => format(key, defaultTranslations[key], params[0])

/** Messages of the built-in English: one of the `*Messages` objects above. */
export type DefaultMessages = Partial<Readonly<Record<TranslationKey, string>>>

const messagesTranslates = new WeakMap<DefaultMessages, Translate>()

/**
 * The built-in English translate function over `messages` only, one per
 * messages object. Only the keys of `messages` may be looked up in it.
 */
export function messagesTranslate(messages: DefaultMessages): Translate {
  let translate = messagesTranslates.get(messages)
  if (!translate)
    messagesTranslates.set(messages, translate = (key, ...params) => format(key, messages[key]!, params[0]))
  return translate
}

/**
 * A translate function over `messages`. A key they leave out, or set to
 * `undefined` or `null`, is looked up in `parent`, which ends at the built-in English.
 */
export function createTranslate(messages: () => Partial<Translations> | undefined, parent: Translate = defaultTranslate): Translate {
  return (key, ...params) => {
    const message = messages()?.[key]
    return message == null ? parent(key, ...params) : format(key, message, params[0])
  }
}

/** `('colorChannel', 'hue')` is the key `colorChannelHue`. */
export function translationKey<Prefix extends string, Name extends string>(prefix: Prefix, name: Name) {
  return `${prefix}${name[0].toUpperCase()}${name.slice(1)}` as Extract<TranslationKey, `${Prefix}${Capitalize<Name>}`>
}

/** The parts of a date or time field, which are also the field codes of `Intl.DisplayNames`. */
const DATE_SEGMENTS = ['day', 'month', 'year', 'hour', 'minute', 'second', 'dayPeriod', 'timeZoneName', 'era'] as const

function getLanguage(locale: string) {
  try {
    return new Intl.Locale(locale).language
  }
  catch {
    return locale.split('-')[0].toLowerCase()
  }
}

/**
 * The names of the date and time segments in `locale`, as messages for the
 * `translations` of `ConfigProvider`: `createDateSegmentTranslations('de')` is
 * `{ dateFieldDay: 'Tag', dateFieldMonth: 'Monat', … }`.
 *
 * The names come from `Intl.DisplayNames`. The result is empty, which leaves
 * the built-in text in place, where the runtime has no such names or has none
 * for the language of `locale` (it would answer in its own default language).
 */
export function createDateSegmentTranslations(locale: string): Partial<Translations> {
  const messages: Partial<Translations> = {}
  try {
    const names = new Intl.DisplayNames(locale, { type: 'dateTimeField' })
    if (getLanguage(names.resolvedOptions().locale) !== getLanguage(locale))
      return messages
    for (const part of DATE_SEGMENTS) {
      const name = names.of(part)
      if (name)
        messages[translationKey('dateField', part)] = name
    }
  }
  catch {
    return {}
  }
  return messages
}
