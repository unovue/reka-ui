import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { SelectClosedItems } from './closedItems'

describe('selectClosedItems', () => {
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

  function create({ items = true, form = true } = {}) {
    const needsForm = shallowRef(form)
    const closed = new SelectClosedItems(() => true, () => false, () => items, undefined)
    closed.needsForm = () => needsForm.value
    closed.activate()
    return { closed, needsForm }
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

  it('renders for a form from the start without `items`, whose options need the render', () => {
    expect(create({ items: false }).closed.render.value).toBe(true)
  })

  it('renders for a form in idle time with `items`, in one callback', () => {
    const { closed } = create()
    closed.renderFormWhenIdle()
    closed.renderFormWhenIdle()
    expect(requestIdle).toHaveBeenCalledTimes(1)
    expect(closed.render.value).toBe(false)
    runIdle()
    expect(closed.render.value).toBe(true)
  })

  it('does not schedule again past the idle time', () => {
    const { closed } = create()
    closed.renderFormWhenIdle()
    runIdle()
    closed.renderFormWhenIdle()
    expect(requestIdle).toHaveBeenCalledTimes(1)
  })

  it('stops rendering for a form that is gone', () => {
    const { closed, needsForm } = create()
    closed.renderFormWhenIdle()
    runIdle()
    needsForm.value = false
    expect(closed.render.value).toBe(false)
  })

  it('the typeahead release keeps the form\'s items', () => {
    const { closed } = create({ items: false })
    closed.renderThen(() => {})
    closed.releaseTypeahead()
    expect(closed.render.value).toBe(true)
  })

  it('the typeahead holds the items until released', () => {
    const { closed } = create({ form: false })
    closed.renderThen(() => {})
    expect(closed.render.value).toBe(true)
    closed.releaseTypeahead()
    expect(closed.render.value).toBe(false)
  })

  it('dispose cancels the callback, and nothing renders afterwards', () => {
    const { closed } = create()
    closed.renderFormWhenIdle()
    closed.dispose()
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    runIdle()
    expect(closed.render.value).toBe(false)
  })

  it('can render nothing before the root is active', () => {
    const closed = new SelectClosedItems(() => true, () => true, () => false, undefined)
    expect(closed.canRender()).toBe(false)
    expect(closed.render.value).toBe(false)
    closed.activate()
    expect(closed.canRender()).toBe(true)
    expect(closed.render.value).toBe(true)
  })
})
