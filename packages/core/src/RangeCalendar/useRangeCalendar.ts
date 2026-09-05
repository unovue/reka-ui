import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { RangeCalendarRootContext } from './RangeCalendarRoot.vue'
import type { CalendarGridData, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateRange } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, watch } from 'vue'
import { clampCalendarView, coarserUnit, finerUnit, getUnitAdapter, isAfter, isBefore, isCoarserUnit } from '@/date'
import { createPartSurface, useControllableState } from '@/shared'
import { createCellFocusNavigation, getDefaultDate, useCalendarGrid } from '@/shared/date'
import { getCalendarGridSurface, getCalendarHeadingSurface, getCalendarNavSurface, getCalendarViewTriggerSurface } from '@/Calendar/useCalendar'

/** Why the model, placeholder or view changed; carried as `details.reason` on every change (#2828). */
export type RangeCalendarChangeReason
  = | 'cell-press'
    | 'cell-keydown'
    | 'view-drill'
    | 'view-trigger'
    | 'page-navigation'
    | 'focus-navigation'
    | 'escape-key'

export type RangeCalendarRootState = { disabled: boolean, readonly: boolean, invalid: boolean, view: CalendarUnit }
export type RangeCalendarCellState = { disabled: boolean, view: CalendarUnit }
export type RangeCalendarCellTriggerState = {
  selected: boolean
  highlighted: boolean
  selectionStart: boolean
  selectionEnd: boolean
  highlightedStart: boolean
  highlightedEnd: boolean
  disabled: boolean
  unavailable: boolean
  today: boolean
  outsideView: boolean
  outsideVisibleView: boolean
  focused: boolean
  view: CalendarUnit
}

/** The cell trigger surface plus the formatted cell text (`5`, `Sep`, `2026`) for the default slot. */
export interface RangeCalendarCellTriggerSurface extends PartSurface<RangeCalendarCellTriggerState> {
  cellValue: ComputedRef<string>
}

export interface UseRangeCalendarProps {
  /** Controlled range. A getter resolving to `undefined` is uncontrolled. */
  modelValue?: MaybeRefOrGetter<DateRange | null | undefined>
  defaultValue?: DateRange
  placeholder?: MaybeRefOrGetter<DateValue | undefined>
  defaultPlaceholder?: DateValue
  view?: MaybeRefOrGetter<CalendarUnit | undefined>
  defaultView?: CalendarUnit
  /** The unit both ends of the range commit. @default 'day' */
  granularity?: MaybeRefOrGetter<CalendarUnit | undefined>
  /** @default 'year' */
  maxView?: MaybeRefOrGetter<CalendarUnit | undefined>
  allowNonContiguousRanges?: MaybeRefOrGetter<boolean | undefined>
  preventDeselect?: MaybeRefOrGetter<boolean | undefined>
  /** Maximum inclusive length of the range, counted in units of `granularity`. */
  maximumLength?: MaybeRefOrGetter<number | undefined>
  fixedDate?: MaybeRefOrGetter<'start' | 'end' | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  initialFocus?: MaybeRefOrGetter<boolean | undefined>
  disableDaysOutsideCurrentView?: MaybeRefOrGetter<boolean | undefined>
  locale: MaybeRefOrGetter<string>
  dir?: MaybeRefOrGetter<Direction | undefined>
  weekStartsOn: MaybeRefOrGetter<WeekStartsOn>
  weekdayFormat?: MaybeRefOrGetter<WeekDayFormat | undefined>
  fixedWeeks?: MaybeRefOrGetter<boolean | undefined>
  numberOfMonths?: MaybeRefOrGetter<number | undefined>
  pagedNavigation?: MaybeRefOrGetter<boolean | undefined>
  yearsPerPage?: MaybeRefOrGetter<number | undefined>
  columns?: MaybeRefOrGetter<number | undefined>
  minValue?: MaybeRefOrGetter<DateValue | undefined>
  maxValue?: MaybeRefOrGetter<DateValue | undefined>
  isDateDisabled?: MaybeRefOrGetter<Matcher | undefined>
  isDateUnavailable?: MaybeRefOrGetter<Matcher | undefined>
  isDateHighlightable?: MaybeRefOrGetter<Matcher | undefined>
  calendarLabel?: MaybeRefOrGetter<string | undefined>
  nextPage?: MaybeRefOrGetter<CalendarPageFunction | undefined>
  prevPage?: MaybeRefOrGetter<CalendarPageFunction | undefined>
  headingId?: string
  parentElement?: Ref<HTMLElement | undefined>
  /** Component `emit`; receives the `beforeUpdate:` / `update:` pairs plus `update:validModelValue` and `update:startValue`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdate?: (value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdateView?: (value: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdateValidModelValue?: (value: DateRange) => void
  onUpdateStartValue?: (value: DateValue | undefined) => void
}

export interface UseRangeCalendarReturn {
  modelValue: ComputedRef<DateRange>
  startValue: Ref<DateValue | undefined>
  endValue: Ref<DateValue | undefined>
  placeholder: ComputedRef<DateValue>
  view: ComputedRef<CalendarUnit>
  granularity: ComputedRef<CalendarUnit>
  maxView: ComputedRef<CalendarUnit>
  grid: Ref<CalendarGridData[]>
  weekDays: ComputedRef<string[]>
  headingValue: ComputedRef<string>
  fullCalendarLabel: ComputedRef<string>
  isInvalid: ComputedRef<boolean>
  highlightedRange: ComputedRef<{ start: DateValue, end: DateValue } | null>
  /** Press a cell: extends / starts / clears the range at the granularity, drills down above it. */
  select: (value: DateValue, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => void
  setFocusedValue: (value: DateValue | undefined) => void
  /** Escape while a range is being edited: restore the last valid range. */
  abortEditing: () => void
  setPlaceholder: (value: DateValue, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  setView: (view: CalendarUnit, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  drillUp: (reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  nextPage: (fn?: CalendarPageFunction) => void
  prevPage: (fn?: CalendarPageFunction) => void
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<RangeCalendarChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<RangeCalendarRootState>
  heading: ReturnType<typeof getCalendarHeadingSurface>
  viewTrigger: ReturnType<typeof getCalendarViewTriggerSurface>
  prev: ReturnType<typeof getCalendarNavSurface>
  next: ReturnType<typeof getCalendarNavSurface>
  getGridSurface: () => ReturnType<typeof getCalendarGridSurface>
  getCellSurface: (value: MaybeRefOrGetter<DateValue>, page?: MaybeRefOrGetter<DateValue | undefined>) => PartSurface<RangeCalendarCellState>
  getCellTriggerSurface: (value: MaybeRefOrGetter<DateValue>, page?: MaybeRefOrGetter<DateValue | undefined>, unit?: MaybeRefOrGetter<CalendarUnit | undefined>) => RangeCalendarCellTriggerSurface
  context: RangeCalendarRootContext
}

let rangeCalendarCount = 0

const EMPTY_RANGE: DateRange = { start: undefined, end: undefined }

function isSameOrBothEmpty(adapter: CalendarUnitAdapter, a: DateValue | undefined, b: DateValue | undefined) {
  if (!a && !b)
    return true
  if (!a || !b)
    return false
  return adapter.isSame(a, b)
}

/** The `RangeCalendarCell` (`role="gridcell"`) surface. */
export function getRangeCalendarCellSurface(
  context: RangeCalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
): PartSurface<RangeCalendarCellState> {
  const outsideView = computed(() => {
    const p = toValue(page)
    return p ? !context.adapter.value.isInPage(toValue(value), p) : false
  })
  const disabled = computed(() => context.isDateDisabled(toValue(value)) || (context.disableDaysOutsideCurrentView.value && outsideView.value))
  return createPartSurface<RangeCalendarCellState>(
    () => ({
      'role': 'gridcell',
      'aria-selected': context.isSelected(toValue(value)) ? true : undefined,
      'aria-disabled': disabled.value || context.isDateUnavailable(toValue(value)) || undefined,
    }),
    () => ({ disabled: disabled.value, view: context.view.value }),
  )
}

/**
 * The `RangeCalendarCellTrigger` surface: selection, highlight, focus tracking
 * and the shared keyboard loop, for every view.
 */
export function getRangeCalendarCellTriggerSurface(
  context: RangeCalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
  unit?: MaybeRefOrGetter<CalendarUnit | undefined>,
): RangeCalendarCellTriggerSurface {
  const cellUnit = computed(() => toValue(unit) ?? context.view.value)
  const adapter = computed(() => getUnitAdapter(cellUnit.value))
  const granularityAdapter = computed(() => getUnitAdapter(context.granularity.value))
  const date = computed(() => toValue(value))
  // Cells of a view coarser than the granularity are navigation only.
  const atGranularity = computed(() => cellUnit.value === context.granularity.value)

  const cellValue = computed(() => {
    const locale = context.locale.value
    return adapter.value.formatCell(context.formatter, date.value, locale)
  })
  const labelText = computed(() => {
    void context.locale.value
    return adapter.value.formatLabel(context.formatter, date.value)
  })

  const isOutsideView = computed(() => {
    const p = toValue(page)
    return p ? !adapter.value.isInPage(date.value, p) : false
  })
  const isOutsideVisibleView = computed(() => context.isOutsideVisibleView(date.value))
  const isUnavailable = computed(() => context.isDateUnavailable(date.value))
  const isDisabled = computed(() => context.isDateDisabled(date.value) || (context.disableDaysOutsideCurrentView.value && isOutsideView.value))
  const isCurrent = computed(() => adapter.value.isCurrent(date.value))

  const isSelected = computed(() => atGranularity.value && context.isSelected(date.value))
  const isSelectionStart = computed(() => atGranularity.value && context.isSelectionStart(date.value))
  const isSelectionEnd = computed(() => atGranularity.value && context.isSelectionEnd(date.value))
  const isHighlightStart = computed(() => atGranularity.value && context.isHighlightedStart(date.value))
  const isHighlightEnd = computed(() => atGranularity.value && context.isHighlightedEnd(date.value))
  const isHighlighted = computed(() => {
    const range = context.highlightedRange.value
    if (!atGranularity.value || !range)
      return false
    const a = granularityAdapter.value
    return a.compare(date.value, range.start) >= 0 && a.compare(date.value, range.end) <= 0
  })
  // An unavailable date inside a range only reads as part of it when
  // non-contiguous ranges are allowed.
  const showsRangeState = computed(() => context.allowNonContiguousRanges.value || !isUnavailable.value)
  const showSelected = computed(() => isSelected.value && showsRangeState.value)
  const showHighlighted = computed(() => isHighlighted.value && showsRangeState.value)

  const isFocused = computed(() => {
    if (isOutsideView.value || isDisabled.value || context.disabled.value)
      return false
    if (context.isPlaceholderFocusable.value && adapter.value.isSame(date.value, context.placeholder.value))
      return true
    if (context.selectedFocusableDate.value && !context.isPlaceholderFocusable.value)
      return adapter.value.isSame(date.value, context.selectedFocusableDate.value)
    if ((!context.hasSelectedDate.value || context.isSelectedDisabled.value) && !context.isPlaceholderFocusable.value)
      return !!context.firstFocusableDate.value && adapter.value.isSame(date.value, context.firstFocusableDate.value)
    return false
  })

  const navigation = createCellFocusNavigation(context, adapter, date)

  function trackFocus() {
    if (isDisabled.value || isUnavailable.value)
      return
    context.setFocusedValue(date.value.copy())
  }

  const surface = createPartSurface<RangeCalendarCellTriggerState>(
    () => ({
      'role': 'button',
      'aria-label': labelText.value,
      'aria-pressed': showSelected.value ? true : undefined,
      'aria-disabled': isDisabled.value || isUnavailable.value ? true : undefined,
      'data-value': date.value.toString(),
      'data-reka-calendar-cell-trigger': '',
      'tabindex': isFocused.value ? 0 : isOutsideView.value || isDisabled.value ? undefined : -1,
      'onClick': (event: MouseEvent) => {
        if (isDisabled.value)
          return
        context.onDateChange(date.value, 'cell-press', event)
      },
      'onFocusin': trackFocus,
      'onMouseenter': trackFocus,
      'onKeydown': (event: KeyboardEvent) => navigation.handleKeydown(event, {
        disabled: isDisabled.value,
        onSelect: e => context.onDateChange(date.value, 'cell-keydown', e),
      }),
    }),
    () => ({
      selected: showSelected.value,
      highlighted: showHighlighted.value,
      selectionStart: isSelectionStart.value,
      selectionEnd: isSelectionEnd.value,
      highlightedStart: isHighlightStart.value,
      highlightedEnd: isHighlightEnd.value,
      disabled: isDisabled.value,
      unavailable: isUnavailable.value,
      today: isCurrent.value,
      outsideView: isOutsideView.value,
      outsideVisibleView: isOutsideVisibleView.value,
      focused: isFocused.value,
      view: cellUnit.value,
    }),
  )

  return { ...surface, cellValue }
}

/**
 * Headless RangeCalendar logic: the range model (start / end / valid range),
 * placeholder and view, range highlighting, selection rules (`fixedDate`,
 * `maximumLength`, `allowNonContiguousRanges`, deselect) and the per-part
 * surfaces. `RangeCalendarRoot.vue` composes this.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers.
 */
export function useRangeCalendar(props: UseRangeCalendarProps): UseRangeCalendarReturn {
  const locale = computed(() => toValue(props.locale))
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const initialFocus = computed(() => toValue(props.initialFocus) ?? false)
  const preventDeselect = computed(() => toValue(props.preventDeselect) ?? false)
  const allowNonContiguousRanges = computed(() => toValue(props.allowNonContiguousRanges) ?? false)
  const disableDaysOutsideCurrentView = computed(() => toValue(props.disableDaysOutsideCurrentView) ?? false)
  const fixedDate = computed(() => toValue(props.fixedDate))
  const maximumLength = computed(() => toValue(props.maximumLength))
  const minValue = computed(() => toValue(props.minValue))
  const maxValue = computed(() => toValue(props.maxValue))
  const granularity = computed<CalendarUnit>(() => toValue(props.granularity) ?? 'day')
  const maxView = computed<CalendarUnit>(() => {
    const requested = toValue(props.maxView) ?? 'year'
    return isCoarserUnit(granularity.value, requested) ? granularity.value : requested
  })
  const granularityAdapter = computed(() => getUnitAdapter(granularity.value))
  const disabledMatcher = computed(() => toValue(props.isDateDisabled))
  const unavailableMatcher = computed(() => toValue(props.isDateUnavailable))
  const highlightableMatcher = computed(() => toValue(props.isDateHighlightable))
  const headingId = props.headingId ?? `reka-range-calendar-heading-${++rangeCalendarCount}`
  const parentElement = props.parentElement ?? ref<HTMLElement>()

  const { state: rawModelValue, setState: setModelValue, lastChangeDetails, isControlled } = useControllableState<DateRange, RangeCalendarChangeReason>({
    prop: () => toValue(props.modelValue) ?? undefined,
    defaultValue: () => props.defaultValue ?? { ...EMPTY_RANGE },
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
    isEqual: (a, b) => {
      const adapter = granularityAdapter.value
      return isSameOrBothEmpty(adapter, a?.start, b?.start) && isSameOrBothEmpty(adapter, a?.end, b?.end)
    },
  })
  // A controlled model cleared to `undefined` reads as an empty range.
  const modelValue = computed<DateRange>(() => rawModelValue.value ?? EMPTY_RANGE)

  const startValue = ref(modelValue.value.start) as Ref<DateValue | undefined>
  const endValue = ref(modelValue.value.end) as Ref<DateValue | undefined>
  const focusedValue = ref() as Ref<DateValue | undefined>
  const lastPressedDateValue = ref() as Ref<DateValue | undefined>
  const validModelValue = ref({ ...modelValue.value }) as Ref<DateRange>
  const isEditing = ref(false)

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, RangeCalendarChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder?.copy() ?? getDefaultDate({
      defaultPlaceholder: toValue(props.placeholder),
      defaultValue: modelValue.value.start,
      locale: locale.value,
    }).copy(),
    name: 'placeholder',
    emit: props.emit,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: (a, b) => a.compare(b) === 0,
  })

  const { state: rawView, setState: setViewState } = useControllableState<CalendarUnit, RangeCalendarChangeReason>({
    prop: () => toValue(props.view),
    defaultValue: () => props.defaultView ?? granularity.value,
    name: 'view',
    emit: props.emit,
    onUpdate: props.onUpdateView,
  })
  const view = computed(() => clampCalendarView(rawView.value, granularity.value, maxView.value))

  function setPlaceholder(value: DateValue, reason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value.copy(), reason, event)
  }

  function setView(next: CalendarUnit, reason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setViewState(clampCalendarView(next, granularity.value, maxView.value), reason, event)
  }

  function drillUp(reason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const next = coarserUnit(view.value)
    if (!next || isCoarserUnit(next, maxView.value))
      return false
    return setView(next, reason, event)
  }

  const gridApi = useCalendarGrid({
    unit: view,
    placeholder,
    setPlaceholder: value => setPlaceholder(value, 'page-navigation'),
    locale,
    weekStartsOn: () => toValue(props.weekStartsOn),
    weekdayFormat: () => toValue(props.weekdayFormat),
    fixedWeeks: () => toValue(props.fixedWeeks),
    numberOfMonths: () => toValue(props.numberOfMonths),
    pagedNavigation: () => toValue(props.pagedNavigation),
    yearsPerPage: () => toValue(props.yearsPerPage),
    columns: () => toValue(props.columns),
    minValue,
    maxValue,
    disabled,
    isDateDisabled: disabledMatcher,
    isDateUnavailable: unavailableMatcher,
    calendarLabel: () => toValue(props.calendarLabel),
    nextPage: () => toValue(props.nextPage),
    prevPage: () => toValue(props.prevPage),
  })

  // ---- range state, evaluated at the granularity ----

  /** Disabled for selection purposes: matcher, `disabled`, bounds — at the granularity. */
  function isDisabledAtGranularity(date: DateValue) {
    const a = granularityAdapter.value
    if (disabledMatcher.value?.(date, a.unit) || disabled.value)
      return true
    if (maxValue.value && isAfter(a.startOf(date), maxValue.value))
      return true
    if (minValue.value && isBefore(a.endOf(date), minValue.value))
      return true
    return false
  }

  const isDateUnavailableAtGranularity: Matcher = date => !!unavailableMatcher.value?.(date, granularity.value)
  const isDateHighlightable: Matcher = date => !!highlightableMatcher.value?.(date, granularity.value)

  /** `isDisabledAtGranularity` plus the `maximumLength` window around the anchor. */
  function rangeIsDateDisabled(date: DateValue) {
    if (isDisabledAtGranularity(date))
      return true

    const max = maximumLength.value
    if (!max)
      return false
    const a = granularityAdapter.value
    const start = startValue.value
    const end = endValue.value

    if (start && end) {
      if (!fixedDate.value)
        return false
      const length = a.distance(start, end)
      if (length <= max) {
        const left = max - length
        return a.compare(date, a.add(start, -left)) < 0 || a.compare(date, a.add(end, left)) > 0
      }
      const anchor = fixedDate.value === 'start' ? start : end
      return a.compare(date, a.add(anchor, -(max - 1))) < 0 || a.compare(date, a.add(anchor, max - 1)) > 0
    }
    if (start)
      return a.compare(date, a.add(start, -(max - 1))) < 0 || a.compare(date, a.add(start, max - 1)) > 0
    return false
  }

  /** What a cell asks: the active view's rule, plus the range window at the granularity. */
  const isDateDisabled: Matcher = date => view.value === granularity.value ? rangeIsDateDisabled(date) : gridApi.isDateDisabled(date)

  const isSelectionStart = (date: DateValue) => !!startValue.value && granularityAdapter.value.isSame(startValue.value, date)
  const isSelectionEnd = (date: DateValue) => !!endValue.value && granularityAdapter.value.isSame(endValue.value, date)

  const isSelected = (date: DateValue) => {
    const a = granularityAdapter.value
    if (startValue.value && a.isSame(startValue.value, date))
      return true
    if (endValue.value && a.isSame(endValue.value, date))
      return true
    if (startValue.value && endValue.value)
      return a.compare(date, startValue.value) > 0 && a.compare(date, endValue.value) < 0
    return false
  }

  const highlightedRange = computed<{ start: DateValue, end: DateValue } | null>(() => {
    const a = granularityAdapter.value
    if (startValue.value && endValue.value && !fixedDate.value)
      return null
    if (!startValue.value || !focusedValue.value)
      return null

    const isStartBeforeFocused = a.compare(startValue.value, focusedValue.value) < 0
    const start = isStartBeforeFocused ? startValue.value : focusedValue.value
    const end = isStartBeforeFocused ? focusedValue.value : startValue.value

    if (a.isSame(start, end))
      return { start, end }

    const max = maximumLength.value
    if (max && !endValue.value) {
      const anchor = startValue.value
      const focused = focusedValue.value
      if (a.compare(focused, anchor) >= 0) {
        const maxEnd = a.add(anchor, max - 1)
        return { start: anchor, end: a.compare(focused, maxEnd) > 0 ? maxEnd : focused }
      }
      const minStart = a.add(anchor, -(max - 1))
      return { start: a.compare(focused, minStart) < 0 ? minStart : focused, end: anchor }
    }

    const valid = a.areAllBetweenValid(
      start,
      end,
      allowNonContiguousRanges.value ? () => false : isDateUnavailableAtGranularity,
      rangeIsDateDisabled,
      highlightableMatcher.value ? isDateHighlightable : undefined,
    )
    return valid ? { start, end } : null
  })

  const isHighlightedStart = (date: DateValue) => !!highlightedRange.value && granularityAdapter.value.isSame(highlightedRange.value.start, date)
  const isHighlightedEnd = (date: DateValue) => !!highlightedRange.value && granularityAdapter.value.isSame(highlightedRange.value.end, date)

  const hasSelectedDate = computed(() => !!(startValue.value || endValue.value))
  const isStartDisabled = computed(() => !!startValue.value && isDisabledAtGranularity(startValue.value))
  const isEndDisabled = computed(() => !!endValue.value && isDisabledAtGranularity(endValue.value))
  const isSelectedDisabled = computed(() => {
    const hasStart = !!startValue.value
    const hasEnd = !!endValue.value
    if (!hasStart && !hasEnd)
      return false
    if (hasStart && hasEnd)
      return isStartDisabled.value && isEndDisabled.value
    return (hasStart && isStartDisabled.value) || (hasEnd && isEndDisabled.value)
  })
  const selectedFocusableDate = computed(() => {
    if (startValue.value && !isStartDisabled.value)
      return startValue.value
    if (endValue.value && !isEndDisabled.value)
      return endValue.value
    return undefined
  })

  const isInvalid = computed(() => {
    if (isStartDisabled.value || isEndDisabled.value)
      return true
    if (startValue.value && endValue.value && granularityAdapter.value.compare(endValue.value, startValue.value) < 0)
      return true
    return false
  })

  // ---- model ↔ start/end sync (ported from the v2 root) ----

  let pendingReason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action'
  let pendingEvent: Event | undefined

  watch(modelValue, (next) => {
    const a = granularityAdapter.value
    if (!isSameOrBothEmpty(a, next.start, startValue.value))
      startValue.value = next.start?.copy()
    if (!isSameOrBothEmpty(a, next.end, endValue.value))
      endValue.value = next.end?.copy()
  })

  watch(startValue, (start) => {
    if (start && !granularityAdapter.value.isSame(start, placeholder.value))
      setPlaceholder(start, pendingReason, pendingEvent)
    props.onUpdateStartValue?.(start)
    props.emit?.('update:startValue', start)
  })

  watch([startValue, endValue], ([start, end]) => {
    const a = granularityAdapter.value
    const current = modelValue.value
    if (current.start && current.end && start && end && a.isSame(current.start, start) && a.isSame(current.end, end))
      return

    isEditing.value = true
    let next: DateRange
    if (start && end) {
      next = a.compare(end, start) < 0
        ? { start: end.copy(), end: start.copy() }
        : { start: start.copy(), end: end.copy() }
    }
    else {
      next = start ? { start: start.copy(), end: undefined } : { start: end?.copy(), end: undefined }
    }

    const reason = pendingReason
    const event = pendingEvent
    pendingReason = 'imperative-action'
    pendingEvent = undefined

    setModelValue(next, reason, event)
    if (lastChangeDetails.value.isCanceled) {
      // A vetoed change restores the last committed range.
      startValue.value = modelValue.value.start?.copy()
      endValue.value = modelValue.value.end?.copy()
      isEditing.value = false
      return
    }
    if (start && end) {
      isEditing.value = false
      validModelValue.value = { start: next.start!.copy(), end: next.end!.copy() }
    }
  })

  watch(validModelValue, (value) => {
    props.onUpdateValidModelValue?.(value)
    props.emit?.('update:validModelValue', value)
  })

  function abortEditing() {
    if (!isEditing.value)
      return
    pendingReason = 'escape-key'
    startValue.value = validModelValue.value.start?.copy()
    endValue.value = validModelValue.value.end?.copy()
  }

  function setFocusedValue(value: DateValue | undefined) {
    focusedValue.value = value
  }

  function select(date: DateValue, reason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (readonly.value)
      return
    if (isDateDisabled(date) || gridApi.isDateUnavailable(date))
      return

    // Above the granularity a cell is navigation, not selection (D2).
    if (isCoarserUnit(view.value, granularity.value)) {
      const finer = finerUnit(view.value)!
      setPlaceholder(gridApi.adapter.value.resolve(date, placeholder.value), 'view-drill', event)
      setView(finer, 'view-drill', event)
      return
    }

    const a = granularityAdapter.value
    pendingReason = reason
    pendingEvent = event

    if (startValue.value && highlightedRange.value === null) {
      if (a.isSame(date, startValue.value) && !preventDeselect.value && !endValue.value) {
        startValue.value = undefined
        setPlaceholder(date, reason, event)
        lastPressedDateValue.value = date.copy()
        return
      }
      else if (!endValue.value) {
        event?.preventDefault()
        if (lastPressedDateValue.value && a.isSame(lastPressedDateValue.value, date))
          startValue.value = date.copy()
        lastPressedDateValue.value = date.copy()
        return
      }
    }

    lastPressedDateValue.value = date.copy()

    if (
      startValue.value
      && endValue.value
      && a.isSame(startValue.value, endValue.value)
      && a.isSame(startValue.value, date)
      && !preventDeselect.value
    ) {
      startValue.value = undefined
      endValue.value = undefined
      setPlaceholder(date, reason, event)
      return
    }

    if (!startValue.value) {
      startValue.value = date.copy()
    }
    else if (!endValue.value) {
      endValue.value = date.copy()
    }
    else if (!fixedDate.value) {
      endValue.value = undefined
      startValue.value = date.copy()
    }
    else if (fixedDate.value === 'start') {
      if (a.compare(date, startValue.value) < 0)
        startValue.value = date.copy()
      else
        endValue.value = date.copy()
    }
    else if (a.compare(date, endValue.value) > 0) {
      endValue.value = date.copy()
    }
    else {
      startValue.value = date.copy()
    }
  }

  const context: RangeCalendarRootContext = {
    locale,
    dir,
    disabled,
    readonly,
    initialFocus,
    preventDeselect,
    allowNonContiguousRanges,
    disableDaysOutsideCurrentView,
    fixedDate,
    maximumLength,
    minValue,
    maxValue,
    disabledMatcher,
    modelValue,
    startValue,
    endValue,
    focusedValue,
    lastPressedDateValue,
    isEditing,
    placeholder,
    view,
    granularity,
    maxView,
    headingId,
    parentElement,
    grid: gridApi.grid,
    weekDays: gridApi.weekdays,
    weekStartsOn: computed(() => toValue(props.weekStartsOn)),
    weekdayFormat: computed(() => toValue(props.weekdayFormat) ?? 'narrow'),
    fixedWeeks: computed(() => toValue(props.fixedWeeks) ?? false),
    numberOfMonths: computed(() => toValue(props.numberOfMonths) ?? 1),
    pagedNavigation: computed(() => toValue(props.pagedNavigation) ?? false),
    layout: gridApi.layout,
    headingValue: gridApi.headingValue,
    fullCalendarLabel: gridApi.fullCalendarLabel,
    isInvalid,
    hasSelectedDate,
    isSelectedDisabled,
    selectedFocusableDate,
    isPlaceholderFocusable: gridApi.isPlaceholderFocusable,
    firstFocusableDate: gridApi.firstFocusableDate,
    rowLength: gridApi.rowLength,
    formatter: gridApi.formatter,
    adapter: gridApi.adapter,
    isDateDisabled,
    isDateUnavailable: gridApi.isDateUnavailable,
    isDateHighlightable,
    highlightedRange,
    isSelected,
    isSelectionStart,
    isSelectionEnd,
    isHighlightedStart,
    isHighlightedEnd,
    isOutsideVisibleView: gridApi.isOutsideVisibleView,
    prevPage: gridApi.prevPage,
    nextPage: gridApi.nextPage,
    isPrevButtonDisabled: gridApi.isPrevButtonDisabled,
    isNextButtonDisabled: gridApi.isNextButtonDisabled,
    onDateChange: select,
    onPlaceholderChange: setPlaceholder,
    setFocusedValue,
    abortEditing,
    setView,
    drillUp,
  }

  const root = createPartSurface<RangeCalendarRootState>(
    () => ({
      'aria-label': gridApi.fullCalendarLabel.value,
      'dir': dir.value,
    }),
    () => ({ disabled: disabled.value, readonly: readonly.value, invalid: isInvalid.value, view: view.value }),
  )

  return {
    modelValue,
    startValue,
    endValue,
    placeholder,
    view,
    granularity,
    maxView,
    grid: gridApi.grid,
    weekDays: gridApi.weekdays,
    headingValue: gridApi.headingValue,
    fullCalendarLabel: gridApi.fullCalendarLabel,
    isInvalid,
    highlightedRange,
    select,
    setFocusedValue,
    abortEditing,
    setPlaceholder,
    setView,
    drillUp,
    nextPage: gridApi.nextPage,
    prevPage: gridApi.prevPage,
    isNextButtonDisabled: gridApi.isNextButtonDisabled,
    isPrevButtonDisabled: gridApi.isPrevButtonDisabled,
    lastChangeDetails,
    isControlled,
    root,
    heading: getCalendarHeadingSurface(context),
    viewTrigger: getCalendarViewTriggerSurface(context),
    prev: getCalendarNavSurface(context, 'prev'),
    next: getCalendarNavSurface(context, 'next'),
    getGridSurface: () => getCalendarGridSurface(context),
    getCellSurface: (value, page) => getRangeCalendarCellSurface(context, value, page),
    getCellTriggerSurface: (value, page, unit) => getRangeCalendarCellTriggerSurface(context, value, page, unit),
    context,
  }
}
