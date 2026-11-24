import { describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { findValuesBetween } from './arrays'
import { useSelectionBehavior } from './useSelectionBehavior'

// Helper to build a fake getItems() entry with a real `dataset` (via a DOM element),
// matching the shape `handleMultipleReplace` expects: `{ ref: HTMLElement, value?: any }`.
// dataset.disabled is left undefined (i.e. NOT '') so the item survives the source filter.
function createItem(value: any) {
  const el = document.createElement('div')
  return { ref: el, value }
}

describe('useSelectionBehavior', () => {
  describe('onSelectItem - multiple + toggle', () => {
    it('adds the value when condition matches nothing', () => {
      const modelValue = ref<number[]>([1, 2])
      const props = reactive({ multiple: true, selectionBehavior: 'toggle' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      onSelectItem(3, v => v === 3)
      expect(modelValue.value).toEqual([1, 2, 3])
    })

    it('removes the matched index and preserves other entries', () => {
      const modelValue = ref<number[]>([1, 2, 3])
      const props = reactive({ multiple: true, selectionBehavior: 'toggle' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      onSelectItem(2, v => v === 2)
      expect(modelValue.value).toEqual([1, 3])
    })
  })

  describe('onSelectItem - multiple + replace', () => {
    it('replaces modelValue with [val] and sets firstValue to val', () => {
      const modelValue = ref<number[]>([1, 2, 3])
      const props = reactive({ multiple: true, selectionBehavior: 'replace' as const })
      const { onSelectItem, firstValue } = useSelectionBehavior(modelValue, props)

      onSelectItem(9, () => false)
      expect(modelValue.value).toEqual([9])
      expect(firstValue.value).toBe(9)
    })
  })

  describe('onSelectItem - single + toggle', () => {
    it('sets { ...val } when selecting a non-matching value', () => {
      const modelValue = ref<any>({ id: 1 })
      const props = reactive({ multiple: false, selectionBehavior: 'toggle' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      const val = { id: 2 }
      onSelectItem(val, existing => existing?.id === val.id)
      expect(modelValue.value).toEqual({ id: 2 })
    })

    it('clears to undefined when the current value matches condition', () => {
      const current = { id: 1 }
      const modelValue = ref<any>(current)
      const props = reactive({ multiple: false, selectionBehavior: 'toggle' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      // condition is evaluated against the *existing* modelValue (the currently selected one).
      onSelectItem({ id: 1 }, existing => existing?.id === 1)
      expect(modelValue.value).toBeUndefined()
    })
  })

  describe('onSelectItem - single + replace', () => {
    it('always sets { ...val }', () => {
      const modelValue = ref<any>({ id: 1 })
      const props = reactive({ multiple: false, selectionBehavior: 'replace' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      onSelectItem({ id: 5 }, () => true)
      expect(modelValue.value).toEqual({ id: 5 })
    })
  })

  describe('onSelectItem - spread characterization', () => {
    // NOTE: In the single-select branches the source assigns `{ ...val }`, producing a
    // shallow COPY rather than the same object reference. This is intentional current
    // behavior and is characterized here as-is (asserting toEqual but not toBe).
    it('single + replace assigns a copy of val, not the same reference', () => {
      const modelValue = ref<any>(undefined)
      const props = reactive({ multiple: false, selectionBehavior: 'replace' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      const val = { id: 7, nested: { a: 1 } }
      onSelectItem(val, () => true)
      expect(modelValue.value).toEqual(val)
      expect(modelValue.value).not.toBe(val)
    })

    it('single + toggle (non-matching) assigns a copy of val, not the same reference', () => {
      const modelValue = ref<any>({ id: 1 })
      const props = reactive({ multiple: false, selectionBehavior: 'toggle' as const })
      const { onSelectItem } = useSelectionBehavior(modelValue, props)

      const val = { id: 8 }
      onSelectItem(val, () => false)
      expect(modelValue.value).toEqual(val)
      expect(modelValue.value).not.toBe(val)
    })
  })

  describe('handleMultipleReplace - early returns (no change)', () => {
    it('returns early when firstValue is unset', () => {
      const modelValue = ref<number[]>([1, 2, 3])
      const props = reactive({ multiple: true, selectionBehavior: 'replace' as const })
      const { handleMultipleReplace } = useSelectionBehavior(modelValue, props)

      const items = [createItem(1), createItem(2), createItem(3)]
      // firstValue never set -> early return, modelValue untouched.
      handleMultipleReplace('next', items[2].ref, () => items, [1, 2, 3])
      expect(modelValue.value).toEqual([1, 2, 3])
    })

    it('returns early when multiple is false', () => {
      const modelValue = ref<any>([1, 2, 3])
      const props = reactive({ multiple: false, selectionBehavior: 'replace' as const })
      const { handleMultipleReplace } = useSelectionBehavior(modelValue, props)

      const items = [createItem(1), createItem(2), createItem(3)]
      // The `!props.multiple` guard short-circuits before firstValue matters.
      handleMultipleReplace('next', items[2].ref, () => items, [1, 2, 3])
      expect(modelValue.value).toEqual([1, 2, 3])
    })

    it('returns early when modelValue is not an array', () => {
      const modelValue = ref<any>([1, 2, 3])
      const props = reactive({ multiple: true, selectionBehavior: 'replace' as const })
      const { onSelectItem, handleMultipleReplace } = useSelectionBehavior(modelValue, props)

      // Set firstValue via a multiple+replace selection (also makes modelValue = [1]).
      onSelectItem(1, () => false)
      // Now make modelValue a non-array; handleMultipleReplace must bail.
      modelValue.value = { id: 1 }

      const items = [createItem(1), createItem(2), createItem(3)]
      handleMultipleReplace('next', items[2].ref, () => items, [1, 2, 3])
      expect(modelValue.value).toEqual({ id: 1 })
    })
  })

  describe('handleMultipleReplace - range selection', () => {
    const options = [10, 20, 30, 40, 50]

    function setup() {
      const modelValue = ref<any>([])
      const props = reactive({ multiple: true, selectionBehavior: 'replace' as const })
      const api = useSelectionBehavior(modelValue, props)
      // Selecting under replace sets firstValue (and modelValue = [10]).
      api.onSelectItem(10, () => false)
      const items = options.map(createItem)
      const getItems = () => items
      return { modelValue, items, getItems, handleMultipleReplace: api.handleMultipleReplace }
    }

    it('\'next\' sets modelValue to the inclusive range firstValue..lastValue', () => {
      const { modelValue, items, getItems, handleMultipleReplace } = setup()
      // currentElement = item whose value is 40 (firstValue is 10).
      const currentElement = items.find(i => i.value === 40)!.ref
      handleMultipleReplace('next', currentElement, getItems, options)
      expect(modelValue.value).toEqual(findValuesBetween(options, 10, 40))
      expect(modelValue.value).toEqual([10, 20, 30, 40])
    })

    it('\'prev\' sets modelValue to the inclusive range firstValue..lastValue', () => {
      const { modelValue, items, getItems, handleMultipleReplace } = setup()
      const currentElement = items.find(i => i.value === 30)!.ref
      handleMultipleReplace('prev', currentElement, getItems, options)
      expect(modelValue.value).toEqual(findValuesBetween(options, 10, 30))
      expect(modelValue.value).toEqual([10, 20, 30])
    })

    it('\'first\' selects from firstValue back to options[0]', () => {
      const { modelValue, items, getItems, handleMultipleReplace } = setup()
      // 'first' uses options[0] as the range end (currentElement value is ignored for the
      // range), but currentElement must still match an item to pass the lastValue guard.
      const currentElement = items.find(i => i.value === 50)!.ref
      handleMultipleReplace('first', currentElement, getItems, options)
      expect(modelValue.value).toEqual(findValuesBetween(options, 10, options[0]))
      expect(modelValue.value).toEqual([10])
    })

    it('\'last\' selects from firstValue to options.at(-1)', () => {
      const { modelValue, items, getItems, handleMultipleReplace } = setup()
      const currentElement = items.find(i => i.value === 50)!.ref
      handleMultipleReplace('last', currentElement, getItems, options)
      expect(modelValue.value).toEqual(findValuesBetween(options, 10, options.at(-1)))
      expect(modelValue.value).toEqual([10, 20, 30, 40, 50])
    })
  })
})

// `vi` is imported explicitly per repo test convention. These characterization tests
// exercise pure composable logic and need no mocks/spies, so it is referenced here.
void vi
