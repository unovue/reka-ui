import { describe, expect, it } from 'vitest'
import { effect, effectScope, reactive, ref } from 'vue'
import { SelectionSelector } from './selectionSelector'
import { valueComparator } from './utils'

const shared = { id: 1, name: 'shared' }
const date = new Date('2026-01-15T00:00:00Z')
const element = document.createElement('div')

// Model and item values that exercise every branch of `compare`.
const VALUES: unknown[] = [
  undefined,
  null,
  '',
  'a',
  'b',
  '1',
  1,
  0,
  -0,
  Number.NaN,
  true,
  false,
  10n,
  shared,
  { id: 1, name: 'other' },
  { id: '1' },
  { id: 2 },
  { id: null },
  { id: Number.NaN },
  { id: { nested: true } },
  { name: 'no id' },
  ['a'],
  date,
  new Date(date),
  element,
]

const MODELS: unknown[] = [
  ...VALUES,
  [],
  ['a', 'b'],
  [1, '1'],
  [shared, { id: 2 }],
  [null],
  [undefined, 'a'],
  [{ id: { nested: true } }, 'a'],
  [element],
]

// `compare` throws on a value ohash cannot serialize (unless it is the very same value).
function expected(model: unknown, value: unknown, by: any): boolean | 'throws' {
  try {
    return valueComparator(model, value, by)
  }
  catch {
    return 'throws'
  }
}

function actual(selector: SelectionSelector<unknown>, value: unknown, hold = selector.createHold()): boolean | 'throws' {
  try {
    return selector.isSelected(value, hold)
  }
  catch {
    return 'throws'
  }
}

describe('selectionSelector', () => {
  for (const by of [undefined, 'id', 'name', (a: any, b: any) => a?.id === b?.id]) {
    it(`answers as valueComparator does (by: ${typeof by === 'function' ? 'function' : by})`, () => {
      const scope = effectScope()
      scope.run(() => {
        for (const initial of MODELS) {
          const model = ref<unknown>(initial)
          const selector = new SelectionSelector<unknown>(() => model.value, by)
          // One hold per item, kept across the model changes below, as an item keeps its own.
          const holds = VALUES.map(() => selector.createHold())
          const check = () => VALUES.forEach((value, index) => {
            expect(actual(selector, value, holds[index]), `model ${String(JSON.stringify(model.value, (_, v) => typeof v === 'bigint' ? `${v}n` : v))}, value #${index}`)
              .toBe(expected(model.value, value, by))
          })
          check()
          for (const next of MODELS) {
            model.value = next
            check()
          }
        }
      })
      scope.stop()
    })
  }

  it('notifies only the readers whose value entered or left the selection', () => {
    const scope = effectScope()
    scope.run(() => {
      const model = ref<string[]>(['a'])
      const selector = new SelectionSelector<string>(() => model.value)
      const runs = { a: 0, b: 0, c: 0 }
      for (const value of ['a', 'b', 'c'] as const) {
        const hold = selector.createHold()
        effect(() => {
          selector.isSelected(value, hold)
          runs[value]++
        })
      }
      expect(runs).toEqual({ a: 1, b: 1, c: 1 })

      model.value = ['a', 'b']
      expect(runs).toEqual({ a: 1, b: 2, c: 1 })

      model.value.push('c')
      expect(runs).toEqual({ a: 1, b: 2, c: 2 })

      model.value = ['c']
      expect(runs).toEqual({ a: 2, b: 3, c: 2 })
    })
    scope.stop()
  })

  it('follows an object mutated in place', () => {
    const scope = effectScope()
    scope.run(() => {
      const selected = reactive({ id: 1 })
      const model = ref<any>(selected)
      const selector = new SelectionSelector<any>(() => model.value, 'id')
      const hold = selector.createHold()
      let isSelected = false
      effect(() => {
        isSelected = selector.isSelected({ id: 2 }, hold)
      })
      expect(isSelected).toBe(false)

      selected.id = 2
      expect(isSelected).toBe(true)
    })
    scope.stop()
  })

  it('does not build a key while nothing is selected', () => {
    const scope = effectScope()
    scope.run(() => {
      const model = ref<unknown>(undefined)
      const selector = new SelectionSelector<unknown>(() => model.value)
      let reads = 0
      const value = {
        get label() {
          reads++
          return 'a'
        },
      }
      const hold = selector.createHold()
      expect(selector.isSelected(value, hold)).toBe(false)
      expect(reads).toBe(0)

      model.value = { label: 'a' }
      expect(selector.isSelected(value, hold)).toBe(true)
    })
    scope.stop()
  })
})
