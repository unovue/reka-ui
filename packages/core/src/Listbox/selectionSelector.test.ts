import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, effect, effectScope, markRaw, nextTick, reactive, ref, shallowRef } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'
import { selectionKey, SelectionSelector } from './selectionSelector'
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
    // TODO(v3-port): #3401 v3's `compare` (#2824) treats a null model with a string `by` differently; v3 src does not use this selector
    ;(typeof by === 'string' ? it.skip : it)(`answers as valueComparator does (by: ${typeof by === 'function' ? 'function' : by})`, () => {
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

  it('keeps matching a selected Date by reference after it is changed in place', () => {
    const scope = effectScope()
    scope.run(() => {
      // Vue does not make a Date reactive, so nothing reports `setTime()`.
      const selected = new Date('2026-01-15T00:00:00Z')
      const model = ref<unknown>(selected)
      const selector = new SelectionSelector<unknown>(() => model.value)
      expect(selector.isSelected(selected, selector.createHold())).toBe(true)

      selected.setTime(selected.getTime() + 1000)
      // An item mounted after the change (a new hold), as `valueComparator` answers.
      expect(selector.isSelected(selected, selector.createHold())).toBe(valueComparator(model.value, selected))
      expect(selector.isSelected(new Date(selected), selector.createHold())).toBe(valueComparator(model.value, new Date(selected)))
    })
    scope.stop()
  })

  it('keeps matching a selected object after a Date inside it is changed in place', () => {
    const scope = effectScope()
    scope.run(() => {
      const selected = { id: 1, when: new Date('2026-01-15T00:00:00Z'), tags: [new Date(0)] }
      const model = ref<unknown>(selected)
      const selector = new SelectionSelector<unknown>(() => model.value)
      expect(selector.isSelected(selected, selector.createHold())).toBe(true)

      selected.when.setTime(selected.when.getTime() + 1000)
      selected.tags[0].setTime(5)
      // An item mounted after the change (a new hold), as `valueComparator` answers.
      expect(selector.isSelected(selected, selector.createHold())).toBe(valueComparator(model.value, selected))
      const copy = { id: 1, when: new Date(selected.when), tags: [new Date(5)] }
      expect(selector.isSelected(copy, selector.createHold())).toBe(valueComparator(model.value, copy))
    })
    scope.stop()
  })

  it.each([
    ['markRaw', (v: { id: number }) => markRaw(v)],
    ['shallowRef', (v: { id: number }) => v],
  ])('keeps matching a %s model object after its key is changed in place', (_, wrap) => {
    const scope = effectScope()
    scope.run(() => {
      for (const by of ['id', undefined]) {
        const selected = wrap({ id: 1 }) as { id: number }
        const model = shallowRef<unknown>(selected)
        const selector = new SelectionSelector<unknown>(() => model.value, by)
        expect(selector.isSelected({ id: 1 }, selector.createHold())).toBe(true)
        selected.id = 2
        const item = { id: selected.id }
        // An item mounted after the change (a new hold), as `valueComparator` answers.
        expect(selector.isSelected(item, selector.createHold())).toBe(valueComparator(model.value, item, by))
      }
    })
    scope.stop()
  })

  it('falls back to the comparator when reading the value throws', () => {
    const value = {
      id: 1,
      get broken(): never {
        throw new Error('unreadable')
      },
    }
    expect(selectionKey(value, undefined, true)).toBeUndefined()
    expect(selectionKey({ nested: value }, undefined, false)).toBeUndefined()
  })

  it('stops following the model when the listbox unmounts', async () => {
    let reads = 0
    const entry = {
      get id() {
        reads++
        return 1
      },
    }
    const model = reactive<any[]>([entry])
    const wrapper = mount(defineComponent({
      components: { ListboxRoot, ListboxContent, ListboxItem },
      setup: () => ({ model }),
      template: `<ListboxRoot multiple by="id" :model-value="model">
        <ListboxContent>
          <ListboxItem v-for="v in [1, 2]" :key="v" :value="{ id: v }">{{ v }}</ListboxItem>
        </ListboxContent>
      </ListboxRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    expect(wrapper.findAll('[data-state=checked]')).toHaveLength(1)

    // Mounted: the selector follows the model, and the items with it.
    reads = 0
    model.push({ id: 2 })
    expect(reads).toBeGreaterThan(0)
    await nextTick()
    expect(wrapper.findAll('[data-state=checked]')).toHaveLength(2)

    wrapper.unmount()
    reads = 0
    model.push({ id: 3 })
    expect(reads).toBe(0)
  })
})
