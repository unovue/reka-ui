import type { DateValue } from '@internationalized/date'
import type { ComputedRef, Ref } from 'vue'
import type { CalendarLayout, CalendarPageFunction, CalendarUnitAdapter, WeekStartsOn } from '@/date'
import type { Direction } from '@/shared/types'
import { nextTick } from 'vue'
import { focusPagination, focusWeekBoundary } from '@/shared/useCalendarKeyboardNavigation'
import { useKbd } from '@/shared/useKbd'

/** What the keyboard loop needs from a calendar root context (Calendar and RangeCalendar both satisfy it). */
export interface CellNavigationHost {
  parentElement: Ref<HTMLElement | undefined>
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
 * `maxValue`. The month and year views have no week, so Home / End bubble
 * there, and PageUp / PageDown move to the same cell one page away.
 *
 * @lifecycle pure — DOM access happens only inside the handlers.
 */
export function createCellFocusNavigation(
  host: CellNavigationHost,
  adapter: ComputedRef<CalendarUnitAdapter>,
  date: ComputedRef<DateValue>,
) {
  const kbd = useKbd()

  function isWithinBounds(candidate: DateValue) {
    if (host.minValue.value && adapter.value.endOf(candidate).compare(host.minValue.value) < 0)
      return false
    if (host.maxValue.value && adapter.value.startOf(candidate).compare(host.maxValue.value) > 0)
      return false
    return true
  }

  function queryCell(candidate: DateValue) {
    return host.parentElement.value?.querySelector<HTMLElement>(`[data-value='${candidate.toString()}']:not([data-outside-view])`) ?? null
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

  function focusCell(candidate: DateValue, el: HTMLElement, event?: Event) {
    host.onPlaceholderChange(candidate, 'focus-navigation', event)
    el.focus()
  }

  /** Move focus by `add` units from `from`. */
  function shiftFocus(from: DateValue, add: number, event?: Event, depth = 0) {
    if (depth > 48)
      return
    const candidate = adapter.value.add(from, add)
    if (!isWithinBounds(candidate))
      return

    const el = queryCell(candidate)
    if (!el) {
      // Not rendered: the target is on another page.
      if (!flipPage(add > 0 ? 1 : -1))
        return
      nextTick(() => shiftFocus(from, add, event, depth + 1))
      return
    }
    if (el.hasAttribute('data-disabled')) {
      shiftFocus(candidate, add, event, depth + 1)
      return
    }
    focusCell(candidate, el, event)
  }

  /** PageUp / PageDown: the same cell one page away. */
  function shiftFocusPage(direction: 1 | -1, event?: Event) {
    const duration = adapter.value.pageDuration(host.layout.value)
    const candidate = direction > 0 ? date.value.add(duration) : date.value.subtract(duration)
    if (!isWithinBounds(candidate))
      return
    if (!flipPage(direction))
      return
    nextTick(() => {
      const el = queryCell(candidate)
      if (el && !el.hasAttribute('data-disabled'))
        focusCell(candidate, el, event)
    })
  }

  /** Day view: Home / End / PageUp / PageDown, shared with v2 (`useCalendarKeyboardNavigation`). */
  function handleDayShortcut(event: KeyboardEvent) {
    const parentElement = host.parentElement.value
    if (!parentElement)
      return
    const shared = {
      parentElement,
      baseDate: date.value,
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

  function handleKeydown(event: KeyboardEvent, options: CellKeydownOptions) {
    if (!CELL_TRIGGER_KEYS.has(event.code))
      return
    if (options.disabled)
      return
    const isDayView = adapter.value.unit === 'day'
    const isWeekKey = event.code === kbd.HOME || event.code === kbd.END
    // Only the day view has a week to jump within.
    if (isWeekKey && !isDayView)
      return
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
        shiftFocus(date.value, sign, event)
        break
      case kbd.ARROW_LEFT:
        shiftFocus(date.value, -sign, event)
        break
      case kbd.ARROW_UP:
        shiftFocus(date.value, -stride, event)
        break
      case kbd.ARROW_DOWN:
        shiftFocus(date.value, stride, event)
        break
      case kbd.HOME:
      case kbd.END:
        handleDayShortcut(event)
        break
      case kbd.PAGE_UP:
        if (isDayView)
          handleDayShortcut(event)
        else
          shiftFocusPage(-1, event)
        break
      case kbd.PAGE_DOWN:
        if (isDayView)
          handleDayShortcut(event)
        else
          shiftFocusPage(1, event)
        break
      case kbd.ENTER:
      case kbd.SPACE_CODE:
        options.onSelect(event)
    }
  }

  return { handleKeydown, shiftFocus, shiftFocusPage }
}
