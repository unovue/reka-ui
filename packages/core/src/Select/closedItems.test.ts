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
    const closed = new SelectClosedItems(() => true, () => false, undefined)
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

  it('shares one callback between repeated calls', () => {
    const closed = create()
    closed.requestFormWhenIdle()
    closed.requestFormWhenIdle()
    expect(requestIdle).toHaveBeenCalledTimes(1)
    expect(closed.render.value).toBe(false)

    runIdle()
    expect(closed.render.value).toBe(true)
    closed.release('form')
    expect(closed.render.value).toBe(false)
  })

  it('does not schedule while the form already holds the items', () => {
    const closed = create()
    closed.requestFormWhenIdle()
    runIdle()
    closed.requestFormWhenIdle()
    expect(requestIdle).toHaveBeenCalledTimes(1)
  })

  it('a typeahead release keeps the pending form callback, and the form\'s items', () => {
    const closed = create()
    closed.requestFormWhenIdle()
    closed.release('typeahead')
    expect(cancelIdle).not.toHaveBeenCalled()
    runIdle()
    closed.renderThen(() => {})
    closed.release('typeahead')
    expect(closed.render.value).toBe(true)
  })

  it('a form release cancels the callback', () => {
    const closed = create()
    closed.requestFormWhenIdle()
    closed.release('form')
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    expect(callbacks.size).toBe(0)
  })

  it('dispose cancels the callback, and nothing renders afterwards', () => {
    const closed = create()
    closed.requestFormWhenIdle()
    closed.dispose()
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    runIdle()
    expect(closed.render.value).toBe(false)
  })
})
