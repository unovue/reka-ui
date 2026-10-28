import { describe, expect, it } from 'vitest'
import { effect, effectScope, shallowRef } from 'vue'
import { valueComparator } from './compare'
import { SelectionSelector } from './selectionSelector'

const values: unknown[] = [
  undefined,
  null,
  'a',
  'b',
  '1',
  1,
  2,
  0,
  Number.NaN,
  true,
  false,
  { id: 1, label: 'one' },
  { id: 1, label: 'uno' },
  { id: 2, label: 'two' },
  { id: '1', label: 'string one' },
  { label: 'no id' },
  { id: { nested: 1 } },
  [1, 2],
]

describe('selectionSelector', () => {
  for (const by of [undefined, 'id'] as const) {
    it(`matches valueComparator for every model and value (by: ${String(by)})`, () => {
      const scope = effectScope()
      scope.run(() => {
        const model = shallowRef<unknown>()
        const selection = new SelectionSelector<unknown>(() => model.value, by as any)
        const models: unknown[] = [...values, [], values.slice(2, 6), values.slice(11, 14), [values[0], 'a']]
        for (const m of models) {
          model.value = m
          for (const value of values)
            expect(selection.isSelected(value), `model ${JSON.stringify(m)} value ${JSON.stringify(value)}`).toBe(valueComparator(m as any, value, by as any))
        }
      })
      scope.stop()
    })
  }

  it('falls back to the comparison for a function `by`', () => {
    const scope = effectScope()
    scope.run(() => {
      const model = shallowRef<{ id: number }>({ id: 1 })
      const selection = new SelectionSelector(() => model.value, (a, b) => a.id === b.id)
      expect(selection.selector).toBeUndefined()
      expect(selection.isSelected({ id: 1 })).toBe(true)
      expect(selection.isSelected({ id: 2 })).toBe(false)
    })
    scope.stop()
  })

  it('re-runs only the items a multiple selection change flips', () => {
    const scope = effectScope()
    scope.run(() => {
      const model = shallowRef<string[]>(['a'])
      const selection = new SelectionSelector<string>(() => model.value)
      const runs: Record<string, number> = {}
      for (const value of ['a', 'b', 'c', 'd']) {
        const hold = selection.createHold()
        runs[value] = 0
        effect(() => {
          selection.isSelected(value, hold)
          runs[value]++
        })
      }
      model.value = ['a', 'c']
      expect(runs).toEqual({ a: 1, b: 1, c: 2, d: 1 })
    })
    scope.stop()
  })
})
