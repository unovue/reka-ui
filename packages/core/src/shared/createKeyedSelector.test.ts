import { describe, expect, it } from 'vitest'
import { effect, effectScope, ref, shallowRef } from 'vue'
import { createKeyedSelector, createKeyedSetSelector, KeyedSelectorImpl, SelectorHold, useSelectorKey } from './createKeyedSelector'

/** Counts how often an effect reading `read()` re-runs. */
function track(read: () => boolean) {
  const runs = { count: 0, value: false }
  effect(() => {
    runs.value = read()
    runs.count++
  })
  return runs
}

describe('createKeyedSelector', () => {
  it('re-runs only the readers whose key entered or left', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<string | undefined>('a')
      const selector = createKeyedSelector(() => current.value)
      const readers = ['a', 'b', 'c', 'd'].map((key) => {
        const hold = new SelectorHold(selector)
        return track(() => hold.read(key))
      })
      expect(readers.map(r => r.value)).toEqual([true, false, false, false])
      expect(readers.map(r => r.count)).toEqual([1, 1, 1, 1])

      current.value = 'c'
      expect(readers.map(r => r.value)).toEqual([false, false, true, false])
      // Only the old and the new key re-ran.
      expect(readers.map(r => r.count)).toEqual([2, 1, 2, 1])

      current.value = undefined
      expect(readers.map(r => r.value)).toEqual([false, false, false, false])
      expect(readers.map(r => r.count)).toEqual([2, 1, 3, 1])
    })
    scope.stop()
  })

  it('reads its source only once something reads it', () => {
    const scope = effectScope()
    scope.run(() => {
      let reads = 0
      const current = shallowRef('a')
      const selector = createKeyedSelector(() => {
        reads++
        return current.value
      })
      current.value = 'b'
      expect(reads).toBe(0)
      expect(selector.is('b')).toBe(true)
      current.value = 'c'
      expect(selector.is('c')).toBe(true)
    })
    scope.stop()
  })

  it('answers for keys nobody holds by tracking the whole source', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef('a')
      const selector = createKeyedSelector(() => current.value)
      const reader = track(() => selector.is('b'))
      expect(reader.value).toBe(false)
      current.value = 'b'
      expect(reader.value).toBe(true)
    })
    scope.stop()
  })

  it('keeps a shared cell until its last holder releases it', () => {
    const selector = new KeyedSelectorImpl<string>(false, 'a')
    selector.hold('a')
    selector.hold('a')
    selector.release('a')
    expect(selector.strong!.has('a')).toBe(true)
    selector.release('a')
    expect(selector.strong!.has('a')).toBe(false)
  })

  it('keeps object keys in a WeakMap', () => {
    const el = {}
    const selector = new KeyedSelectorImpl<object>(false, el)
    selector.hold(el)
    expect(selector.strong).toBeUndefined()
    expect(selector.weak!.get(el)!.ref.value).toBe(true)
  })

  it('releases a moved hold', () => {
    const selector = new KeyedSelectorImpl<string>(false, undefined)
    const hold = new SelectorHold<string>(selector)
    hold.read('a')
    hold.read('b')
    expect([...selector.strong!.keys()]).toEqual(['b'])
    hold.release()
    expect(selector.strong!.size).toBe(0)
  })
})

describe('createKeyedSetSelector', () => {
  it('flips only the keys that entered or left the set', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<string[]>(['a', 'b'])
      const selector = createKeyedSetSelector(() => new Set(current.value))
      const readers = ['a', 'b', 'c'].map((key) => {
        const hold = new SelectorHold(selector)
        return track(() => hold.read(key))
      })
      current.value = ['b', 'c']
      expect(readers.map(r => r.value)).toEqual([false, true, true])
      // `b` stayed in the set and did not re-run.
      expect(readers.map(r => r.count)).toEqual([2, 1, 2])
    })
    scope.stop()
  })
})

describe('useSelectorKey', () => {
  it('holds no key and ignores key changes while nothing is selected', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<object | undefined>()
      const selector = createKeyedSelector(() => current.value)
      const element = shallowRef<object | undefined>()
      const read = useSelectorKey(selector, () => element.value)
      const reader = track(read)

      element.value = {}
      // The element ref was not read while nothing was selected.
      expect(reader.count).toBe(1)

      current.value = element.value
      expect(reader.value).toBe(true)
    })
    scope.stop()
  })

  it('releases its hold with the scope', () => {
    const selector = new KeyedSelectorImpl<string>(false, 'a')
    const scope = effectScope()
    scope.run(() => {
      useSelectorKey(selector, () => 'a')()
    })
    expect(selector.strong!.has('a')).toBe(true)
    scope.stop()
    expect(selector.strong!.has('a')).toBe(false)
  })
})

describe('createKeyedSelector edge cases', () => {
  it('answers the same for NaN whether or not a reader holds it', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<number | undefined>(1)
      const selector = createKeyedSelector(() => current.value)
      const hold = new SelectorHold(selector)
      expect(hold.read(Number.NaN)).toBe(false)

      // `source() === key` never holds for NaN.
      current.value = Number.NaN
      expect(hold.read(Number.NaN)).toBe(false)
      hold.release()
      expect(selector.is(Number.NaN)).toBe(false)
    })
    scope.stop()
  })

  it('describes the latest source when a reader changes it during an update', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<string | undefined>('a')
      const selector = createKeyedSelector(() => current.value)
      const holds = { a: new SelectorHold(selector), b: new SelectorHold(selector), c: new SelectorHold(selector) }
      // A synchronous reader of `a` that redirects the selection to `c` when `a` is deselected.
      effect(() => {
        if (!holds.a.read('a') && current.value === 'b')
          current.value = 'c'
      })
      holds.b.read('b')
      holds.c.read('c')

      current.value = 'b'
      expect(current.value).toBe('c')
      expect([holds.a.read('a'), holds.b.read('b'), holds.c.read('c')]).toEqual([false, false, true])
      // A reader without a cell reads the current key itself.
      expect([selector.is('b'), selector.is('c')]).toEqual([false, true])
      expect(selector.active).toBe(true)
    })
    scope.stop()
  })

  it('describes the latest set when a reader changes it during an update', () => {
    const scope = effectScope()
    scope.run(() => {
      const current = shallowRef<Set<string>>(new Set(['a']))
      const selector = createKeyedSetSelector(() => current.value)
      const holds = { a: new SelectorHold(selector), b: new SelectorHold(selector), c: new SelectorHold(selector) }
      effect(() => {
        if (!holds.a.read('a') && current.value.has('b'))
          current.value = new Set(['c'])
      })
      holds.b.read('b')
      holds.c.read('c')

      current.value = new Set(['b'])
      expect([...current.value]).toEqual(['c'])
      expect([holds.a.read('a'), holds.b.read('b'), holds.c.read('c')]).toEqual([false, false, true])
    })
    scope.stop()
  })

  it('follows a set that is changed in place', () => {
    const scope = effectScope()
    scope.run(() => {
      const selected = ref(new Set(['a']))
      const selector = createKeyedSetSelector(() => selected.value)
      const b = track(useSelectorKey(selector, () => 'b'))
      expect(b.value).toBe(false)

      selected.value.add('b')
      expect(b.value).toBe(true)
      expect(b.count).toBe(2)

      selected.value.delete('b')
      expect(b.value).toBe(false)

      selected.value.clear()
      expect(selector.active).toBe(false)
    })
    scope.stop()
  })
})
