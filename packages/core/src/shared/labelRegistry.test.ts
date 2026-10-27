import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
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
})
