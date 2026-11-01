import { describe, expect, it, vi } from 'vitest'
import { computed, effect } from 'vue'
import { createLabelRegistry } from './labelRegistry'

describe('createLabelRegistry', () => {
  it('matches values with `by` and keeps the last write', () => {
    const labels = createLabelRegistry<{ id: number }>('id')
    labels.register({ id: 1 }, 'One')
    labels.register({ id: 1 }, 'Uno')
    expect(labels.get({ id: 1 })).toBe('Uno')
    expect(labels.entries()).toHaveLength(1)
  })

  it('the latest value wins when only its other fields changed', () => {
    const labels = createLabelRegistry<{ id: number, rev: number }>('id')
    labels.register({ id: 1, rev: 1 }, 'One')
    let runs = 0
    const value = computed(() => {
      runs++
      return labels.entries()[0].value.rev
    })
    expect(value.value).toBe(1)
    labels.register({ id: 1, rev: 2 }, 'One')
    expect(value.value).toBe(2)
    expect(runs).toBe(2)
  })

  it('the latest value wins under a function `by`', () => {
    const labels = createLabelRegistry<{ id: number, rev: number }>((a, b) => a.id === b.id)
    labels.register({ id: 1, rev: 1 }, 'One')
    labels.register({ id: 1, rev: 2 }, 'One')
    expect(labels.entries()).toEqual([{ value: { id: 1, rev: 2 }, label: 'One', disabled: false }])
  })

  it('an unchanged registration invalidates nothing', () => {
    const labels = createLabelRegistry<{ id: number, rev: number }>('id')
    const object = { id: 1, rev: 1 }
    labels.register(object, 'One')
    let runs = 0
    const entries = computed(() => {
      runs++
      return labels.entries()
    })
    void entries.value
    labels.register(object, 'One')
    void entries.value
    expect(runs).toBe(1)
  })

  it('never serializes a value under `by`: any field works, and the latest value still wins', () => {
    const fields = { Blob: () => new Blob(['x']), element: () => document.createElement('div'), WeakMap: () => new WeakMap(), Promise: () => Promise.resolve(1) }
    for (const make of Object.values(fields)) {
      for (const by of ['id', (a: any, b: any) => a.id === b.id] as const) {
        const labels = createLabelRegistry<any>(by)
        labels.register({ id: 1, field: make() }, 'One')
        const latest = { id: 1, field: make() }
        labels.register(latest, 'One')
        expect(labels.entries()[0].value).toBe(latest)
      }
    }
  })

  it('does not read below a value\'s own fields', () => {
    const labels = createLabelRegistry<any>('id')
    const read = vi.fn(() => 1)
    const nested = () => Object.defineProperty({}, 'deep', { enumerable: true, get: read })
    labels.register({ id: 1, nested: nested() }, 'One')
    labels.register({ id: 1, nested: nested() }, 'One')
    expect(read).not.toHaveBeenCalled()
  })

  it('a class instance or a `Date` is never taken for a copy', () => {
    const labels = createLabelRegistry<any>(() => true)
    labels.register(new Date(0), 'One')
    let runs = 0
    const entries = computed(() => {
      runs++
      return labels.entries()
    })
    void entries.value
    labels.register(new Date(1), 'One')
    void entries.value
    expect(runs).toBe(2)
  })

  it('an equal copy is kept without invalidating anything (an inline `:value` re-created by a render)', () => {
    const labels = createLabelRegistry<{ id: number, rev: number }>('id')
    labels.register({ id: 1, rev: 1 }, 'One')
    let runs = 0
    const entries = computed(() => {
      runs++
      return labels.entries()
    })
    void entries.value
    const copy = { id: 1, rev: 1 }
    labels.register(copy, 'One')
    void entries.value
    expect(runs).toBe(1)
    expect(labels.entries()[0].value).toBe(copy)
  })

  it('a value with a field added is not a copy', () => {
    const labels = createLabelRegistry<{ id: number, rev?: number }>('id')
    labels.register({ id: 1 }, 'One')
    let runs = 0
    const entries = computed(() => {
      runs++
      return labels.entries()
    })
    void entries.value
    labels.register({ id: 1, rev: 1 }, 'One')
    void entries.value
    expect(runs).toBe(2)
  })

  it('a value with another key holding `undefined` is not a copy', () => {
    const labels = createLabelRegistry<Record<string, unknown>>('id')
    labels.register({ id: 1, a: undefined }, 'One')
    let runs = 0
    const entries = computed(() => {
      runs++
      return labels.entries()
    })
    void entries.value
    labels.register({ id: 1, b: undefined }, 'One')
    void entries.value
    expect(runs).toBe(2)
  })

  it('re-runs a lookup that missed once the value registers', () => {
    const labels = createLabelRegistry<string>()
    const label = computed(() => labels.get('apple'))
    expect(label.value).toBeUndefined()
    labels.register('apple', 'Apple')
    expect(label.value).toBe('Apple')
  })

  it('does not track the registry while registering', () => {
    const labels = createLabelRegistry<string>()
    let runs = 0
    // An item registering from an effect must not re-run on every other item's registration.
    effect(() => {
      runs++
      labels.register('apple', 'Apple')
    })
    labels.register('banana', 'Banana')
    labels.register('apple', 'Green apple')
    expect(runs).toBe(1)
    expect(labels.get('apple')).toBe('Green apple')
  })
})
