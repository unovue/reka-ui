import { describe, expect, it } from 'vitest'
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
