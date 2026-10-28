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
