import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, effectScope, h, nextTick, watch } from 'vue'
import { useRangeCalendar } from '@/RangeCalendar/useRangeCalendar'
import { useCalendar } from './useCalendar'

// The cells read their selection / focus / range flags from a per-root keyed
// index that a model change only marks stale. Every read through a cell
// surface must still give the current answer, and the index must agree with
// the root's own predicates.

const jan20 = new Temporal.PlainDate(1980, 1, 20)
const jan10 = new Temporal.PlainDate(1980, 1, 10)

function inScope<T>(fn: () => T) {
  const scope = effectScope()
  const result = scope.run(fn)!
  return { result, stop: () => scope.stop() }
}

describe('headless cell surfaces read the current state', () => {
  it('right after select(), before any flush', () => {
    const { stop } = inScope(() => {
      const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultValue: jan20 })
      const trigger = api.getCellTriggerSurface(jan10)
      const cell = api.getCellSurface(jan10)
      expect(trigger.state.value.selected).toBe(false)
      api.select(jan10, 'cell-press')
      expect(trigger.state.value.selected).toBe(true)
      expect(cell.props.value['aria-selected']).toBe(true)
      expect(api.getCellTriggerSurface(jan20).state.value.selected).toBe(false)
    })
    stop()
  })

  it('inside the change callback', () => {
    let seen: boolean | undefined
    const { stop } = inScope(() => {
      const api: ReturnType<typeof useCalendar> = useCalendar({
        locale: 'en-US',
        weekStartsOn: 0,
        defaultValue: jan20,
        onUpdate: () => { seen = api.getCellTriggerSurface(jan10).state.value.selected },
      })
      api.select(jan10, 'cell-press')
    })
    stop()
    expect(seen).toBe(true)
  })

  it('in a consumer watcher on the model', async () => {
    const seen: boolean[] = []
    let select!: (date: Temporal.PlainDate) => void
    const wrapper = mount(defineComponent({
      setup() {
        const api = useCalendar({ locale: 'en-US', weekStartsOn: 0, defaultValue: jan20 })
        const trigger = api.getCellTriggerSurface(jan10)
        watch(api.modelValue, () => seen.push(trigger.state.value.selected))
        select = date => api.select(date, 'cell-press')
        return () => h('div')
      },
    }))
    select(jan10)
    await nextTick()
    expect(seen).toEqual([true])
    wrapper.unmount()
  })

  it('range: right after select()', () => {
    const { stop } = inScope(() => {
      const api = useRangeCalendar({ locale: 'en-US', weekStartsOn: 0, defaultPlaceholder: jan20 })
      const trigger = api.getCellTriggerSurface(jan10)
      api.select(jan10, 'cell-press')
      expect(trigger.state.value.selectionStart).toBe(true)
      expect(trigger.state.value.selected).toBe(true)
    })
    stop()
  })
})

describe('a model in another calendar than the grid', () => {
  const mar = new Temporal.PlainDate(2024, 3, 1)
  const apr = new Temporal.PlainDate(2024, 4, 1)
  // 2024-03-25 is in Adar II 5784, which runs from 2024-03-11 to 2024-04-08:
  // compared in the model's calendar, the month containing the April 1 cell.
  const hebrew = new Temporal.PlainDate(2024, 3, 25).withCalendar('hebrew')

  it('selects the month cells the root\'s predicate selects', async () => {
    const { result: api, stop } = inScope(() => useCalendar({
      locale: 'en-US',
      weekStartsOn: 0,
      granularity: 'month',
      defaultValue: hebrew,
      defaultPlaceholder: mar,
    }))
    await nextTick()
    const rendered = { mar: api.getCellTriggerSurface(mar).state.value.selected, apr: api.getCellTriggerSurface(apr).state.value.selected }
    expect(rendered).toEqual({ mar: api.context.isDateSelected(mar), apr: api.context.isDateSelected(apr) })
    expect(rendered).toEqual({ mar: false, apr: true })
    expect(api.getCellSurface(apr).props.value['aria-selected']).toBe(true)
    stop()
  })

  it('range: the ends follow the root\'s predicates', async () => {
    const { result: api, stop } = inScope(() => useRangeCalendar({
      locale: 'en-US',
      weekStartsOn: 0,
      granularity: 'month',
      defaultValue: { start: hebrew, end: hebrew.add({ months: 2 }) },
      defaultPlaceholder: mar,
    }))
    await nextTick()
    for (let month = 1; month <= 12; month++) {
      const date = new Temporal.PlainDate(2024, month, 1)
      const state = api.getCellTriggerSurface(date).state.value
      expect({ month, start: state.selectionStart, end: state.selectionEnd, selected: state.selected })
        .toEqual({ month, start: api.context.isSelectionStart(date), end: api.context.isSelectionEnd(date), selected: api.context.isSelected(date) })
    }
    stop()
  })
})
