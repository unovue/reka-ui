import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelectClosedItems } from './closedItems'

describe('selectClosedItems idle requests', () => {
  const callbacks = new Map<number, () => void>()
  let nextHandle = 0
  const requestIdle = vi.fn((callback: () => void) => {
    callbacks.set(++nextHandle, callback)
    return nextHandle
  })
  const cancelIdle = vi.fn((handle: number) => {
    callbacks.delete(handle)
  })
  const runIdle = () => {
    const pending = [...callbacks.values()]
    callbacks.clear()
    pending.forEach(callback => callback())
  }

  function create() {
    const closed = new SelectClosedItems(() => true, () => false, () => false, undefined)
    closed.activate()
    return closed
  }

  beforeEach(() => {
    callbacks.clear()
    requestIdle.mockClear()
    cancelIdle.mockClear()
    vi.stubGlobal('requestIdleCallback', requestIdle)
    vi.stubGlobal('cancelIdleCallback', cancelIdle)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares one callback between repeated calls and reasons', () => {
    const closed = create()
    closed.requestWhenIdle('typeahead')
    closed.requestWhenIdle('typeahead')
    closed.requestWhenIdle('form')
    expect(requestIdle).toHaveBeenCalledTimes(1)
    expect(closed.render.value).toBe(false)

    runIdle()
    expect(closed.render.value).toBe(true)
    // Both reasons landed: releasing one keeps the items for the other.
    closed.release('typeahead')
    expect(closed.render.value).toBe(true)
    closed.release('form')
    expect(closed.render.value).toBe(false)
  })

  it('does not schedule for a reason that already holds the items', () => {
    const closed = create()
    closed.request('typeahead')
    closed.requestWhenIdle('typeahead')
    expect(requestIdle).not.toHaveBeenCalled()
  })

  it('cancels the callback once no reason waits for it', () => {
    const closed = create()
    closed.requestWhenIdle('typeahead')
    closed.requestWhenIdle('form')
    closed.release('typeahead')
    expect(cancelIdle).not.toHaveBeenCalled()
    closed.release('form')
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    expect(callbacks.size).toBe(0)
  })

  it('cancels the callback when a sync request takes the only waiting reason', () => {
    const closed = create()
    closed.requestWhenIdle('typeahead')
    closed.request('typeahead')
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    expect(closed.render.value).toBe(true)
  })

  it('dispose cancels the callback, and nothing renders afterwards', () => {
    const closed = create()
    closed.requestWhenIdle('typeahead')
    closed.dispose()
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    runIdle()
    expect(closed.render.value).toBe(false)
  })
})
