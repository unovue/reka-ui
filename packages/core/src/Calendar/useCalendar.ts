import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CalendarRootContext } from './CalendarRoot.vue'
import type { CalendarGridData, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, DateValue, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, unref, watch } from 'vue'
import { clampCalendarView, coarserUnit, compareDateValues, finerUnit, focusedDateValue, getUnitAdapter, isAfter, isBefore, isCoarserUnit, isSameDateSelection, toIsoString } from '@/date'
import { assertTemporal } from '@/date/runtime'
import { createPartSurface, getterRef, useControllableState } from '@/shared'
import { CELL_FOCUS_TARGET, CELL_SELECTED, CELL_TODAY, createCalendarCellIndex, getCalendarCellIndex, getCellFocusNavigation, getDefaultDate, readCalendarCellFlags, setCalendarCellIndex, useCalendarGrid } from '@/shared/date'

/** Why the model, placeholder or view changed; carried as `details.reason` on every change (#2828). */
export type CalendarChangeReason
  = | 'cell-press'
    | 'cell-keydown'
    | 'view-drill'
    | 'view-trigger'
    | 'page-navigation'
    | 'focus-navigation'

export type CalendarModelValue = DateValue | DateValue[] | undefined

export type CalendarRootState = { disabled: boolean, readonly: boolean, invalid: boolean, view: CalendarUnit }
export type CalendarHeadingState = { disabled: boolean, view: CalendarUnit }
export type CalendarViewTriggerState = { disabled: boolean, view: CalendarUnit }
export type CalendarNavState = { disabled: boolean }
export type CalendarGridState = { disabled: boolean, readonly: boolean, view: CalendarUnit }
export type CalendarCellState = { disabled: boolean, view: CalendarUnit }
export type CalendarCellTriggerState = {
  selected: boolean
  disabled: boolean
  unavailable: boolean
  today: boolean
  outsideView: boolean
  outsideVisibleView: boolean
  focused: boolean
  view: CalendarUnit
}

/** The cell trigger surface plus the formatted cell text (`5`, `Sep`, `2026`) for the default slot. */
export interface CalendarCellTriggerSurface extends PartSurface<CalendarCellTriggerState> {
  cellValue: ComputedRef<string>
}

export interface UseCalendarProps {
  /** Controlled selected value. A getter resolving to `undefined` is uncontrolled. */
  modelValue?: MaybeRefOrGetter<CalendarModelValue | null>
  defaultValue?: CalendarModelValue
  /** Controlled placeholder: the date that decides which page is shown. */
  placeholder?: MaybeRefOrGetter<DateValue | undefined>
  defaultPlaceholder?: DateValue
  /** Controlled view. Clamped into `[granularity, maxView]`. */
  view?: MaybeRefOrGetter<CalendarUnit | undefined>
  /** @default granularity */
  defaultView?: CalendarUnit
  /** The unit a selection commits. @default 'day' */
  granularity?: MaybeRefOrGetter<CalendarUnit | undefined>
  /** The coarsest view the heading trigger can reach. @default 'year' */
  maxView?: MaybeRefOrGetter<CalendarUnit | undefined>
  multiple?: MaybeRefOrGetter<boolean | undefined>
  preventDeselect?: MaybeRefOrGetter<boolean | undefined>
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
  calendarLabel?: MaybeRefOrGetter<string | undefined>
  /** Custom paging, used only in the `granularity` view (coarser views page by their default step). */
  nextPage?: MaybeRef<CalendarPageFunction | undefined>
  /** Custom paging, used only in the `granularity` view (coarser views page by their default step). */
  prevPage?: MaybeRef<CalendarPageFunction | undefined>
  /** Id of the (visually hidden) heading that labels the grids. The SFC passes `useId()`. */
  headingId?: string
  /** The root element, used for keyboard focus queries. The SFC passes its `currentElement`. */
  parentElement?: Ref<HTMLElement | undefined>
  /** Component `emit`; receives `beforeUpdate:` / `update:` for `modelValue`, `placeholder` and `view`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason>) => void
  onUpdate?: (value: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<CalendarChangeReason>) => void
  onUpdateView?: (value: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>) => void
}

export interface UseCalendarReturn {
  modelValue: ComputedRef<CalendarModelValue>
  placeholder: ComputedRef<DateValue>
  view: ComputedRef<CalendarUnit>
  granularity: ComputedRef<CalendarUnit>
  maxView: ComputedRef<CalendarUnit>
  grid: Ref<CalendarGridData[]>
  weekDays: ComputedRef<string[]>
  headingValue: ComputedRef<string>
  fullCalendarLabel: ComputedRef<string>
  isInvalid: ComputedRef<boolean>
  /** Select a cell: commits at the granularity, drills down above it. */
  select: (value: DateValue, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => void
  setPlaceholder: (value: DateValue, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  setView: (view: CalendarUnit, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Switch to the next coarser view, up to `maxView`. */
  drillUp: (reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  nextPage: (fn?: CalendarPageFunction) => void
  prevPage: (fn?: CalendarPageFunction) => void
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<CalendarChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<CalendarRootState>
  heading: PartSurface<CalendarHeadingState>
  viewTrigger: PartSurface<CalendarViewTriggerState>
  prev: PartSurface<CalendarNavState>
  next: PartSurface<CalendarNavState>
  getGridSurface: () => PartSurface<CalendarGridState>
  getCellSurface: (value: MaybeRefOrGetter<DateValue>, page?: MaybeRefOrGetter<DateValue | undefined>) => PartSurface<CalendarCellState>
  getCellTriggerSurface: (value: MaybeRefOrGetter<DateValue>, page?: MaybeRefOrGetter<DateValue | undefined>, unit?: MaybeRefOrGetter<CalendarUnit | undefined>) => CalendarCellTriggerSurface
  context: CalendarRootContext
}

/** Standalone `useCalendar()` calls without a `headingId` draw `reka-calendar-heading-<n>` from here (not SSR-stable — the SFC passes `useId()`). */
let calendarCount = 0

/**
 * The slice of a root context the chrome parts (heading, view trigger, prev /
 * next, grid) read. `RangeCalendarRootContext` satisfies it too, so those
 * builders are shared by both families.
 */
export type CalendarChromeContext = Pick<CalendarRootContext, 'disabled' | 'readonly' | 'view' | 'maxView' | 'headingId' | 'drillUp' | 'nextPage' | 'prevPage' | 'isNextButtonDisabled' | 'isPrevButtonDisabled'>

/** Disabled for the purpose of the root `data-invalid` / focus fallbacks: evaluated at the granularity, not the active view. */
function isDisabledAtUnit(context: Pick<CalendarRootContext, 'disabledMatcher' | 'disabled' | 'minValue' | 'maxValue'>, adapter: CalendarUnitAdapter, date: DateValue) {
  if (context.disabledMatcher.value?.(date, adapter.unit) || context.disabled.value)
    return true
  if (context.maxValue.value && isAfter(adapter.startOf(date), context.maxValue.value))
    return true
  if (context.minValue.value && isBefore(adapter.endOf(date), context.minValue.value))
    return true
  return false
}

/** The `CalendarHeading` surface: static text, `data-disabled`, `data-view`. */
export function getCalendarHeadingSurface(context: CalendarChromeContext): PartSurface<CalendarHeadingState> {
  return createPartSurface<CalendarHeadingState>(
    () => ({}),
    () => ({ disabled: context.disabled.value, view: context.view.value }),
  )
}

/**
 * The `CalendarViewTrigger` surface: a button that drills up to the next coarser
 * view. It sets no `aria-label`: the visible heading (`September 2026`) is its
 * accessible name, so the name matches what is on screen (WCAG 2.5.3).
 */
export function getCalendarViewTriggerSurface(context: CalendarChromeContext): PartSurface<CalendarViewTriggerState> {
  const nextView = computed(() => {
    const next = coarserUnit(context.view.value)
    return next && !isCoarserUnit(next, context.maxView.value) ? next : undefined
  })
  const disabled = computed(() => context.disabled.value || !nextView.value)
  return createPartSurface<CalendarViewTriggerState>(
    () => ({
      'aria-disabled': disabled.value || undefined,
      'disabled': disabled.value,
      'onClick': (event: MouseEvent) => {
        if (disabled.value)
          return
        context.drillUp('view-trigger', event)
      },
    }),
    () => ({ disabled: disabled.value, view: context.view.value }),
  )
}

/** The `CalendarPrev` / `CalendarNext` surface. `fn` is a paging function or a ref to one (not a getter). */
export function getCalendarNavSurface(
  context: CalendarChromeContext,
  direction: 'prev' | 'next',
  fn?: MaybeRef<CalendarPageFunction | undefined>,
): PartSurface<CalendarNavState> {
  const disabled = computed(() => context.disabled.value || (direction === 'next'
    ? context.isNextButtonDisabled(unref(fn))
    : context.isPrevButtonDisabled(unref(fn))))
  return createPartSurface<CalendarNavState>(
    () => ({
      'aria-label': direction === 'next' ? 'Next page' : 'Previous page',
      'aria-disabled': disabled.value || undefined,
      'disabled': disabled.value,
      'onClick': () => {
        if (disabled.value)
          return
        if (direction === 'next')
          context.nextPage(unref(fn))
        else
          context.prevPage(unref(fn))
      },
    }),
    () => ({ disabled: disabled.value }),
  )
}

/** The `CalendarGrid` surface: `role="application"` (#2502), labelled by the root heading. */
export function getCalendarGridSurface(context: CalendarChromeContext): PartSurface<CalendarGridState> {
  return createPartSurface<CalendarGridState>(
    () => ({
      'tabindex': -1,
      'role': 'application',
      'aria-labelledby': context.headingId,
      'aria-readonly': context.readonly.value || undefined,
      'aria-disabled': context.disabled.value || undefined,
    }),
    () => ({ disabled: context.disabled.value, readonly: context.readonly.value, view: context.view.value }),
  )
}

/**
 * The per-cell flags the root derives (selected, focus target, today) for a
 * cell at `unit`. Read from the root's keyed index when it can answer, so a
 * selection or focus change only re-runs the cells it changes; evaluated
 * directly otherwise (a custom context, or a cell of another unit / calendar).
 */
function calendarCellFlags(context: CalendarRootContext, date: DateValue, unit: CalendarUnit, adapter: CalendarUnitAdapter): number {
  const indexed = readCalendarCellFlags(getCalendarCellIndex(context), date, unit)
  if (indexed !== undefined)
    return indexed
  let flags = 0
  if (context.isDateSelected(date))
    flags |= CELL_SELECTED
  if (adapter.isCurrent(date))
    flags |= CELL_TODAY
  const target = calendarFocusTarget(context)
  if (target && adapter.isSame(date, target))
    flags |= CELL_FOCUS_TARGET
  return flags
}

/**
 * The date whose cell takes `tabindex="0"` (before the cell's own disabled /
 * outside-view checks): the placeholder when it can take focus, else, with no
 * usable selection, the first focusable cell.
 */
function calendarFocusTarget(context: CalendarRootContext): DateValue | undefined {
  if (context.isPlaceholderFocusable.value)
    return context.disabled.value ? undefined : context.placeholder.value
  if (!context.hasSelectedDate.value || context.isSelectedDateDisabled.value)
    return context.firstFocusableDate.value
  return undefined
}

/** The `CalendarCell` (`role="gridcell"`) surface. */
export function getCalendarCellSurface(
  context: CalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
): PartSurface<CalendarCellState> {
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
    const selected = unit === context.granularity.value && !!(calendarCellFlags(context, date, unit, adapter) & CELL_SELECTED)
    const state: CalendarCellState = { disabled, view: unit }
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
 * The `CalendarCellTrigger` surface — the one keyboard/selection implementation
 * for every view (D8). Derived purely from `(context, value, page, unit)`, so
 * the SFC and a standalone `useCalendar()` consumer share it.
 *
 * One computed per cell holds everything the cell renders. The selection, the
 * focus target and today come from the root's keyed index, so a press or an
 * arrow key re-evaluates only the cells whose state changes. The keyboard loop
 * is the root's (one per calendar) and the handlers are created once per cell.
 */
export function getCalendarCellTriggerSurface(
  context: CalendarRootContext,
  value: MaybeRefOrGetter<DateValue>,
  page?: MaybeRefOrGetter<DateValue | undefined>,
  unit?: MaybeRefOrGetter<CalendarUnit | undefined>,
): CalendarCellTriggerSurface {
  const cell = computed(() => {
    const cellUnit = toValue(unit) ?? context.view.value
    const adapter = getUnitAdapter(cellUnit)
    const date = toValue(value)
    const p = toValue(page)
    const outsideView = p ? !adapter.isInPage(date, p) : false
    const unavailable = context.isDateUnavailable(date)
    const disabled = context.isDateDisabled(date) || (context.disableDaysOutsideCurrentView.value && outsideView)
    const flags = calendarCellFlags(context, date, cellUnit, adapter)
    const focused = !outsideView && !disabled && !!(flags & CELL_FOCUS_TARGET)
    // Read the locale so a locale change re-renders the cell text.
    const locale = context.locale.value
    const state: CalendarCellTriggerState = {
      // Cells of a view coarser than the granularity are navigation only.
      selected: cellUnit === context.granularity.value && !!(flags & CELL_SELECTED),
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

  const navigation = getCellFocusNavigation(context)
  const onClick = (event: MouseEvent) => {
    if (cell.value.state.disabled)
      return
    context.onDateChange(toValue(value), 'cell-press', event)
  }
  const onKeydown = (event: KeyboardEvent) => {
    const date = toValue(value)
    navigation.handleKeydown(event, cell.value.adapter, date, {
      disabled: cell.value.state.disabled,
      onSelect: e => context.onDateChange(date, 'cell-keydown', e),
    })
  }

  function props(c: typeof cell.value) {
    return {
      'role': 'button',
      'aria-label': c.label,
      'aria-disabled': c.state.disabled || c.state.unavailable ? true as const : undefined,
      // Selectors (not semantic state): `data-value` drives keyboard focus queries,
      // the `data-reka-*` marker is what `handleCalendarInitialFocus` looks for.
      'data-value': c.iso,
      'data-reka-calendar-cell-trigger': '',
      'tabindex': c.tabindex,
      onClick,
      onKeydown,
    }
  }

  return {
    props: getterRef(() => props(cell.value)),
    state: getterRef(() => cell.value.state),
    // `stateToDataAttrs(state)` then the props, written out: same attributes in the same order.
    attrs: getterRef(() => {
      const c = cell.value
      const s = c.state
      const attrs: Record<string, unknown> = {}
      if (s.selected)
        attrs['data-selected'] = ''
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
    cellValue: getterRef(() => cell.value.text),
  }
}

/**
 * Headless Calendar logic: the model, placeholder and view state, selection
 * (commit at the granularity, drill above it), and the per-part surfaces.
 * `CalendarRoot.vue` composes this; standalone consumers can drive a calendar
 * from JS and bind the surfaces themselves.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers (model → placeholder sync, grid rebuilds).
 */
export function useCalendar(props: UseCalendarProps): UseCalendarReturn {
  assertTemporal()
  const locale = computed(() => toValue(props.locale))
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const initialFocus = computed(() => toValue(props.initialFocus) ?? false)
  const multiple = computed(() => toValue(props.multiple) ?? false)
  const preventDeselect = computed(() => toValue(props.preventDeselect) ?? false)
  const disableDaysOutsideCurrentView = computed(() => toValue(props.disableDaysOutsideCurrentView) ?? false)
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
  const nextPageFn = computed(() => unref(props.nextPage))
  const prevPageFn = computed(() => unref(props.prevPage))
  const headingId = props.headingId ?? `reka-calendar-heading-${++calendarCount}`
  const parentElement = props.parentElement ?? ref<HTMLElement>()

  // `null` is a controlled empty calendar (as with v2's `useVModel`): it reads
  // as `undefined`, but a press is only emitted, never written.
  const { state: rawModelValue, setState: setModelValue, lastChangeDetails, isControlled } = useControllableState<CalendarModelValue | null, CalendarChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: CalendarModelValue | null, details: ChangeEventDetails<CalendarChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: CalendarModelValue | null, details: ChangeEventDetails<CalendarChangeReason>) => void) | undefined,
  })
  const modelValue = computed<CalendarModelValue>(() => rawModelValue.value ?? undefined)

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, CalendarChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? getDefaultDate({
      defaultPlaceholder: toValue(props.placeholder),
      defaultValue: modelValue.value,
      locale: locale.value,
    }),
    name: 'placeholder',
    emit: props.emit,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: (a, b) => compareDateValues(a, b) === 0,
  })

  const { state: rawView, setState: setViewState } = useControllableState<CalendarUnit, CalendarChangeReason>({
    prop: () => toValue(props.view),
    defaultValue: () => props.defaultView ?? granularity.value,
    name: 'view',
    emit: props.emit,
    onUpdate: props.onUpdateView,
  })
  const view = computed(() => clampCalendarView(rawView.value, granularity.value, maxView.value))

  function setPlaceholder(value: DateValue, reason: CalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value, reason, event)
  }

  function setView(next: CalendarUnit, reason: CalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setViewState(clampCalendarView(next, granularity.value, maxView.value), reason, event)
  }

  function drillUp(reason: CalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
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

  // ---- selection state, evaluated at the granularity ----

  const isDateSelected: Matcher = (date) => {
    const a = granularityAdapter.value
    const current = modelValue.value
    if (Array.isArray(current))
      return current.some(d => a.isSame(d, date))
    if (!current)
      return false
    return a.isSame(current, date)
  }

  // What `isDisabledAtUnit` reads; the full context is assembled further down.
  const limits = { disabledMatcher, disabled, minValue, maxValue }

  const hasSelectedDate = computed(() => Array.isArray(modelValue.value) ? modelValue.value.length > 0 : !!modelValue.value)

  const isSelectedDateDisabled = computed(() => {
    const current = modelValue.value
    if (Array.isArray(current))
      return current.length > 0 && current.some(d => isDisabledAtUnit(limits, granularityAdapter.value, d))
    if (!current)
      return false
    return isDisabledAtUnit(limits, granularityAdapter.value, current)
  })

  const isInvalid = computed(() => {
    const current = modelValue.value
    const unavailable = unavailableMatcher.value
    const check = (d: DateValue) => isDisabledAtUnit(limits, granularityAdapter.value, d) || !!unavailable?.(d, granularity.value)
    if (Array.isArray(current))
      return current.length > 0 && current.some(check)
    if (!current)
      return false
    return check(current)
  })

  // An external model change moves the page to the (last) selected value. A new
  // object for the same day / month / year is not a new selection, so it must
  // not undo paging (#2961).
  watch(modelValue, (current, previous) => {
    const a = granularityAdapter.value
    if (isSameDateSelection(previous, current, a.isSame))
      return
    const focused = focusedDateValue(current)
    if (focused && !a.isSame(placeholder.value, focused))
      setPlaceholder(focused)
  })

  function select(value: DateValue, reason: CalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (readonly.value)
      return
    if (gridApi.isDateDisabled(value) || gridApi.isDateUnavailable(value))
      return

    // Above the granularity a cell is navigation, not selection (D2).
    if (isCoarserUnit(view.value, granularity.value)) {
      const finer = finerUnit(view.value)!
      // A cancelled `beforeUpdate:placeholder` keeps the current page, so don't
      // drill into it. `false` for an unchanged placeholder is a no-op, not a cancel.
      const target = gridApi.adapter.value.resolve(value, placeholder.value)
      if (!setPlaceholder(target, 'view-drill', event) && compareDateValues(target, placeholder.value) !== 0)
        return
      setView(finer, 'view-drill', event)
      return
    }

    const a = granularityAdapter.value
    const current = modelValue.value

    if (!multiple.value) {
      if (!current || Array.isArray(current)) {
        setModelValue(a.resolve(value, placeholder.value), reason, event)
        return
      }
      if (!preventDeselect.value && a.isSame(current, value)) {
        setPlaceholder(a.resolve(value, current), reason, event)
        setModelValue(undefined, reason, event)
      }
      else {
        setModelValue(a.resolve(value, current), reason, event)
      }
      return
    }

    if (!current) {
      setModelValue([a.resolve(value, placeholder.value)], reason, event)
      return
    }
    const list = Array.isArray(current) ? current : [current]
    const index = list.findIndex(d => a.isSame(d, value))
    if (index === -1) {
      setModelValue([...list, a.resolve(value, placeholder.value)], reason, event)
    }
    else if (!preventDeselect.value) {
      const next = list.filter(d => !a.isSame(d, value))
      if (!next.length) {
        setPlaceholder(a.resolve(value, list[index]), reason, event)
        setModelValue(undefined, reason, event)
        return
      }
      setModelValue([...next], reason, event)
    }
  }

  const context: CalendarRootContext = {
    locale,
    dir,
    disabled,
    readonly,
    initialFocus,
    multiple,
    preventDeselect,
    disableDaysOutsideCurrentView,
    minValue,
    maxValue,
    disabledMatcher,
    modelValue,
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
    isSelectedDateDisabled,
    isPlaceholderFocusable: gridApi.isPlaceholderFocusable,
    firstFocusableDate: gridApi.firstFocusableDate,
    rowLength: gridApi.rowLength,
    formatter: gridApi.formatter,
    adapter: gridApi.adapter,
    isDateDisabled: gridApi.isDateDisabled,
    isDateUnavailable: gridApi.isDateUnavailable,
    isDateSelected,
    isOutsideVisibleView: gridApi.isOutsideVisibleView,
    prevPage: gridApi.prevPage,
    nextPage: gridApi.nextPage,
    isPrevButtonDisabled: gridApi.isPrevButtonDisabled,
    isNextButtonDisabled: gridApi.isNextButtonDisabled,
    onDateChange: select,
    onPlaceholderChange: setPlaceholder,
    setView,
    drillUp,
  }

  // The per-cell flags, derived once per change for the whole grid and read
  // by key, so a selection or focus move re-renders only the cells it touches.
  setCalendarCellIndex(context, createCalendarCellIndex({
    view,
    placeholder,
    collect: (builder) => {
      // Only cells at the granularity carry selection; a coarser view is navigation.
      if (builder.unit === granularity.value) {
        const current = modelValue.value
        if (Array.isArray(current)) {
          for (const date of current)
            builder.addDate(date, CELL_SELECTED)
        }
        else {
          builder.addDate(current, CELL_SELECTED)
        }
      }
      builder.addDate(calendarFocusTarget(context), CELL_FOCUS_TARGET)
    },
  }))

  const root = createPartSurface<CalendarRootState>(
    () => ({
      'aria-label': gridApi.fullCalendarLabel.value,
      'dir': dir.value,
    }),
    () => ({ disabled: disabled.value, readonly: readonly.value, invalid: isInvalid.value, view: view.value }),
  )

  return {
    modelValue,
    placeholder,
    view,
    granularity,
    maxView,
    grid: gridApi.grid,
    weekDays: gridApi.weekdays,
    headingValue: gridApi.headingValue,
    fullCalendarLabel: gridApi.fullCalendarLabel,
    isInvalid,
    select,
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
    getCellSurface: (value, page) => getCalendarCellSurface(context, value, page),
    getCellTriggerSurface: (value, page, unit) => getCalendarCellTriggerSurface(context, value, page, unit),
    context,
  }
}
