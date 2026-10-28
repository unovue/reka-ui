import type { ComputedRef, Ref } from 'vue'
import type { CalendarLayout, CalendarPageFunction, CalendarUnitAdapter, WeekStartsOn } from '@/date'
import type { DateValue } from '@/date/types'
import type { Direction } from '@/shared/types'
import { nextTick } from 'vue'
import { compareDateValues, toIsoString } from '@/date/temporal'
import { focusPagination, focusWeekBoundary } from '@/shared/useCalendarKeyboardNavigation'
import { useKbd } from '@/shared/useKbd'

const kbd = useKbd()

/** What the keyboard loop needs from a calendar root context (Calendar and RangeCalendar both satisfy it). */
export interface CellNavigationHost {
  parentElement: Ref<HTMLElement | undefined>
  /** Read so a move in a coarser view keeps the placeholder's finer fields. */
  placeholder: ComputedRef<DateValue>
  minValue: ComputedRef<DateValue | undefined>
  maxValue: ComputedRef<DateValue | undefined>
  dir: ComputedRef<Direction>
  locale: ComputedRef<string>
  weekStartsOn: ComputedRef<WeekStartsOn>
  isOutsideVisibleView: (date: DateValue) => boolean
  /** Up/down stride of the active view. */
  rowLength: ComputedRef<number>
  layout: ComputedRef<CalendarLayout>
  nextPage: (fn?: CalendarPageFunction) => void
  prevPage: (fn?: CalendarPageFunction) => void
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  onPlaceholderChange: (date: DateValue, reason?: 'focus-navigation', event?: Event) => unknown
}

export interface CellKeydownOptions {
  /** A disabled cell ignores every key (and lets them bubble). */
  disabled: boolean
  /** Enter / Space. */
  onSelect: (event: KeyboardEvent) => void
}

/** Keys the cell handles; everything else bubbles untouched. */
const CELL_TRIGGER_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'PageUp', 'PageDown', 'Home', 'End'])

/**
 * The one keyboard/focus implementation for calendar cells in every view (D8):
 * arrows move one unit or one row, pages flip when the target is not rendered,
 * disabled cells are skipped, and the recursion is depth-guarded (#2781).
 *
 * The day view keeps the v2 shortcuts (#2530): Home / End move to the start /
 * end of the week, PageUp / PageDown to the same day one month away and
 * Shift+PageUp / Shift+PageDown one year away, clamped to `minValue` /
 * `maxValue`. The month and year views have no week: there Home / End move to
 * the first / last cell of the page, and PageUp / PageDown to the same cell one
 * page away.
 *
 * @lifecycle pure — DOM access happens only inside the handlers.
 */
export function createCellFocusNavigation(host: CellNavigationHost) {
  function isWithinBounds(adapter: CalendarUnitAdapter, candidate: DateValue) {
    if (host.minValue.value && compareDateValues(adapter.endOf(candidate), host.minValue.value) < 0)
      return false
    if (host.maxValue.value && compareDateValues(adapter.startOf(candidate), host.maxValue.value) > 0)
      return false
    return true
  }

  function queryCell(candidate: DateValue) {
    return host.parentElement.value?.querySelector<HTMLElement>(`[data-value='${toIsoString(candidate)}']:not([data-outside-view])`) ?? null
  }

  /** Flip one page in `direction`; `false` when that button is disabled. */
  function flipPage(direction: 1 | -1) {
    if (direction > 0) {
      if (host.isNextButtonDisabled())
        return false
      host.nextPage()
    }
    else {
      if (host.isPrevButtonDisabled())
        return false
      host.prevPage()
    }
    return true
  }

  function focusCell(adapter: CalendarUnitAdapter, candidate: DateValue, el: HTMLElement, event?: Event) {
    // Month and year cells are the first day of their period: keep the day (and
    // month) of the placeholder so a later drill-down lands on it, as a click does.
    host.onPlaceholderChange(adapter.resolve(candidate, host.placeholder.value), 'focus-navigation', event)
    el.focus()
  }

  /** Move focus by `add` units from `from`. */
  function shiftFocus(adapter: CalendarUnitAdapter, from: DateValue, add: number, event?: Event, depth = 0) {
    if (depth > 48)
      return
    const candidate = adapter.add(from, add)
    if (!isWithinBounds(adapter, candidate))
      return

    const el = queryCell(candidate)
    if (!el) {
      // Not rendered: the target is on another page.
      if (!flipPage(add > 0 ? 1 : -1))
        return
      nextTick(() => shiftFocus(adapter, from, add, event, depth + 1))
      return
    }
    if (el.hasAttribute('data-disabled')) {
      shiftFocus(adapter, candidate, add, event, depth + 1)
      return
    }
    focusCell(adapter, candidate, el, event)
  }

  /** PageUp / PageDown: the same cell one page away. */
  function shiftFocusPage(adapter: CalendarUnitAdapter, date: DateValue, direction: 1 | -1, event?: Event) {
    const duration = adapter.pageDuration(host.layout.value)
    const candidate = direction > 0 ? date.add(duration) : date.subtract(duration)
    if (!isWithinBounds(adapter, candidate))
      return
    if (!flipPage(direction))
      return
    nextTick(() => {
      const el = queryCell(candidate)
      if (el && !el.hasAttribute('data-disabled')) {
        focusCell(adapter, candidate, el, event)
        return
      }
      // The flip unmounted the focused cell and the target cannot take focus
      // (disabled, or not rendered): stay inside the calendar on the new page's
      // tabbable cell (else its first enabled cell) rather than falling back to <body>.
      const root = host.parentElement.value
      const fallback = root?.querySelector<HTMLElement>('[data-reka-calendar-cell-trigger][tabindex="0"]')
        ?? root?.querySelector<HTMLElement>('[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-outside-view])')
      fallback?.focus()
    })
  }

  /**
   * Month and year views: Home / End move to the first / last cell of the
   * current page. Like the arrow keys, a target that is disabled or outside
   * `minValue` / `maxValue` is skipped, here inward toward the focused cell, so
   * focus never leaves the page; when nothing between the edge and the focused
   * cell can take focus, it stays put.
   */
  function focusPageBoundary(adapter: CalendarUnitAdapter, date: DateValue, boundary: 'start' | 'end', event?: Event) {
    const cells = Array.from(host.parentElement.value?.querySelectorAll<HTMLElement>('[data-reka-calendar-cell-trigger]:not([data-outside-view])') ?? [])
    const iso = toIsoString(date)
    const current = cells.findIndex(el => el.getAttribute('data-value') === iso)
    if (current < 0)
      return
    // Cells on a month / year page are consecutive units, so a cell's offset in
    // the page is its distance in units from the focused cell.
    const step = boundary === 'start' ? 1 : -1
    for (let index = boundary === 'start' ? 0 : cells.length - 1; index !== current; index += step) {
      const el = cells[index]
      const candidate = adapter.add(date, index - current)
      if (el.hasAttribute('data-disabled') || !isWithinBounds(adapter, candidate))
        continue
      focusCell(adapter, candidate, el, event)
      return
    }
  }

  /** Day view: Home / End / PageUp / PageDown, shared with v2 (`useCalendarKeyboardNavigation`). */
  function handleDayShortcut(date: DateValue, event: KeyboardEvent) {
    const parentElement = host.parentElement.value
    if (!parentElement)
      return
    const shared = {
      parentElement,
      baseDate: date,
      minValue: host.minValue.value,
      maxValue: host.maxValue.value,
      onPlaceholderChange: (value: DateValue) => { host.onPlaceholderChange(value, 'focus-navigation', event) },
    }
    if (event.code === kbd.HOME || event.code === kbd.END) {
      focusWeekBoundary({
        ...shared,
        boundary: event.code === kbd.HOME ? 'start' : 'end',
        locale: host.locale.value,
        weekStartsOn: host.weekStartsOn.value,
      })
      return
    }
    focusPagination({
      ...shared,
      isNext: event.code === kbd.PAGE_DOWN,
      isYear: event.shiftKey,
      isOutsideVisibleView: host.isOutsideVisibleView,
      isNextButtonDisabled: host.isNextButtonDisabled,
      isPrevButtonDisabled: host.isPrevButtonDisabled,
      nextPage: host.nextPage,
      prevPage: host.prevPage,
    })
  }

  /** The keydown of the cell for `date`, rendered at `adapter`'s unit. */
  function handleKeydown(event: KeyboardEvent, adapter: CalendarUnitAdapter, date: DateValue, options: CellKeydownOptions) {
    if (!CELL_TRIGGER_KEYS.has(event.code))
      return
    if (options.disabled)
      return
    const isDayView = adapter.unit === 'day'
    // Modifier combos on Enter/Space (e.g. Ctrl+Enter) are not handled by the cell —
    // let them bubble so parent listeners can react (e.g. submit a form).
    if ((event.code === kbd.ENTER || event.code === kbd.SPACE_CODE) && (event.ctrlKey || event.metaKey || event.altKey))
      return
    event.preventDefault()
    event.stopPropagation()

    const sign = host.dir.value === 'rtl' ? -1 : 1
    const stride = host.rowLength.value
    switch (event.code) {
      case kbd.ARROW_RIGHT:
        shiftFocus(adapter, date, sign, event)
        break
      case kbd.ARROW_LEFT:
        shiftFocus(adapter, date, -sign, event)
        break
      case kbd.ARROW_UP:
        shiftFocus(adapter, date, -stride, event)
        break
      case kbd.ARROW_DOWN:
        shiftFocus(adapter, date, stride, event)
        break
      case kbd.HOME:
      case kbd.END:
        if (isDayView)
          handleDayShortcut(date, event)
        else
          focusPageBoundary(adapter, date, event.code === kbd.HOME ? 'start' : 'end', event)
        break
      case kbd.PAGE_UP:
        if (isDayView)
          handleDayShortcut(date, event)
        else
          shiftFocusPage(adapter, date, -1, event)
        break
      case kbd.PAGE_DOWN:
        if (isDayView)
          handleDayShortcut(date, event)
        else
          shiftFocusPage(adapter, date, 1, event)
        break
      case kbd.ENTER:
      case kbd.SPACE_CODE:
        options.onSelect(event)
    }
  }

  return { handleKeydown, shiftFocus, shiftFocusPage }
}

const navigations = new WeakMap<CellNavigationHost, ReturnType<typeof createCellFocusNavigation>>()

/** The keyboard loop of a calendar root, created once and shared by all its cells. @internal */
export function getCellFocusNavigation(host: CellNavigationHost): ReturnType<typeof createCellFocusNavigation> {
  let navigation = navigations.get(host)
  if (!navigation) {
    navigation = createCellFocusNavigation(host)
    navigations.set(host, navigation)
  }
  return navigation
}
