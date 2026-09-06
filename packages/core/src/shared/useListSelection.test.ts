import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useListSelection } from './useListSelection'

describe('useListSelection — defaults', () => {
  it('starts undefined in single mode and [] in multiple mode', () => {
    expect(useListSelection().modelValue.value).toBeUndefined()
    expect(useListSelection({ multiple: true }).modelValue.value).toEqual([])
    expect(useListSelection({ defaultValue: 'a' }).modelValue.value).toBe('a')
    expect(useListSelection({ multiple: true, defaultValue: ['a'] }).modelValue.value).toEqual(['a'])
  })

  it('is uncontrolled with `reason: none` until the first change', () => {
    const s = useListSelection()
    expect(s.isControlled.value).toBe(false)
    expect(s.lastChangeDetails.value.reason).toBe('none')
    expect(s.firstValue.value).toBeUndefined()
  })
})

describe('useListSelection — single', () => {
  it('toggle: selects a value and clears it when re-selected', () => {
    const s = useListSelection<string>()
    expect(s.select('a')).toBe(true)
    expect(s.modelValue.value).toBe('a')
    expect(s.isSelected('a')).toBe(true)
    expect(s.select('a')).toBe(true)
    expect(s.modelValue.value).toBeUndefined()
    expect(s.isSelected('a')).toBe(false)
  })

  it('replace: never clears a re-selected value (and reports no change)', () => {
    const s = useListSelection<string>({ selectionBehavior: 'replace' })
    expect(s.select('a')).toBe(true)
    expect(s.select('a')).toBe(false)
    expect(s.modelValue.value).toBe('a')
    expect(s.select('b')).toBe(true)
    expect(s.modelValue.value).toBe('b')
  })

  it('matches object values with `by`', () => {
    const s = useListSelection<{ id: number, label: string }>({ by: 'id', defaultValue: { id: 1, label: 'One' } })
    expect(s.isSelected({ id: 1, label: 'Uno' })).toBe(true)
    // Toggling the same identity clears the selection.
    s.select({ id: 1, label: 'Uno' })
    expect(s.modelValue.value).toBeUndefined()
  })
})

describe('useListSelection — multiple', () => {
  it('toggle: adds and removes values', () => {
    const s = useListSelection<string>({ multiple: true })
    s.select('a')
    s.select('b')
    expect(s.modelValue.value).toEqual(['a', 'b'])
    s.select('a')
    expect(s.modelValue.value).toEqual(['b'])
    expect(s.firstValue.value).toBeUndefined()
  })

  it('replace: selects [value] and records it as the range anchor', () => {
    const s = useListSelection<string>({ multiple: true, selectionBehavior: 'replace' })
    s.select('a')
    s.select('b')
    expect(s.modelValue.value).toEqual(['b'])
    expect(s.firstValue.value).toBe('b')
  })

  it('replace: re-selecting the current value emits nothing (entries compared with Object.is)', () => {
    const onUpdate = vi.fn()
    const s = useListSelection<string>({ multiple: true, selectionBehavior: 'replace', onUpdate })
    expect(s.select('a')).toBe(true)
    expect(s.select('a')).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(s.setModelValue(['a'])).toBe(false)
    expect(s.setModelValue(['a', 'b'])).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('reads `multiple` reactively', () => {
    const multiple = ref(false)
    const s = useListSelection<string>({ multiple })
    s.select('a')
    expect(s.modelValue.value).toBe('a')
    multiple.value = true
    s.select('b')
    // The previous single value is not an array, so the multiple path starts fresh.
    expect(s.modelValue.value).toEqual(['b'])
  })
})

describe('useListSelection — model plumbing', () => {
  it('setModelValue writes the whole model with the given reason', () => {
    const s = useListSelection<string, 'select-all'>({ multiple: true })
    const event = new KeyboardEvent('keydown', { key: 'a' })
    expect(s.setModelValue(['a', 'b'], 'select-all', event)).toBe(true)
    expect(s.modelValue.value).toEqual(['a', 'b'])
    expect(s.lastChangeDetails.value).toMatchObject({ reason: 'select-all', event })
  })

  it('ref-owned mode writes through the passed ref', () => {
    const model = ref<string | undefined>()
    const s = useListSelection({ modelValue: model })
    s.select('a')
    expect(model.value).toBe('a')
  })

  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const s = useListSelection<string, 'item-press'>({ modelValue: () => 'a', emit })
    expect(s.isControlled.value).toBe(true)
    const event = new MouseEvent('click')
    expect(s.select('b', 'item-press', event)).toBe(true)
    expect(s.modelValue.value).toBe('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'b', expect.objectContaining({ reason: 'item-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'b', expect.objectContaining({ reason: 'item-press', event }))
  })

  it('uses the `name` option for the emits', () => {
    const emit = vi.fn()
    const s = useListSelection<string>({ emit, name: 'selected' })
    s.select('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:selected', 'a', expect.anything())
    expect(emit).toHaveBeenNthCalledWith(2, 'update:selected', 'a', expect.anything())
  })

  it('cancel in onBeforeUpdate keeps the selection and the range anchor', () => {
    const onUpdate = vi.fn()
    const s = useListSelection<string>({
      multiple: true,
      selectionBehavior: 'replace',
      defaultValue: ['a'],
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    expect(s.select('b')).toBe(false)
    expect(s.modelValue.value).toEqual(['a'])
    expect(s.firstValue.value).toBeUndefined()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(s.lastChangeDetails.value.isCanceled).toBe(true)
  })

  it('imperative select reports reason "imperative-action"', () => {
    const s = useListSelection<string>()
    s.select('a')
    expect(s.lastChangeDetails.value.reason).toBe('imperative-action')
  })
})
