import type { MaybeRefOrGetter, Ref } from 'vue'
import type { AnyExceptLiteral, DateStep, HourCycle, SegmentPart, SegmentValueObj } from './types'
import type { DateValue } from '@/date/types'
import type { Formatter } from '@/shared'
import { toValue } from 'vue'
import { getDaysInMonth } from '@/date/comparators'
import { cycleField, getFieldValue, setFields } from '@/date/temporal'
import { getActiveElement, snapValueToStep, useKbd } from '@/shared'
import { isAcceptableSegmentKey, isNumberString, isSegmentNavigationKey } from './segment'

const DIGIT_REG = /^\d$/

type MinuteSecondIncrementProps = {
  e: KeyboardEvent
  part: 'minute' | 'second'
  dateRef: DateValue
  prevValue: number | null
}

type DateTimeValueIncrementation = {
  e: KeyboardEvent
  part: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  dateRef: DateValue
  prevValue: number | null
}

type SegmentAttrProps = {
  disabled: boolean
  segmentValues: SegmentValueObj
  hourCycle: HourCycle
  placeholder: DateValue
  formatter: Formatter
}

function commonSegmentAttrs(props: SegmentAttrProps) {
  return {
    role: 'spinbutton',
    contenteditable: true,
    tabindex: props.disabled ? undefined : 0,
    spellcheck: false,
    inputmode: 'numeric',
    autocorrect: 'off',
    enterkeyhint: 'next',
    style: 'caret-color: transparent;',
  }
}

function daySegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, placeholder } = props
  const isEmpty = segmentValues.day === null

  // Include month from segmentValues to ensure correct max days calculation
  const dateFields: { day?: number, month?: number } = {}
  if (segmentValues.day)
    dateFields.day = segmentValues.day
  if (segmentValues.month)
    dateFields.month = segmentValues.month

  const date = setFields(placeholder, dateFields)

  const valueNow = date.day
  const valueMin = 1
  const valueMax = getDaysInMonth(date)
  const valueText = isEmpty ? 'Empty' : `${valueNow}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'day,',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function monthSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, placeholder, formatter } = props
  const isEmpty = segmentValues.month === null
  const date = segmentValues.month
    ? setFields(placeholder, { month: segmentValues.month })
    : placeholder
  const valueNow = date.month
  const valueMin = 1
  const valueMax = 12
  const valueText = isEmpty ? 'Empty' : `${valueNow} - ${formatter.fullMonth(date)}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'month, ',
    'contenteditable': true,
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function yearSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, placeholder } = props
  const isEmpty = segmentValues.year === null
  const date = segmentValues.year ? setFields(placeholder, { year: segmentValues.year }) : placeholder
  const valueMin = 1
  const valueMax = 9999
  const valueNow = getFieldValue(date, 'year')
  const valueText = isEmpty ? 'Empty' : `${valueNow}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'year, ',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function hourSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, hourCycle, placeholder } = props

  if (!('hour' in segmentValues) || !('hour' in placeholder))
    return {}
  const isEmpty = segmentValues.hour === null
  const date = segmentValues.hour ? setFields(placeholder, { hour: segmentValues.hour }) : placeholder
  const valueMin = hourCycle === 12 ? 1 : 0
  const valueMax = hourCycle === 12 ? 12 : 23
  const valueNow = date.hour
  const valueText = isEmpty ? 'Empty' : `${valueNow} ${segmentValues.dayPeriod ?? ''}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'hour, ',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function minuteSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, placeholder } = props
  if (!('minute' in segmentValues) || !('minute' in placeholder))
    return {}
  const isEmpty = segmentValues.minute === null
  const date = segmentValues.minute
    ? setFields(placeholder, { minute: segmentValues.minute })
    : placeholder
  const valueNow = date.minute
  const valueMin = 0
  const valueMax = 59
  const valueText = isEmpty ? 'Empty' : `${valueNow}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'minute, ',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function secondSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues, placeholder } = props
  if (!('second' in segmentValues) || !('second' in placeholder))
    return {}
  const isEmpty = segmentValues.second === null
  const date = segmentValues.second
    ? setFields(placeholder, { second: segmentValues.second })
    : placeholder
  const valueNow = date.second
  const valueMin = 0
  const valueMax = 59
  const valueText = isEmpty ? 'Empty' : `${valueNow}`

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'second, ',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function dayPeriodSegmentAttrs(props: SegmentAttrProps) {
  const { segmentValues } = props
  if (!('dayPeriod' in segmentValues))
    return {}

  const valueMin = 0
  const valueMax = 12
  const valueNow = segmentValues.hour ? (segmentValues.hour > 12 ? segmentValues.hour - 12 : segmentValues.hour) : 0
  const valueText = segmentValues.dayPeriod ?? 'AM'

  return {
    ...commonSegmentAttrs(props),
    'inputmode': 'text',
    'aria-label': 'AM/PM',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

function literalSegmentAttrs(_props: SegmentAttrProps) {
  return {
    'aria-hidden': true,
  }
}

function timeZoneSegmentAttrs(props: SegmentAttrProps) {
  return {
    'role': 'textbox',
    'aria-label': 'timezone, ',
    'tabindex': props.disabled ? undefined : 0,
    'style': 'caret-color: transparent;',
  }
}

function eraSegmentAttrs(props: SegmentAttrProps) {
  const { placeholder, formatter } = props

  const valueMin = 0
  const valueMax = 0
  const valueNow = 0
  // The era as the segment shows it ("R", "Heisei", "AD"), not Temporal's era
  // code (`reiwa`, `ce`), which is an identifier rather than a label.
  const valueText = formatter.part(placeholder, 'era', { era: 'short' }) || placeholder.era

  return {
    ...commonSegmentAttrs(props),
    'aria-label': 'era',
    'aria-valuemin': valueMin,
    'aria-valuemax': valueMax,
    'aria-valuenow': valueNow,
    'aria-valuetext': valueText,
  }
}

export const segmentBuilders = {
  day: {
    attrs: daySegmentAttrs,
  },
  month: {
    attrs: monthSegmentAttrs,
  },
  year: {
    attrs: yearSegmentAttrs,
  },
  hour: {
    attrs: hourSegmentAttrs,
  },
  minute: {
    attrs: minuteSegmentAttrs,
  },
  second: {
    attrs: secondSegmentAttrs,
  },
  dayPeriod: {
    attrs: dayPeriodSegmentAttrs,
  },
  literal: {
    attrs: literalSegmentAttrs,
  },
  timeZoneName: {
    attrs: timeZoneSegmentAttrs,
  },
  era: {
    attrs: eraSegmentAttrs,
  },
}

/**
 * Why a segmented field's value changed (#2828); shared by DateField,
 * DateRangeField, TimeField and TimeRangeField.
 *
 * - `segment-input`: a digit, or `a` / `p` on the day period, completed or edited the value.
 * - `segment-increment` / `segment-decrement`: ArrowUp / ArrowDown on a segment.
 * - `segment-clear`: Backspace removed a digit, or cleared the value.
 * - `step-snap`: `stepSnapping` rounded a segment to its step when it lost focus.
 */
export type SegmentFieldChangeReason
  = | 'segment-input'
    | 'segment-increment'
    | 'segment-decrement'
    | 'segment-clear'
    | 'step-snap'

export type UseDateFieldSegmentProps = {
  placeholder: Ref<DateValue>
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping?: Ref<boolean>
  formatter: Formatter
  segmentValues: Ref<SegmentValueObj>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  part: MaybeRefOrGetter<SegmentPart>
  modelValue: Readonly<Ref<DateValue | undefined>>
  /** Every value change goes through here, with the interaction that caused it. */
  setModelValue: (value: DateValue | undefined, reason: SegmentFieldChangeReason, event?: Event) => void
  focusNext: () => void
}

const kbd = useKbd()

/** The reason a committing keydown reports. */
function keydownReason(key: string): SegmentFieldChangeReason {
  if (key === kbd.ARROW_UP)
    return 'segment-increment'
  if (key === kbd.ARROW_DOWN)
    return 'segment-decrement'
  if (key === kbd.BACKSPACE)
    return 'segment-clear'
  return 'segment-input'
}

/**
 * The per-segment keyboard / IME logic every segmented field shares. Writes
 * segment values in place and commits a complete value through
 * `setModelValue(value, reason, event)`.
 *
 * One instance per rendered segment: the handlers are prototype methods, so a
 * segment costs one object rather than ~20 closures. Bind `handleEvent` (one
 * function for every event the segment listens to) on the element.
 *
 * @internal
 */
export class DateFieldSegmentController {
  /** Set when the segment loses focus: the next digit starts the value over. */
  hasLeftFocus = true
  /** Set after a leading `0`: the next digit completes the segment. */
  lastKeyZero = false

  constructor(readonly props: UseDateFieldSegmentProps) {}

  minuteSecondIncrementation({ e, part, dateRef, prevValue }: MinuteSecondIncrementProps): number {
    const step = this.props.step.value[part] ?? 1
    const sign = e.key === kbd.ARROW_UP ? step : -step
    const min = 0
    const max = 59

    if (prevValue === null)
      return sign > 0 ? min : max

    return getFieldValue(cycleField(setFields(dateRef, { [part]: prevValue }), part, sign), part)
  }

  deleteValue(prevValue: number | null, e: KeyboardEvent) {
    this.hasLeftFocus = false
    if (prevValue === null)
      return prevValue

    const str = prevValue.toString()
    if (str.length === 1) {
      this.props.setModelValue(undefined, 'segment-clear', e)
      return null
    }

    return Number.parseInt(str.slice(0, -1))
  }

  dateTimeValueIncrementation({ e, part, dateRef, prevValue }: DateTimeValueIncrementation): number {
    const step = this.props.step.value[part] ?? 1
    const sign = e.key === kbd.ARROW_UP ? step : -step

    if (prevValue === null)
      return getFieldValue(dateRef, part)

    if (part === 'hour' && 'hour' in dateRef) {
      // Don't pass hourCycle to cycle - internal representation is always 24-hour
      // The hourCycle prop only affects display, not internal cycling
      return getFieldValue(cycleField(setFields(dateRef, { [part]: prevValue }), part, sign), part)
    }

    if (part === 'day') {
      return getFieldValue(cycleField(setFields(dateRef, {
        [part]: prevValue,
        /**
         * Edge case for the day field:
         *
         * 1. If the month is filled,
         *   we need to ensure that the day snaps to the maximum value of that month.
         * 2. If the month is not filled,
         *   we default to the month with the maximum number of days (here just using January, 31 days),
         *   so that user can input any possible day.
         */
        month: this.props.segmentValues.value.month ?? 1,
      }), part, sign), part)
    }

    return getFieldValue(cycleField(setFields(dateRef, { [part]: prevValue }), part, sign), part)
  }

  updateDayOrMonth(max: number, num: number, prev: number | null) {
    let moveToNext = false
    const maxStart = Math.floor(max / 10)

    /**
     * If the user has left the segment, we want to reset the
     * `prev` value so that we can start the segment over again
     * when the user types a number.
     */
    if (this.hasLeftFocus) {
      this.hasLeftFocus = false
      this.lastKeyZero = false
      prev = null
    }

    if (prev === null) {
      /**
       * If the user types a 0 as the first number, we want
       * to keep track of that so that when they type the next
       * number, we can move to the next segment.
       */

      if (num === 0) {
        this.lastKeyZero = true
        return { value: null, moveToNext }
      }
      /**
       * If the last key was a 0, or if the first number is
       * greater than the max start digit (0-3 in most cases), then
       * we want to move to the next segment, since it's not possible
       * to continue typing a valid number in this segment.
       */

      if (this.lastKeyZero || num > maxStart) {
        // move to next
        moveToNext = true
      }
      this.lastKeyZero = false
      /**
       * If none of the above conditions are met, then we can just
       * return the number as the segment value and continue typing
       * in this segment.
       */
      return { value: num, moveToNext }
    }

    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */
    const digits = prev.toString().length
    const total = Number.parseInt(prev.toString() + num.toString())
    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */

    if (digits === 2 || total > max) {
      /**
       * As we're doing elsewhere, we're checking if the number is greater
       * than the max start digit (0-3 in most months), and if so, we're
       * going to move to the next segment.
       */
      if (num > maxStart || total > max) {
        // move to next
        moveToNext = true
      }
      return { value: num, moveToNext }
    }
    // move to next
    moveToNext = true
    return { value: total, moveToNext }
  }

  updateMinuteOrSecond(num: number, prev: number | null) {
    const max = 59
    let moveToNext = false
    const maxStart = Math.floor(max / 10)

    /**
     * If the user has left the segment, we want to reset the
     * `prev` value so that we can start the segment over again
     * when the user types a number.
     */
    if (this.hasLeftFocus) {
      this.hasLeftFocus = false
      this.lastKeyZero = false
      prev = null
    }

    if (prev === null) {
      /**
       * If the user types a 0 as the first number, we want
       * to keep track of that so that when they type the next
       * number, we can move to the next segment.
       */

      if (num === 0) {
        this.lastKeyZero = true
        return { value: 0, moveToNext }
      }
      /**
       * If the last key was a 0, or if the first number is
       * greater than the max start digit (0-3 in most cases), then
       * we want to move to the next segment, since it's not possible
       * to continue typing a valid number in this segment.
       */

      if (this.lastKeyZero || num > maxStart) {
        // move to next
        moveToNext = true
      }
      this.lastKeyZero = false
      /**
       * If none of the above conditions are met, then we can just
       * return the number as the segment value and continue typing
       * in this segment.
       */
      return { value: num, moveToNext }
    }

    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */
    const digits = prev.toString().length
    const total = Number.parseInt(prev.toString() + num.toString())

    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */

    if (digits === 2 || total > max) {
      /**
       * As we're doing elsewhere, we're checking if the number is greater
       * than the max start digit (0-3 in most months), and if so, we're
       * going to move to the next segment.
       */
      if (num > maxStart) {
        // move to next
        moveToNext = true
      }
      return { value: num, moveToNext }
    }
    // move to next
    moveToNext = true
    return { value: total, moveToNext }
  }

  updateHour(max: number, num: number, prev: number | null) {
    let moveToNext = false
    const maxStart = Math.floor(max / 10)

    /**
     * If the user has left the segment, we want to reset the
     * `prev` value so that we can start the segment over again
     * when the user types a number.
     */
    // probably not implement, kind of weird
    if (this.hasLeftFocus) {
      this.hasLeftFocus = false
      this.lastKeyZero = false
      prev = null
    }

    if (prev === null) {
      /**
       * If the user types a 0 as the first number, we want
       * to keep track of that so that when they type the next
       * number, we can move to the next segment.
       */

      if (num === 0) {
        this.lastKeyZero = true
        return { value: 0, moveToNext }
      }
      /**
       * If the last key was a 0, or if the first number is
       * greater than the max start digit (0-3 in most cases), then
       * we want to move to the next segment, since it's not possible
       * to continue typing a valid number in this segment.
       */

      if (this.lastKeyZero || num > maxStart) {
        // move to next
        moveToNext = true
      }
      this.lastKeyZero = false
      /**
       * If none of the above conditions are met, then we can just
       * return the number as the segment value and continue typing
       * in this segment.
       */
      return { value: num, moveToNext }
    }

    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */
    const digits = prev.toString().length
    const total = Number.parseInt(prev.toString() + num.toString())

    /**
     * If the number of digits is 2, or if the total with the existing digit
     * and the pressed digit is greater than the maximum value for this
     * month, then we will reset the segment as if the user had pressed the
     * backspace key and then typed the number.
     */

    if (digits === 2 || total > max) {
      /**
       * As we're doing elsewhere, we're checking if the number is greater
       * than the max start digit (0-3 in most months), and if so, we're
       * going to move to the next segment.
       */
      if (num > maxStart) {
        // move to next
        moveToNext = true
      }
      return { value: num, moveToNext }
    }
    // move to next
    moveToNext = true
    return { value: total, moveToNext }
  }

  updateYear(num: number, prev: number | null) {
    let moveToNext = false

    /**
     * If the user has left the segment, we want to reset the
     * `prev` value so that we can start the segment over again
     * when the user types a number.
     */
    // probably not implement, kind of weird
    if (this.hasLeftFocus) {
      this.hasLeftFocus = false
      prev = null
    }

    if (prev === null)
      return { value: num === 0 ? 1 : num, moveToNext }

    const str = prev.toString() + num.toString()

    if (str.length > 4)
      return { value: num === 0 ? 1 : num, moveToNext }

    if (str.length === 4)
      moveToNext = true

    const int = Number.parseInt(str)
    return { value: int, moveToNext }
  }

  /** The spinbutton aria of the segment; read in the render (no computed per segment). */
  attributes(): Record<string, unknown> {
    const props = this.props
    return segmentBuilders[toValue(props.part)]?.attrs({
      disabled: props.disabled.value,
      placeholder: props.placeholder.value,
      hourCycle: props.hourCycle,
      segmentValues: props.segmentValues.value,
      formatter: props.formatter,
    }) ?? {}
  }

  // TODO: look into abstracting segment keydown functions since they have the same structure (checks -> arrow_up, arrow_down update -> number string update -> move to next -> backspace update)
  handleDaySegmentKeydown(e: KeyboardEvent) {
    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key))
      return

    const prevValue = this.props.segmentValues.value.day

    if (e.key === kbd.ARROW_DOWN || e.key === kbd.ARROW_UP) {
      this.props.segmentValues.value.day = this.dateTimeValueIncrementation({ e, part: 'day', dateRef: this.props.placeholder.value, prevValue })
      return
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)
      const segmentMonthValue = this.props.segmentValues.value.month

      const daysInMonth = segmentMonthValue
        ? getDaysInMonth(setFields(this.props.placeholder.value, { month: segmentMonthValue }))
        // if the month is not set, we default to the maximum number of days in a month
        // so that user can input any possible day
        : 31

      const { value, moveToNext } = this.updateDayOrMonth(daysInMonth, num, prevValue)

      this.props.segmentValues.value.day = value

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.day = this.deleteValue(prevValue, e)
    }
  }

  handleMonthSegmentKeydown(e: KeyboardEvent) {
    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key))
      return

    const prevValue = this.props.segmentValues.value.month

    if (e.key === kbd.ARROW_DOWN || e.key === kbd.ARROW_UP) {
      this.props.segmentValues.value.month = this.dateTimeValueIncrementation({ e, part: 'month', dateRef: this.props.placeholder.value, prevValue })
      return
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)
      const { value, moveToNext } = this.updateDayOrMonth(12, num, prevValue)

      this.props.segmentValues.value.month = value

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.month = this.deleteValue(prevValue, e)
    }
  }

  handleYearSegmentKeydown(e: KeyboardEvent) {
    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key))
      return

    const prevValue = this.props.segmentValues.value.year

    if (e.key === kbd.ARROW_DOWN || e.key === kbd.ARROW_UP) {
      this.props.segmentValues.value.year = this.dateTimeValueIncrementation({ e, part: 'year', dateRef: this.props.placeholder.value, prevValue })
      return
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)
      const { value, moveToNext } = this.updateYear(num, prevValue)

      this.props.segmentValues.value.year = value

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.year = this.deleteValue(prevValue, e)
    }
  }

  uses12HourFormat(locale: string): boolean {
    const hourCycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle
    return hourCycle === 'h11' || hourCycle === 'h12'
  }

  handleHourSegmentKeydown(e: KeyboardEvent) {
    const dateRef = this.props.placeholder.value
    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key) || !('hour' in dateRef) || !('hour' in this.props.segmentValues.value))
      return

    const prevValue = this.props.segmentValues.value.hour

    if (e.key === kbd.ARROW_UP || e.key === kbd.ARROW_DOWN) {
      const newHour = this.dateTimeValueIncrementation({ e, part: 'hour', dateRef: this.props.placeholder.value, prevValue })
      this.props.segmentValues.value.hour = newHour

      if ('dayPeriod' in this.props.segmentValues.value && newHour !== null) {
        // Determine AM/PM based on internal 24-hour value
        // Hour 0-11 = AM, Hour 12-23 = PM
        this.props.segmentValues.value.dayPeriod = newHour >= 12 ? 'PM' : 'AM'
      }

      return
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)
      const is12Hour = this.props.hourCycle !== undefined
        ? this.props.hourCycle === 12
        : this.uses12HourFormat(this.props.formatter.getLocale())
      const max = is12Hour ? 12 : 24

      let displayPrev = prevValue
      if (is12Hour && prevValue !== null) {
        // 12 AM/PM should be treated as 0 internally even if it doesn't match the display
        // otherwise repeatedly typing 0 will not advance to the next segment
        displayPrev = prevValue % 12 === 0 ? 0 : (prevValue > 12 ? prevValue - 12 : prevValue)
      }

      const { value, moveToNext } = this.updateHour(max, num, displayPrev)

      // Convert display hour back to internal 24-hour format
      let internalValue = value
      if (is12Hour && value !== null) {
        const period = this.props.segmentValues.value.dayPeriod || 'AM'
        if (value === 12) {
          internalValue = period === 'AM' ? 0 : 12
        }
        else {
          internalValue = period === 'PM' ? value + 12 : value
        }
      }

      this.props.segmentValues.value.hour = internalValue

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.hour = this.deleteValue(prevValue, e)
    }
  }

  handleMinuteSegmentKeydown(e: KeyboardEvent) {
    const dateRef = this.props.placeholder.value

    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key) || !('minute' in dateRef) || !('minute' in this.props.segmentValues.value))
      return

    const prevValue = this.props.segmentValues.value.minute

    if (e.key === kbd.ARROW_UP || e.key === kbd.ARROW_DOWN) {
      this.props.segmentValues.value.minute = this.minuteSecondIncrementation({ e, part: 'minute', dateRef: this.props.placeholder.value, prevValue })
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)

      const { value, moveToNext } = this.updateMinuteOrSecond(num, prevValue)

      this.props.segmentValues.value.minute = value

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.minute = this.deleteValue(prevValue, e)
    }
  }

  handleSecondSegmentKeydown(e: KeyboardEvent) {
    const dateRef = this.props.placeholder.value

    if (!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key) || !('second' in dateRef) || !('second' in this.props.segmentValues.value))
      return

    const prevValue = this.props.segmentValues.value.second

    if (e.key === kbd.ARROW_UP || e.key === kbd.ARROW_DOWN) {
      this.props.segmentValues.value.second = this.minuteSecondIncrementation({ e, part: 'second', dateRef: this.props.placeholder.value, prevValue })
    }

    if (isNumberString(e.key)) {
      const num = Number.parseInt(e.key)
      const { value, moveToNext } = this.updateMinuteOrSecond(num, prevValue)

      this.props.segmentValues.value.second = value

      if (moveToNext)
        this.props.focusNext()
    }

    if (e.key === kbd.BACKSPACE) {
      this.hasLeftFocus = false
      this.props.segmentValues.value.second = this.deleteValue(prevValue, e)
    }
  }

  handleDayPeriodSegmentKeydown(e: KeyboardEvent) {
    if (((!isAcceptableSegmentKey(e.key) || isSegmentNavigationKey(e.key)) && e.key !== 'a' && e.key !== 'p') || !('hour' in this.props.placeholder.value) || !('dayPeriod' in this.props.segmentValues.value))
      return

    if (e.key === kbd.ARROW_UP || e.key === kbd.ARROW_DOWN) {
      if (this.props.segmentValues.value.dayPeriod === 'AM') {
        this.props.segmentValues.value.dayPeriod = 'PM'
        this.props.segmentValues.value.hour = this.props.segmentValues.value.hour! + 12
        return
      }
      this.props.segmentValues.value.dayPeriod = 'AM'
      this.props.segmentValues.value.hour = this.props.segmentValues.value.hour! - 12
      return
    }

    if (['a', 'A'].includes(e.key) && this.props.segmentValues.value.dayPeriod !== 'AM') {
      this.props.segmentValues.value.dayPeriod = 'AM'
      this.props.segmentValues.value.hour = this.props.segmentValues.value.hour! - 12
      return
    }

    if (['p', 'P'].includes(e.key) && this.props.segmentValues.value.dayPeriod !== 'PM') {
      this.props.segmentValues.value.dayPeriod = 'PM'
      this.props.segmentValues.value.hour = this.props.segmentValues.value.hour! + 12
    }
  }

  handleSegmentClick(e: MouseEvent) {
    const disabled = this.props.disabled.value
    if (disabled)
      e.preventDefault()
  }

  handleSegmentKeydown(e: KeyboardEvent) {
    // A genuine composition keydown sets `isComposing` or reports `key === 'Process'`.
    // Don't use `keyCode === 229` alone: a CJK IME (e.g. Pinyin) keeps that flag set
    // while passing a directly-typed key through, so a real digit (`key === '1'`)
    // would be dropped and leak into the contenteditable as raw text.
    if (e.isComposing || e.key === 'Process')
      return

    const disabled = this.props.disabled.value
    const readonly = this.props.readonly.value
    if (disabled || readonly)
      return
    if (e.key !== kbd.TAB)
      e.preventDefault()
    switch (toValue(this.props.part)) {
      case 'day':
        this.handleDaySegmentKeydown(e)
        break
      case 'month':
        this.handleMonthSegmentKeydown(e)
        break
      case 'year':
        this.handleYearSegmentKeydown(e)
        break
      case 'hour':
        this.handleHourSegmentKeydown(e)
        break
      case 'minute':
        this.handleMinuteSegmentKeydown(e)
        break
      case 'second':
        this.handleSecondSegmentKeydown(e)
        break
      case 'dayPeriod':
        this.handleDayPeriodSegmentKeydown(e)
        break
      // `timeZoneName` has no keys, and the era follows the year: neither has keys of its own.
    }

    if (![kbd.ARROW_LEFT, kbd.ARROW_RIGHT].includes(e.key) && e.key !== kbd.TAB && e.key !== kbd.SHIFT && isAcceptableSegmentKey(e.key)) {
      if (Object.values(this.props.segmentValues.value).every(item => item !== null)) {
        const updateObject = { ...this.props.segmentValues.value as Record<AnyExceptLiteral, number> }

        // Set all date fields at once to avoid order-dependent constraints
        // (e.g., setting day: 31 before month: 3 would incorrectly constrain the day)
        const dateRef = setFields(this.props.placeholder.value, updateObject)

        this.props.setModelValue(dateRef, keydownReason(e.key), e)
      }
    }
  }

  handleSegmentFocusOut(event?: FocusEvent) {
    if (!this.props.stepSnapping?.value)
      return

    const part = toValue(this.props.part)
    if (part === 'hour' && 'hour' in this.props.segmentValues.value && this.props.segmentValues.value.hour !== null && this.props.step.value.hour && this.props.step.value.hour > 1) {
      this.props.segmentValues.value.hour = snapValueToStep(this.props.segmentValues.value.hour, 0, 23, this.props.step.value.hour)
      if ('dayPeriod' in this.props.segmentValues.value) {
        if (this.props.segmentValues.value.hour < 12)
          this.props.segmentValues.value.dayPeriod = 'AM'
        else if (this.props.segmentValues.value.hour)
          this.props.segmentValues.value.dayPeriod = 'PM'
      }
    }
    else if (part === 'minute' && 'minute' in this.props.segmentValues.value && this.props.segmentValues.value.minute !== null && this.props.step.value.minute && this.props.step.value.minute > 1) {
      this.props.segmentValues.value.minute = snapValueToStep(this.props.segmentValues.value.minute, 0, 59, this.props.step.value.minute)
    }
    else if (part === 'second' && 'second' in this.props.segmentValues.value && this.props.segmentValues.value.second !== null && this.props.step.value.second && this.props.step.value.second > 1) {
      this.props.segmentValues.value.second = snapValueToStep(this.props.segmentValues.value.second, 0, 59, this.props.step.value.second)
    }

    if (Object.values(this.props.segmentValues.value).every(item => item !== null)) {
      const dateRef = setFields(this.props.placeholder.value, { ...this.props.segmentValues.value as Record<AnyExceptLiteral, number> })
      this.props.setModelValue(dateRef, 'step-snap', event)
    }
  }

  // Snapshot of the segment's child nodes (and their text) before the IME mutates
  // the contenteditable. Vue renders the value into one text node but may keep
  // empty sibling text nodes around it, so we must preserve EVERY node it owns and
  // restore them verbatim on `compositionend`. Recreating nodes (textContent) would
  // detach Vue's binding and freeze the segment; recreating the element isn't an
  // option either, since the root captures segment elements once via
  // `getSegmentElements` and a fresh node would break navigation.
  private preCompositionNodes: { node: ChildNode, value: string | null }[] | null = null

  handleSegmentBeforeInput(e: InputEvent) {
    // The segment's text is driven programmatically (keydown -> segmentValues ->
    // Vue render), so the contenteditable must never be edited directly. Safari
    // dispatches `beforeinput`/`input` BEFORE `keydown` while an IME is active,
    // so a passed-through key (e.g. a digit typed while Pinyin is selected) would
    // leak into the DOM as raw text before `handleSegmentKeydown` can prevent it.
    // Composition input keeps `isComposing` true, so let it through and reconcile
    // on `compositionend`.
    if (!e.isComposing)
      e.preventDefault()
  }

  handleSegmentCompositionStart(e: CompositionEvent) {
    const el = e.target as HTMLElement
    this.preCompositionNodes = Array.from(el.childNodes, node => ({ node, value: node.nodeValue }))
  }

  handleSegmentCompositionEnd(e: CompositionEvent) {
    const el = e.target as HTMLElement
    const original = this.preCompositionNodes
    this.preCompositionNodes = null

    // Restore Vue's original nodes (with their text) and drop anything the IME
    // inserted, keeping Vue's bindings intact so later renders still patch the DOM.
    // When no composition was tracked (e.g. synthetic events in tests) leave it be.
    if (original) {
      for (const { node, value } of original)
        node.nodeValue = value
      el.replaceChildren(...original.map(o => o.node))
    }

    const data = e.data
    if (!data)
      return

    for (const char of data) {
      if (!DIGIT_REG.test(char))
        continue

      // Dispatch to the focused segment so subsequent digits follow focus
      // after `focusNext()` advances to the next segment (e.g. "34" → 3 in day, 4 in month).
      const target = getActiveElement()
      if (!(target instanceof HTMLElement))
        break

      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true,
      }))
    }
  }

  /**
   * The one listener of a segment element: dispatches on `event.type`, so a
   * segment binds a single function for all its events.
   */
  handleEvent(event: Event) {
    switch (event.type) {
      case 'keydown':
        this.handleSegmentKeydown(event as KeyboardEvent)
        break
      case 'mousedown':
        this.handleSegmentClick(event as MouseEvent)
        break
      case 'beforeinput':
        this.handleSegmentBeforeInput(event as InputEvent)
        break
      case 'compositionstart':
        this.handleSegmentCompositionStart(event as CompositionEvent)
        break
      case 'compositionend':
        this.handleSegmentCompositionEnd(event as CompositionEvent)
        break
      case 'focusout':
        this.handleSegmentFocusOut(event as FocusEvent)
        break
    }
  }
}

/**
 * The per-segment keyboard / IME logic every segmented field shares, as a
 * `DateFieldSegmentController`.
 *
 * @internal
 */
export function useDateFieldSegment(props: UseDateFieldSegmentProps): DateFieldSegmentController {
  return new DateFieldSegmentController(props)
}
