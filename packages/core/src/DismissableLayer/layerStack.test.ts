import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTopLayer, layers, registerOutsideSubscriber, registerStackLayer, resetLayerStack } from './layerStack'

afterEach(() => resetLayerStack())

function stackLayer(over = {}) {
  return { element: () => document.body, isPresent: () => true, disableOutsidePointerEvents: () => false, ...over }
}
function subscriber(over = {}) {
  return { armed: true, isPointerInside: false, isFocusInside: false, ...over }
}

describe('layerStack', () => {
  it('installs one pointerdown/focusin while subscribers exist and one keydown while stack layers exist', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const winAdd = vi.spyOn(window, 'addEventListener')
    registerStackLayer(stackLayer())
    registerOutsideSubscriber(subscriber())
    registerOutsideSubscriber(subscriber())
    expect(add.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(1)
    expect(add.mock.calls.filter(c => c[0] === 'focusin')).toHaveLength(1)
    expect(winAdd.mock.calls.filter(c => c[0] === 'keydown')).toHaveLength(1)
    add.mockRestore()
    winAdd.mockRestore()
  })

  it('an Editable-like subscriber (no stack layer) installs NO keydown listener', () => {
    const winAdd = vi.spyOn(window, 'addEventListener')
    registerOutsideSubscriber(subscriber())
    expect(winAdd.mock.calls.filter(c => c[0] === 'keydown')).toHaveLength(0)
    winAdd.mockRestore()
  })

  it('removes the pointerdown/focusin listeners when the last subscriber unregisters', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const off1 = registerOutsideSubscriber(subscriber())
    const off2 = registerOutsideSubscriber(subscriber())
    off1()
    expect(remove.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(0) // one left
    off2()
    expect(remove.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(1)
    remove.mockRestore()
  })

  it('maintains stack order and isTopLayer', () => {
    const a = stackLayer()
    const b = stackLayer()
    registerStackLayer(a)
    registerStackLayer(b)
    expect(layers[0]).toBe(a)
    expect(isTopLayer(b)).toBe(true)
    expect(isTopLayer(a)).toBe(false)
  })

  it('routes Escape only to the top present stack layer', () => {
    const bottom = stackLayer({ onEscapeKeyDown: vi.fn() })
    const top = stackLayer({ onEscapeKeyDown: vi.fn() })
    registerStackLayer(bottom)
    registerStackLayer(top)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(top.onEscapeKeyDown).toHaveBeenCalledOnce()
    expect(bottom.onEscapeKeyDown).not.toHaveBeenCalled()
  })

  it('arms a freshly-registered subscriber a macrotask later', async () => {
    const sub = subscriber({ armed: false })
    registerOutsideSubscriber(sub)
    expect(sub.armed).toBe(false)
    await new Promise(r => setTimeout(r, 0))
    expect(sub.armed).toBe(true)
  })
})
