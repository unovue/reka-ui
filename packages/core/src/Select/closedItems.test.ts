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

  describe('what the observer reacts to', () => {
    const flush = () => new Promise(resolve => setTimeout(resolve, 0))
    function createList() {
      const { closed } = create({ form: false })
      const fragment = document.createDocumentFragment()
      const list = document.createElement('div')
      fragment.appendChild(list)
      const syncs = new Map<string, ReturnType<typeof vi.fn>>()
      const items = ['a', 'b', 'c'].map((name) => {
        const element = document.createElement('div')
        const text = document.createElement('span')
        text.textContent = name
        element.appendChild(text)
        list.appendChild(element)
        const sync = vi.fn()
        syncs.set(name, sync)
        closed.observeText(text, sync)
        closed.addHarvested(() => ({ value: name, textValue: name }), () => element)
        return { element, text }
      })
      return { closed, list, items, syncs }
    }
    const called = (syncs: Map<string, ReturnType<typeof vi.fn>>) => [...syncs].filter(([, sync]) => sync.mock.calls.length).map(([name]) => name)

    it('unrelated churn: no version bump, no compare, no text sync', async () => {
      const { closed, list, items, syncs } = createList()
      await flush()
      const version = closed.version.value
      const compare = vi.spyOn(Node.prototype, 'compareDocumentPosition')
      const badge = document.createElement('b')
      items[1].element.appendChild(badge)
      await flush()
      badge.textContent = 'one'
      await flush()
      badge.remove()
      const counter = document.createElement('div')
      list.prepend(counter)
      await flush()
      counter.textContent = 'two'
      await flush()
      expect(closed.version.value).toBe(version)
      expect(compare).not.toHaveBeenCalled()
      expect(called(syncs)).toEqual([])
      compare.mockRestore()
    })

    it('a moved item bumps the version', async () => {
      const { closed, list, items } = createList()
      await flush()
      const version = closed.version.value
      list.prepend(items[2].element)
      await flush()
      expect(closed.version.value).toBeGreaterThan(version)
      expect(closed.getOrderedValues()).toEqual(['c', 'a', 'b'])
    })

    it('a moved node that holds an item bumps the version', async () => {
      const { closed, list, items } = createList()
      const wrapper = document.createElement('section')
      list.appendChild(wrapper)
      wrapper.appendChild(items[0].element)
      await flush()
      const version = closed.version.value
      list.prepend(wrapper)
      await flush()
      expect(closed.version.value).toBeGreaterThan(version)
    })

    it('a removed item that stays registered bumps the version', async () => {
      const { closed, items } = createList()
      await flush()
      const version = closed.version.value
      items[1].element.remove()
      await flush()
      expect(closed.version.value).toBeGreaterThan(version)
    })

    it('a text change syncs only that text', async () => {
      const { items, syncs } = createList()
      await flush()
      items[1].text.firstChild!.nodeValue = 'changed'
      await flush()
      expect(called(syncs)).toEqual(['b'])
      items[2].text.appendChild(document.createElement('i'))
      await flush()
      expect(called(syncs)).toEqual(['b', 'c'])
    })

    it('update follows an item\'s new element', async () => {
      const { closed } = create({ form: false })
      const list = document.createElement('div')
      document.createDocumentFragment().appendChild(list)
      let element: HTMLElement = document.createElement('div')
      list.appendChild(element)
      const harvested = closed.addHarvested(() => ({ value: 'a', textValue: 'a' }), () => element)
      const version = closed.version.value
      harvested.update()
      expect(closed.version.value).toBe(version)
      const replacement = document.createElement('section')
      element.replaceWith(replacement)
      element = replacement
      harvested.update()
      expect(closed.version.value).toBe(version + 1)
      await flush()
      const moved = closed.version.value
      list.prepend(document.createElement('p'))
      await flush()
      expect(closed.version.value).toBe(moved)
      const parent = document.createElement('div')
      list.appendChild(parent)
      parent.appendChild(replacement)
      await flush()
      expect(closed.version.value).toBeGreaterThan(moved)
    })
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
