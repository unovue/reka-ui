import type { DateValue } from '@internationalized/date'
import type { ComputedRef, Ref } from 'vue'
import type { CalendarLayout, CalendarPageFunction, CalendarUnitAdapter } from '@/date'
import type { Direction } from '@/shared/types'
import { nextTick } from 'vue'
import { useKbd } from '@/shared/useKbd'

/** What the keyboard loop needs from a calendar root context (Calendar and RangeCalendar both satisfy it). */
export interface CellNavigationHost {
  parentElement: Ref<HTMLElement | undefined>
  minValue: ComputedRef<DateValue | undefined>
  maxValue: ComputedRef<DateValue | undefined>
  dir: ComputedRef<Direction>
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
const CELL_TRIGGER_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'PageUp', 'PageDown'])

/**
 * The one keyboard/focus implementation for calendar cells in every view (D8):
 * arrows move one unit or one row, PageUp / PageDown move one page, pages
 * flip when the target is not rendered, disabled cells are skipped, and the
 * recursion is depth-guarded (#2781).
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

  function handleKeydown(event: KeyboardEvent, options: CellKeydownOptions) {
    if (!CELL_TRIGGER_KEYS.has(event.code))
      return
    if (options.disabled)
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
      case kbd.PAGE_UP:
        shiftFocusPage(-1, event)
        break
      case kbd.PAGE_DOWN:
        shiftFocusPage(1, event)
        break
      case kbd.ENTER:
      case kbd.SPACE_CODE:
        options.onSelect(event)
    }
  }

  return { handleKeydown, shiftFocus, shiftFocusPage }
}
