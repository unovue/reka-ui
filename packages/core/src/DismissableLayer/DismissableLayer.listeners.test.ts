import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
import { resetLayerStack } from './layerStack'

beforeEach(() => {
  resetLayerStack()
  document.body.innerHTML = ''
})
afterEach(() => resetLayerStack())

function mountLayers(n: number) {
  return mount(defineComponent({
    setup() {
      return () => h('div', Array.from({ length: n }, (_, i) => h(DismissableLayerPrimitive, { key: i, present: true })))
    },
  }), { attachTo: document.body })
}

function count(spy: ReturnType<typeof vi.spyOn>, kind: string) {
  return spy.mock.calls.filter(c => c[0] === kind).length
}

describe('dismissableLayer listener consolidation', () => {
  it('adds exactly one shared document pointerdown/focusin + one window keydown for many layers', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const winAdd = vi.spyOn(window, 'addEventListener')
    const wrapper = mountLayers(10)
    expect(count(add, 'pointerdown')).toBe(1)
    expect(count(add, 'focusin')).toBe(1)
    expect(count(winAdd, 'keydown')).toBe(1)
    add.mockRestore()
    winAdd.mockRestore()
    wrapper.unmount()
  })

  it('runs querySelectorAll once per outside pointerdown regardless of layer count', async () => {
    const wrapper = mountLayers(5)
    await new Promise(r => setTimeout(r, 0)) // let the subscribers arm
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    const qsa = vi.spyOn(document, 'querySelectorAll')
    await fireEvent.pointerDown(outside)
    expect(count(qsa as any, '[data-dismissable-layer]')).toBe(1)
    qsa.mockRestore()
    wrapper.unmount()
  })

  it('removes all shared listeners after every layer unmounts', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const winRemove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountLayers(3)
    wrapper.unmount()
    expect(count(remove, 'pointerdown')).toBe(1)
    expect(count(remove, 'focusin')).toBe(1)
    expect(count(winRemove, 'keydown')).toBe(1)
    remove.mockRestore()
    winRemove.mockRestore()
  })
})
