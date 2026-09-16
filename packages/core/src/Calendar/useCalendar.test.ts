import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from '@/date'
import { CalendarDate } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useCalendar } from './useCalendar'

/**
 * Standalone `useCalendar()` — the headless surface a consumer drives from JS.
 * The rendered behaviour is covered by `Calendar.test.ts` / `CalendarViews.test.ts`.
 */

const sep5 = new CalendarDate(2026, 9, 5)

function withScope<T>(fn: () => T): T {
  const scope = effectScope()
  return scope.run(fn)!
}

describe('useCalendar', () => {
  it('starts on the granularity view and clamps the view into [granularity, maxView]', () => {
    withScope(() => {
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5 })
      expect(api.view.value).toBe('day')
      expect(api.granularity.value).toBe('day')
      expect(api.maxView.value).toBe('year')

      expect(api.setView('year')).toBe(true)
      expect(api.view.value).toBe('year')
      expect(api.drillUp()).toBe(false)

      const monthOnly = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, granularity: 'month', maxView: 'month', view: 'day' })
      expect(monthOnly.view.value).toBe('month')
      expect(monthOnly.drillUp()).toBe(false)
    })
  })

  it('commits at the granularity with the reason and keeps the placeholder day for months', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, granularity: 'month', onUpdate })
      api.select(new CalendarDate(2026, 3, 1), 'cell-press')
      expect(onUpdate).toHaveBeenCalledTimes(1)
      const [value, details] = onUpdate.mock.calls[0]
      expect((value as DateValue).toString()).toBe('2026-03-05')
      expect(details.reason).toBe('cell-press')
      expect((api.modelValue.value as DateValue).toString()).toBe('2026-03-05')
      expect(api.lastChangeDetails.value.reason).toBe('cell-press')

      // Selecting the same month again deselects and parks the placeholder there.
      api.select(new CalendarDate(2026, 3, 1), 'cell-keydown')
      expect(api.modelValue.value).toBeUndefined()
      expect(api.placeholder.value.toString()).toBe('2026-03-05')
    })
  })

  it('drills instead of selecting above the granularity', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const onUpdateView = vi.fn()
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, defaultView: 'year', onUpdate, onUpdateView })
      expect(api.headingValue.value).toBe('2020 - 2031')

      api.select(new CalendarDate(2030, 1, 1), 'cell-press')
      expect(onUpdate).not.toHaveBeenCalled()
      expect(api.view.value).toBe('month')
      expect(api.placeholder.value.toString()).toBe('2030-09-05')
      expect(onUpdateView).toHaveBeenLastCalledWith('month', expect.objectContaining({ reason: 'view-drill' }))

      api.select(new CalendarDate(2030, 2, 1), 'cell-press')
      expect(api.view.value).toBe('day')
      expect(api.placeholder.value.toString()).toBe('2030-02-05')
      expect(api.headingValue.value).toBe('February 2030')

      api.select(new CalendarDate(2030, 2, 14), 'cell-press')
      expect((api.modelValue.value as DateValue).toString()).toBe('2030-02-14')
    })
  })

  it('honours beforeUpdate cancellation', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const api = useCalendar({
        locale: 'en-US',
        weekStartsOn: 0,
        defaultPlaceholder: sep5,
        onBeforeUpdate: (_value, details) => details.cancel(),
        onUpdate,
      })
      api.select(new CalendarDate(2026, 9, 10), 'cell-press')
      expect(onUpdate).not.toHaveBeenCalled()
      expect(api.modelValue.value).toBeUndefined()
    })
  })

  it('supports multiple selection at the granularity', () => {
    withScope(() => {
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, multiple: true, granularity: 'year' })
      api.select(new CalendarDate(2027, 1, 1))
      api.select(new CalendarDate(2029, 1, 1))
      expect((api.modelValue.value as DateValue[]).map(d => d.toString())).toEqual(['2027-09-05', '2029-09-05'])
      api.select(new CalendarDate(2027, 6, 1))
      expect((api.modelValue.value as DateValue[]).map(d => d.toString())).toEqual(['2029-09-05'])
    })
  })

  it('is controllable: a controlled model is emitted, not written', () => {
    withScope(() => {
      const model = ref<DateValue | undefined>(sep5)
      const emit = vi.fn()
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, modelValue: () => model.value, emit })
      expect(api.isControlled.value).toBe(true)
      api.select(new CalendarDate(2026, 9, 20), 'cell-press')
      expect(emit).toHaveBeenCalledWith('beforeUpdate:modelValue', expect.anything(), expect.objectContaining({ reason: 'cell-press' }))
      expect(emit).toHaveBeenCalledWith('update:modelValue', expect.anything(), expect.objectContaining({ reason: 'cell-press' }))
      expect((api.modelValue.value as DateValue).toString()).toBe('2026-09-05')
    })
  })

  it('exposes surfaces whose data attributes follow the state', () => {
    withScope(() => {
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, disabled: true })
      expect(api.root.attrs.value['data-disabled']).toBe('')
      expect(api.root.attrs.value['data-view']).toBe('day')
      expect(api.root.attrs.value['aria-label']).toBe('Event Date, September 2026')
      expect(api.prev.attrs.value.disabled).toBe(true)
      expect(api.viewTrigger.attrs.value['aria-label']).toBe('Switch to month view')

      const cell = api.getCellTriggerSurface(() => sep5, () => sep5)
      expect(cell.cellValue.value).toBe('5')
      expect(cell.attrs.value['data-value']).toBe('2026-09-05')
      expect(cell.attrs.value['data-disabled']).toBe('')
      expect(cell.attrs.value.tabindex).toBeUndefined()

      const enabled = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: sep5, modelValue: sep5 })
      const selectedCell = enabled.getCellTriggerSurface(() => sep5, () => sep5)
      expect(selectedCell.attrs.value['data-selected']).toBe('')
      expect(selectedCell.attrs.value['data-focused']).toBe('')
      expect(selectedCell.attrs.value.tabindex).toBe(0)
      const outside = enabled.getCellTriggerSurface(() => new CalendarDate(2026, 8, 31), () => sep5)
      expect(outside.attrs.value['data-outside-view']).toBe('')
      expect(outside.attrs.value.tabindex).toBeUndefined()

      const unit: CalendarUnit = 'month'
      const monthCell = enabled.getCellTriggerSurface(() => new CalendarDate(2026, 9, 1), undefined, unit)
      expect(monthCell.cellValue.value).toBe('Sep')
      expect(monthCell.attrs.value['data-view']).toBe('month')
    })
  })
})
