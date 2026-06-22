import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNextMatch, useTypeahead, wrapArray } from './useTypeahead'

function createItem(textContent: string, value?: any) {
  const ref = document.createElement('div')
  ref.textContent = textContent
  return { ref, value }
}

describe('wrapArray', () => {
  it('wraps the array around itself at the given start index', () => {
    expect(wrapArray(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'd', 'a', 'b'])
  })

  it('returns the same order when start index is 0', () => {
    expect(wrapArray(['a', 'b', 'c', 'd'], 0)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('handles start index larger than length via modulo', () => {
    expect(wrapArray(['a', 'b', 'c', 'd'], 5)).toEqual(['b', 'c', 'd', 'a'])
  })
})

describe('getNextMatch', () => {
  it('matches a basic prefix', () => {
    expect(getNextMatch(['Apple', 'Banana', 'Cherry'], 'b')).toBe('Banana')
  })

  it('matches case-insensitively', () => {
    expect(getNextMatch(['Apple', 'Banana', 'Cherry'], 'B')).toBe('Banana')
    expect(getNextMatch(['apple', 'banana', 'cherry'], 'BA')).toBe('banana')
  })

  it('cycles to the NEXT value on repeated-character search, excluding current match', () => {
    // 'aa' normalizes to 'a' (single char => exclude current match)
    expect(
      getNextMatch(['Apple', 'Avocado', 'Banana'], 'aa', 'Apple'),
    ).toBe('Avocado')
  })

  it('searches forward from the current match and wraps past the end of the array', () => {
    // current match is 'Cherry' (last). Searching 'a' should wrap around to 'Apple'
    expect(
      getNextMatch(['Apple', 'Banana', 'Cherry'], 'a', 'Cherry'),
    ).toBe('Apple')
  })

  it('returns undefined when nothing matches', () => {
    expect(getNextMatch(['Apple', 'Banana', 'Cherry'], 'z')).toBeUndefined()
  })

  it('returns undefined when the only match IS the current match', () => {
    // Only 'Apple' starts with 'a'; it is the current match so focus should not move.
    expect(
      getNextMatch(['Apple', 'Banana', 'Cherry'], 'a', 'Apple'),
    ).toBeUndefined()
  })

  it('does not exclude the current match for multi-character (non-repeated) searches', () => {
    // 'ap' is length 2 and not repeated => current match is NOT excluded,
    // so a still-matching current match stays put (returns undefined).
    expect(
      getNextMatch(['Apple', 'Apricot', 'Banana'], 'ap', 'Apple'),
    ).toBeUndefined()
  })
})

describe('useTypeahead', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('focuses the matching element when typing', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch } = useTypeahead()

    const apple = createItem('Apple')
    const banana = createItem('Banana')
    const cherry = createItem('Cherry')
    apple.ref.focus = vi.fn()
    banana.ref.focus = vi.fn()
    cherry.ref.focus = vi.fn()

    const result = handleTypeaheadSearch('b', [apple, banana, cherry])

    expect(banana.ref.focus).toHaveBeenCalledTimes(1)
    expect(apple.ref.focus).not.toHaveBeenCalled()
    expect(result).toBe(banana.ref)
  })

  it('focuses via document.activeElement when elements are attached to the body', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch } = useTypeahead()

    const apple = createItem('Apple')
    const banana = createItem('Banana')
    apple.ref.tabIndex = -1
    banana.ref.tabIndex = -1
    document.body.appendChild(apple.ref)
    document.body.appendChild(banana.ref)

    handleTypeaheadSearch('b', [apple, banana])
    expect(document.activeElement).toBe(banana.ref)
  })

  it('uses item.value.textValue with precedence over textContent', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch } = useTypeahead()

    // textContent says 'Zzz' but textValue says 'Banana'
    const apple = createItem('Apple', { textValue: 'Apple' })
    const banana = createItem('Zzz', { textValue: 'Banana' })
    apple.ref.focus = vi.fn()
    banana.ref.focus = vi.fn()

    const result = handleTypeaheadSearch('b', [apple, banana])

    expect(banana.ref.focus).toHaveBeenCalledTimes(1)
    expect(result).toBe(banana.ref)
  })

  it('accumulates the search buffer across calls', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch, search } = useTypeahead()

    const apple = createItem('Apple')
    const banana = createItem('Banana')
    apple.ref.focus = vi.fn()
    banana.ref.focus = vi.fn()
    const items = [apple, banana]

    // 'b' matches Banana
    handleTypeaheadSearch('b', items)
    expect(search.value).toBe('b')
    // buffer becomes 'ba' which still matches Banana (not Apple)
    const result = handleTypeaheadSearch('a', items)
    expect(search.value).toBe('ba')
    expect(result).toBe(banana.ref)
  })

  it('resets the search buffer after 1000ms', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch, search } = useTypeahead()

    const apple = createItem('Apple')
    apple.ref.focus = vi.fn()

    handleTypeaheadSearch('a', [apple])
    expect(search.value).toBe('a')

    vi.advanceTimersByTime(1000)
    expect(search.value).toBe('')
  })

  it('resetTypeahead clears the buffer immediately', () => {
    vi.useFakeTimers()
    const { handleTypeaheadSearch, resetTypeahead, search } = useTypeahead()

    const apple = createItem('Apple')
    apple.ref.focus = vi.fn()

    handleTypeaheadSearch('a', [apple])
    expect(search.value).toBe('a')

    resetTypeahead()
    expect(search.value).toBe('')
  })

  it('invokes the callback with the key and does NOT focus when a callback is provided', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const { handleTypeaheadSearch, search } = useTypeahead(callback)

    const apple = createItem('Apple')
    const banana = createItem('Banana')
    apple.ref.focus = vi.fn()
    banana.ref.focus = vi.fn()

    const result = handleTypeaheadSearch('b', [apple, banana])

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('b')
    expect(apple.ref.focus).not.toHaveBeenCalled()
    expect(banana.ref.focus).not.toHaveBeenCalled()
    // search buffer is still updated even though no focusing happens
    expect(search.value).toBe('b')
    // NOTE: when a callback is provided, handleTypeaheadSearch returns undefined
    // (the focusing branch that returns an element ref is skipped entirely).
    expect(result).toBeUndefined()
  })
})
