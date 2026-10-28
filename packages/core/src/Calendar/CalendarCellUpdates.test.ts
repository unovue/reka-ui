import type { DateValue } from '@/date'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useTestKbd } from '@/shared'
import CalendarRenderCount from './story/_CalendarRenderCount.vue'

// Cells read their state from a per-root index keyed by date: selecting a date,
// moving focus or hovering a range re-renders only the cells whose state
// changed, not every cell of the grid.

const kbd = useTestKbd()
const jan20 = new Temporal.PlainDate(1980, 1, 20)

const calendarParts = { range: false }
const rangeParts = { range: true }

/** Renders a calendar whose cell triggers count their renders, by cell value. */
function setup(parts: { range: boolean }, rootProps: Record<string, unknown>) {
  const renders = new Map<string, number>()
  const props = {
    range: parts.range,
    rootProps,
    showSlot: true,
    onCellRender: (key: string) => renders.set(key, (renders.get(key) ?? 0) + 1),
  }
  const user = userEvent.setup()
  const returned = render(CalendarRenderCount, { props })
  const calendar = returned.getByTestId('calendar')
  const trigger = (iso: string) => calendar.querySelector<HTMLElement>(`[data-reka-calendar-cell-trigger][data-value="${iso}"]`)!
  /** The cells rendered again while `action` ran. */
  async function rerendered(action: () => unknown) {
    renders.clear()
    await action()
    await nextTick()
    return [...renders.keys()].sort()
  }
  /** Re-renders the fixture with some props changed. */
  const update = (changes: Partial<typeof props>) => returned.rerender(Object.assign(props, changes))
  return { ...returned, user, calendar, trigger, rerendered, update }
}

describe('calendar cells re-render only when their state changes', () => {
  it('selecting a day re-renders the previous and the new selection only', async () => {
    const { user, trigger, rerendered } = setup(calendarParts, { defaultValue: jan20 })
    expect(await rerendered(() => user.click(trigger('1980-01-10')))).toEqual(['1980-01-10', '1980-01-20'])
    expect(trigger('1980-01-10')).toHaveAttribute('data-selected')
    expect(trigger('1980-01-10')).toHaveAttribute('tabindex', '0')
    expect(trigger('1980-01-20')).not.toHaveAttribute('data-selected')
    expect(trigger('1980-01-20')).toHaveAttribute('tabindex', '-1')
  })

  it('moving focus with the keyboard re-renders the two cells involved only', async () => {
    const { user, trigger, rerendered } = setup(calendarParts, { defaultPlaceholder: jan20 })
    trigger('1980-01-20').focus()
    expect(await rerendered(() => user.keyboard(kbd.ARROW_RIGHT))).toEqual(['1980-01-20', '1980-01-21'])
    expect(document.activeElement).toBe(trigger('1980-01-21'))
    expect(trigger('1980-01-21')).toHaveAttribute('tabindex', '0')
    expect(trigger('1980-01-20')).toHaveAttribute('tabindex', '-1')
  })

  it('selecting several days re-renders the toggled day and the moved focus target only', async () => {
    const { user, trigger, rerendered } = setup(calendarParts, { multiple: true, defaultValue: [jan20] })
    expect(await rerendered(() => user.click(trigger('1980-01-05')))).toEqual(['1980-01-05', '1980-01-20'])
    expect(trigger('1980-01-05')).toHaveAttribute('tabindex', '0')
    expect(trigger('1980-01-05')).toHaveAttribute('data-selected')
    expect(trigger('1980-01-20')).toHaveAttribute('data-selected')
  })

  it('selecting a month in the month view re-renders the two month cells only', async () => {
    const { user, calendar, trigger, rerendered } = setup(calendarParts, { granularity: 'month', defaultValue: jan20 })
    expect(calendar.querySelectorAll('[data-reka-calendar-cell-trigger]')).toHaveLength(12)
    expect(trigger('1980-01-01')).toHaveAttribute('data-selected')
    expect(await rerendered(() => user.click(trigger('1980-03-01')))).toEqual(['1980-01-01', '1980-03-01'])
    expect(trigger('1980-03-01')).toHaveAttribute('data-selected')
    expect(trigger('1980-01-01')).not.toHaveAttribute('data-selected')
  })

  it('selecting a year in the year view re-renders the two year cells only', async () => {
    const { user, trigger, rerendered } = setup(calendarParts, { granularity: 'year', defaultValue: jan20 })
    expect(trigger('1980-01-01')).toHaveAttribute('data-selected')
    expect(await rerendered(() => user.click(trigger('1982-01-01')))).toEqual(['1980-01-01', '1982-01-01'])
    expect(trigger('1982-01-01')).toHaveAttribute('data-selected')
  })

  it('follows a controlled model change, re-rendering the two days only', async () => {
    const { trigger, rerendered, update } = setup(calendarParts, { modelValue: jan20 })
    expect(trigger('1980-01-20')).toHaveAttribute('data-selected')
    expect(await rerendered(() => update({ rootProps: { modelValue: jan20.add({ days: 3 }) } }))).toEqual(['1980-01-20', '1980-01-23'])
    expect(trigger('1980-01-23')).toHaveAttribute('data-selected')
    expect(trigger('1980-01-20')).not.toHaveAttribute('data-selected')
  })
})

describe('range calendar cells re-render only when their state changes', () => {
  it('pressing a start re-renders the old range and the new start only', async () => {
    const { user, trigger, rerendered } = setup(rangeParts, { defaultValue: { start: jan20, end: jan20.add({ days: 2 }) } })
    expect(trigger('1980-01-21')).toHaveAttribute('data-selected')
    const changed = await rerendered(() => user.click(trigger('1980-01-08')))
    expect(changed).toEqual(['1980-01-08', '1980-01-20', '1980-01-21', '1980-01-22'])
    expect(trigger('1980-01-08')).toHaveAttribute('data-selection-start')
    expect(trigger('1980-01-21')).not.toHaveAttribute('data-selected')
  })

  it('hovering one day further re-renders the cells whose highlight changed only', async () => {
    const { user, trigger, rerendered } = setup(rangeParts, { defaultPlaceholder: jan20 })
    await user.click(trigger('1980-01-08'))
    await fireEvent.mouseEnter(trigger('1980-01-12'))
    expect(trigger('1980-01-10')).toHaveAttribute('data-highlighted')
    const changed = await rerendered(() => fireEvent.mouseEnter(trigger('1980-01-13')))
    // the old highlight end, the new end; every cell in between keeps its state
    expect(changed).toEqual(['1980-01-12', '1980-01-13'])
    expect(trigger('1980-01-13')).toHaveAttribute('data-highlighted-end')
    expect(trigger('1980-01-12')).not.toHaveAttribute('data-highlighted-end')
    expect(trigger('1980-01-12')).toHaveAttribute('data-highlighted')

    await user.click(trigger('1980-01-13'))
    expect(trigger('1980-01-08')).toHaveAttribute('data-selection-start')
    expect(trigger('1980-01-13')).toHaveAttribute('data-selection-end')
    expect(trigger('1980-01-10')).toHaveAttribute('data-selected')
    expect(trigger('1980-01-14')).not.toHaveAttribute('data-selected')
  })
})

describe('calendar cell trigger content', () => {
  it('renders the slot content as the trigger\'s children, with no empty text nodes', () => {
    for (const parts of [calendarParts, rangeParts]) {
      const { calendar, trigger, unmount } = setup(parts, { defaultPlaceholder: jan20 })
      expect(trigger('1980-01-20').innerHTML).toBe('<span>20</span>')
      // cells hold just their trigger, triggers just their content
      const cells = calendar.querySelectorAll('[role="gridcell"]')
      expect(cells).toHaveLength(35)
      for (const cell of cells)
        expect(cell.childNodes).toHaveLength(1)
      for (const cell of calendar.querySelectorAll('[data-reka-calendar-cell-trigger]'))
        expect(cell.childNodes).toHaveLength(1)
      unmount()
    }
  })

  it('falls back to the cell text when the slot renders nothing', async () => {
    for (const parts of [calendarParts, rangeParts]) {
      const { trigger, update, unmount } = setup(parts, { defaultPlaceholder: jan20 })
      await update({ showSlot: false })
      expect(trigger('1980-01-20').innerHTML).toBe('20')
      await update({ showSlot: true })
      expect(trigger('1980-01-20').innerHTML).toBe('<span>20</span>')
      unmount()
    }
  })
})
