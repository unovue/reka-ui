import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { RangeCalendarRootContext } from './RangeCalendarRoot.vue'
import type { CalendarGridData, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, DateValue, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateRange } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, unref, watch } from 'vue'
import { getCalendarGridSurface, getCalendarHeadingSurface, getCalendarNavSurface, getCalendarViewTriggerSurface } from '@/Calendar/useCalendar'
import { clampCalendarView, coarserUnit, compareDateValues, finerUnit, getUnitAdapter, isAfter, isBefore, isCoarserUnit, toIsoString } from '@/date'
import { assertTemporal } from '@/date/runtime'
import { createChangeEventDetails, createPartSurface, getterRef, useControllableState } from '@/shared'
import {
  CELL_FOCUS_TARGET,
  CELL_HIGHLIGHTED,
  CELL_HIGHLIGHTED_END,
  CELL_HIGHLIGHTED_START,
  CELL_IN_GRID,
  CELL_SELECTED,
  CELL_SELECTION_END,
  CELL_SELECTION_START,
  CELL_TODAY,
  createCalendarCellIndex,
  getCalendarCellIndex,
  getCellFocusNavigation,
  getDefaultDate,
  readCalendarCellFlags,
  setCalendarCellIndex,
  useCalendarGrid,
} from '@/shared/date'

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
  /**
   * Function-valued props are a plain function or a ref to one, never a
   * getter: `toValue()` would call the matcher itself as a getter.
   */
  isDateDisabled?: MaybeRef<Matcher | undefined>
  isDateUnavailable?: MaybeRef<Matcher | undefined>
  isDateHighlightable?: MaybeRef<Matcher | undefined>
  calendarLabel?: MaybeRefOrGetter<string | undefined>
  /** Custom paging, used only in the `granularity` view (coarser views page by their default step). */
  nextPage?: MaybeRef<CalendarPageFunction | undefined>
  /** Custom paging, used only in the `granularity` view (coarser views page by their default step). */
  prevPage?: MaybeRef<CalendarPageFunction | undefined>
  headingId?: string
  parentElement?: Ref<HTMLElement | undefined>
  /** Component `emit`; receives the `beforeUpdate:` / `update:` pairs plus `update:validModelValue` and `update:startValue`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdate?: (value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdateView?: (value: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  onUpdateValidModelValue?: (value: DateRange) => void
  /** Called after the range's start (the anchor the next press extends from) changes; the details carry the reason but cannot cancel it. */
  onUpdateStartValue?: (value: DateValue | undefined, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
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

/**
 * The date whose cell takes `tabindex="0"` (before the cell's own disabled /
 * outside-view checks): the placeholder when it can take focus, else the
 * selected end that can, else, with no usable selection, the first focusable cell.
 */
function rangeCalendarFocusTarget(context: RangeCalendarRootContext): DateValue | undefined {
  if (context.disabled.value)
    return undefined
  if (context.isPlaceholderFocusable.value)
    return context.placeholder.value
  if (context.selectedFocusableDate.value)
    return context.selectedFocusableDate.value
  if (!context.hasSelectedDate.value || context.isSelectedDisabled.value)
    return context.firstFocusableDate.value
  return undefined
}

/** The range flags of `date`, evaluated directly (at the granularity). */
function rangeFlagsOf(context: RangeCalendarRootContext, date: DateValue): number {
  let flags = 0
  if (context.isSelected(date))
    flags |= CELL_SELECTED
  if (context.isSelectionStart(date))
    flags |= CELL_SELECTION_START
  if (context.isSelectionEnd(date))
    flags |= CELL_SELECTION_END
  if (context.isHighlightedStart(date))
    flags |= CELL_HIGHLIGHTED_START
  if (context.isHighlightedEnd(date))
    flags |= CELL_HIGHLIGHTED_END
  const range = context.highlightedRange.value
  if (range) {
    const a = getUnitAdapter(context.granularity.value)
    if (a.compare(date, range.start) >= 0 && a.compare(date, range.end) <= 0)
      flags |= CELL_HIGHLIGHTED
  }
  return flags
}

/**
 * The per-cell flags the root derives (range, focus target, today) for a cell
 * at `unit`. Read from the root's keyed index when it can answer, so a press
 * or a hover only re-runs the cells whose flags change; evaluated directly
 * otherwise (a custom context, a cell of another unit / calendar, or a cell
 * for a date outside the rendered grid).
 */
function rangeCalendarCellFlags(context: RangeCalendarRootContext, date: DateValue, unit: CalendarUnit, adapter: CalendarUnitAdapter): number {
  const indexed = readCalendarCellFlags(getCalendarCellIndex(context), date, unit)
  // Cells of a view coarser than the granularity are navigation only: no range flags.
  const atGranularity = unit === context.granularity.value
  if (indexed !== undefined && (!atGranularity || indexed & CELL_IN_GRID))
    return indexed
  let flags = indexed ?? 0
  if (indexed === undefined) {
    if (adapter.isCurrent(date))
      flags |= CELL_TODAY
    const target = rangeCalendarFocusTarget(context)
    if (target && adapter.isSame(date, target))
      flags |= CELL_FOCUS_TARGET
  }
  if (atGranularity)
    flags |= rangeFlagsOf(context, date)
  return flags
}

/** The `RangeCalendarCell` (`role="gridcell"`) surface. */
export function getRangeCalendarCellSurface(
  context: RangeCalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
): PartSurface<RangeCalendarCellState> {
  // No computed per cell: the render evaluates this once, and the selection
  // comes from the root's keyed index, so only cells whose selection changed
  // re-render.
  function snapshot() {
    const date = toValue(value)
    const unit = context.view.value
    const adapter = context.adapter.value
    const p = toValue(page)
    const outsideView = p ? !adapter.isInPage(date, p) : false
    const disabled = context.isDateDisabled(date) || (context.disableDaysOutsideCurrentView.value && outsideView)
    // Only cells at the granularity carry selection; a coarser view is navigation.
    const selected = unit === context.granularity.value && !!(rangeCalendarCellFlags(context, date, unit, adapter) & CELL_SELECTED)
    const state: RangeCalendarCellState = { disabled, view: unit }
    const props = {
      'role': 'gridcell',
      'aria-selected': selected ? true as const : undefined,
      'aria-disabled': disabled || context.isDateUnavailable(date) || undefined,
    }
    return { state, props }
  }
  return {
    props: getterRef(() => snapshot().props),
    state: getterRef(() => snapshot().state),
    attrs: getterRef(() => {
      const { state, props } = snapshot()
      return state.disabled
        ? { 'data-disabled': '', 'data-view': state.view, ...props }
        : { 'data-view': state.view, ...props }
    }),
  }
}

/**
 * The `RangeCalendarCellTrigger` surface: selection, highlight, focus tracking
 * and the shared keyboard loop, for every view.
 *
 * One computed per cell holds everything the cell renders. The range, the
 * hovered range, the focus target and today come from the root's keyed index,
 * so a press, a hover or an arrow key re-evaluates only the cells whose state
 * changes. The keyboard loop is the root's (one per calendar) and the handlers
 * are created once per cell.
 */
export function getRangeCalendarCellTriggerSurface(
  context: RangeCalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
  unit?: MaybeRefOrGetter<CalendarUnit | undefined>,
): RangeCalendarCellTriggerSurface {
  const cell = computed(() => {
    const cellUnit = toValue(unit) ?? context.view.value
    const adapter = getUnitAdapter(cellUnit)
    const date = toValue(value)
    const p = toValue(page)
    const outsideView = p ? !adapter.isInPage(date, p) : false
    const unavailable = context.isDateUnavailable(date)
    const disabled = context.isDateDisabled(date) || (context.disableDaysOutsideCurrentView.value && outsideView)
    // Cells of a view coarser than the granularity are navigation only (no range flags).
    const flags = rangeCalendarCellFlags(context, date, cellUnit, adapter)
    // An unavailable date inside a range only reads as part of it when
    // non-contiguous ranges are allowed.
    const showsRangeState = context.allowNonContiguousRanges.value || !unavailable
    const focused = !outsideView && !disabled && !!(flags & CELL_FOCUS_TARGET)
    const selected = !!(flags & CELL_SELECTED) && showsRangeState
    // Read the locale so a locale change re-renders the cell text.
    const locale = context.locale.value
    const state: RangeCalendarCellTriggerState = {
      selected,
      highlighted: !!(flags & CELL_HIGHLIGHTED) && showsRangeState,
      selectionStart: !!(flags & CELL_SELECTION_START),
      selectionEnd: !!(flags & CELL_SELECTION_END),
      highlightedStart: !!(flags & CELL_HIGHLIGHTED_START),
      highlightedEnd: !!(flags & CELL_HIGHLIGHTED_END),
      disabled,
      unavailable,
      today: !!(flags & CELL_TODAY),
      outsideView,
      outsideVisibleView: context.isOutsideVisibleView(date),
      focused,
      view: cellUnit,
    }
    return {
      state,
      adapter,
      text: adapter.formatCell(context.formatter, date, locale),
      label: adapter.formatLabel(context.formatter, date),
      iso: toIsoString(date),
      tabindex: focused ? 0 : outsideView || disabled ? undefined : -1,
    }
  })

  // The cell's state comes partly from the root's keyed index, which a model
  // change only marks stale: publish it first, so a read in the same tick as
  // the change (or in its callback) does not return the cached old state.
  type CellSnapshot = typeof cell.value
  function current(): CellSnapshot {
    getCalendarCellIndex(context)?.refresh()
    return cell.value
  }

  const navigation = getCellFocusNavigation(context)
  const onClick = (event: MouseEvent) => {
    if (current().state.disabled)
      return
    context.onDateChange(toValue(value), 'cell-press', event)
  }
  const trackFocus = () => {
    const { state } = current()
    if (state.disabled || state.unavailable)
      return
    context.setFocusedValue(toValue(value))
  }
  const onKeydown = (event: KeyboardEvent) => {
    const date = toValue(value)
    navigation.handleKeydown(event, current().adapter, date, {
      disabled: current().state.disabled,
      onSelect: e => context.onDateChange(date, 'cell-keydown', e),
    })
  }

  function props(c: CellSnapshot) {
    return {
      'role': 'button',
      'aria-label': c.label,
      'aria-pressed': c.state.selected ? true as const : undefined,
      'aria-disabled': c.state.disabled || c.state.unavailable ? true as const : undefined,
      'data-value': c.iso,
      'data-reka-calendar-cell-trigger': '',
      'tabindex': c.tabindex,
      onClick,
      'onFocusin': trackFocus,
      'onMouseenter': trackFocus,
      onKeydown,
    }
  }

  return {
    props: getterRef(() => props(current())),
    state: getterRef(() => current().state),
    // `stateToDataAttrs(state)` then the props, written out: same attributes in the same order.
    attrs: getterRef(() => {
      const c = current()
      const s = c.state
      const attrs: Record<string, unknown> = {}
      if (s.selected)
        attrs['data-selected'] = ''
      if (s.highlighted)
        attrs['data-highlighted'] = ''
      if (s.selectionStart)
        attrs['data-selection-start'] = ''
      if (s.selectionEnd)
        attrs['data-selection-end'] = ''
      if (s.highlightedStart)
        attrs['data-highlighted-start'] = ''
      if (s.highlightedEnd)
        attrs['data-highlighted-end'] = ''
      if (s.disabled)
        attrs['data-disabled'] = ''
      if (s.unavailable)
        attrs['data-unavailable'] = ''
      if (s.today)
        attrs['data-today'] = ''
      if (s.outsideView)
        attrs['data-outside-view'] = ''
      if (s.outsideVisibleView)
        attrs['data-outside-visible-view'] = ''
      if (s.focused)
        attrs['data-focused'] = ''
      attrs['data-view'] = s.view
      return Object.assign(attrs, props(c))
    }),
    cellValue: getterRef(() => current().text),
  }
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
  assertTemporal()
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
  const disabledMatcher = computed(() => unref(props.isDateDisabled))
  const unavailableMatcher = computed(() => unref(props.isDateUnavailable))
  const highlightableMatcher = computed(() => unref(props.isDateHighlightable))
  const nextPageFn = computed(() => unref(props.nextPage))
  const prevPageFn = computed(() => unref(props.prevPage))
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
    defaultValue: () => props.defaultPlaceholder ?? getDefaultDate({
      defaultPlaceholder: toValue(props.placeholder),
      defaultValue: modelValue.value.start,
      locale: locale.value,
    }),
    name: 'placeholder',
    emit: props.emit,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: (a, b) => compareDateValues(a, b) === 0,
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
    return setPlaceholderState(value, reason, event)
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
    granularity,
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
    nextPage: nextPageFn,
    prevPage: prevPageFn,
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

    // With a maximum length and only a start, the whole reachable window is
    // highlighted in the direction of the focused cell (v2 `maximumDays`).
    const max = maximumLength.value
    if (max && !endValue.value) {
      const anchor = startValue.value
      if (a.compare(focusedValue.value, anchor) >= 0)
        return { start: anchor, end: a.add(anchor, max - 1) }
      return { start: a.add(anchor, -(max - 1)), end: anchor }
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
  // The start watcher keeps its own copy: Vue runs the `[startValue, endValue]`
  // watcher first (it subscribed last), and that one resets `pendingReason`.
  let pendingStartReason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action'
  let pendingStartEvent: Event | undefined
  function setPending(reason: RangeCalendarChangeReason | BaseChangeReason, event?: Event) {
    pendingReason = pendingStartReason = reason
    pendingEvent = pendingStartEvent = event
  }

  watch(modelValue, (next) => {
    const a = granularityAdapter.value
    if (!isSameOrBothEmpty(a, next.start, startValue.value))
      startValue.value = next.start
    if (!isSameOrBothEmpty(a, next.end, endValue.value))
      endValue.value = next.end
  })

  watch(startValue, (start) => {
    const reason = pendingStartReason
    const event = pendingStartEvent
    pendingStartReason = 'imperative-action'
    pendingStartEvent = undefined
    if (start && !granularityAdapter.value.isSame(start, placeholder.value))
      setPlaceholder(start, reason, event)
    // A notification of the anchor the next press extends from, after the
    // fact: the details carry the reason and event, but cannot cancel it.
    const details = createChangeEventDetails<RangeCalendarChangeReason>(reason, event)
    props.onUpdateStartValue?.(start, details)
    props.emit?.('update:startValue', start, details)
  })

  watch([startValue, endValue], ([start, end]) => {
    const reason = pendingReason
    const event = pendingEvent
    pendingReason = 'imperative-action'
    pendingEvent = undefined
    const a = granularityAdapter.value
    const current = modelValue.value
    if (current.start && current.end && start && end && a.isSame(current.start, start) && a.isSame(current.end, end))
      return

    isEditing.value = true
    let next: DateRange
    if (start && end) {
      next = a.compare(end, start) < 0
        ? { start: end, end: start }
        : { start, end }
    }
    else {
      next = start ? { start, end: undefined } : { start: end, end: undefined }
    }

    setModelValue(next, reason, event)
    if (lastChangeDetails.value.isCanceled) {
      // A vetoed change restores the last committed range.
      startValue.value = modelValue.value.start
      endValue.value = modelValue.value.end
      isEditing.value = false
      return
    }
    if (start && end) {
      isEditing.value = false
      validModelValue.value = { start: next.start!, end: next.end! }
    }
  })

  watch(validModelValue, (value) => {
    props.onUpdateValidModelValue?.(value)
    props.emit?.('update:validModelValue', value)
  })

  function abortEditing() {
    if (!isEditing.value)
      return
    setPending('escape-key')
    startValue.value = validModelValue.value.start
    endValue.value = validModelValue.value.end
  }

  // A hover in another view leaves a value of that view's unit behind; it must
  // not drive the highlighted range once the view changes.
  watch(view, () => {
    focusedValue.value = undefined
  })

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
      // A cancelled `beforeUpdate:placeholder` keeps the current page, so don't
      // drill into it. `false` for an unchanged placeholder is a no-op, not a cancel.
      const target = gridApi.adapter.value.resolve(date, placeholder.value)
      if (!setPlaceholder(target, 'view-drill', event) && compareDateValues(target, placeholder.value) !== 0)
        return
      setView(finer, 'view-drill', event)
      return
    }

    const previousStart = startValue.value
    const previousEnd = endValue.value
    setPending(reason, event)
    pressCell(date, reason, event)
    // Only a press that moves an end consumes the pending reason; leave none
    // behind for a later programmatic change to report.
    if (startValue.value === previousStart) {
      pendingStartReason = 'imperative-action'
      pendingStartEvent = undefined
      if (endValue.value === previousEnd) {
        pendingReason = 'imperative-action'
        pendingEvent = undefined
      }
    }
  }

  function pressCell(date: DateValue, reason: RangeCalendarChangeReason | BaseChangeReason, event?: Event) {
    const a = granularityAdapter.value

    if (startValue.value && highlightedRange.value === null) {
      if (a.isSame(date, startValue.value) && !preventDeselect.value && !endValue.value) {
        startValue.value = undefined
        setPlaceholder(date, reason, event)
        lastPressedDateValue.value = date
        return
      }
      else if (!endValue.value) {
        event?.preventDefault()
        if (lastPressedDateValue.value && a.isSame(lastPressedDateValue.value, date))
          startValue.value = date
        lastPressedDateValue.value = date
        return
      }
    }

    lastPressedDateValue.value = date

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
      startValue.value = date
    }
    else if (!endValue.value) {
      endValue.value = date
    }
    else if (!fixedDate.value) {
      endValue.value = undefined
      startValue.value = date
    }
    else if (fixedDate.value === 'start') {
      if (a.compare(date, startValue.value) < 0)
        startValue.value = date
      else
        endValue.value = date
    }
    else if (a.compare(date, endValue.value) > 0) {
      endValue.value = date
    }
    else {
      startValue.value = date
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

  // The per-cell flags, derived once per change for the whole grid and read
  // by key, so a press, a hover or a focus move re-renders only the cells
  // whose flags change.
  setCalendarCellIndex(context, createCalendarCellIndex({
    view,
    placeholder,
    grid: gridApi.grid,
    collect: (builder) => {
      // Only cells at the granularity carry the range; a coarser view is navigation.
      if (builder.unit === granularity.value) {
        const a = granularityAdapter.value
        const start = startValue.value
        const end = endValue.value
        const range = highlightedRange.value
        for (const { date, key } of builder.cells) {
          let flags = CELL_IN_GRID
          if (start && end && a.compare(date, start) > 0 && a.compare(date, end) < 0)
            flags |= CELL_SELECTED
          if (range && a.compare(date, range.start) >= 0 && a.compare(date, range.end) <= 0)
            flags |= CELL_HIGHLIGHTED
          builder.add(key, flags)
        }
        builder.addModelDate(start, CELL_SELECTED | CELL_SELECTION_START)
        builder.addModelDate(end, CELL_SELECTED | CELL_SELECTION_END)
        if (range) {
          builder.addModelDate(range.start, CELL_HIGHLIGHTED_START)
          builder.addModelDate(range.end, CELL_HIGHLIGHTED_END)
        }
      }
      builder.addDate(rangeCalendarFocusTarget(context), CELL_FOCUS_TARGET)
    },
  }))

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
