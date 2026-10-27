import { mount } from '@vue/test-utils'
import { hideOthers } from 'aria-hidden'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useHideOthers } from './useHideOthers'

vi.mock('aria-hidden', () => ({ hideOthers: vi.fn() }))

const undos: Array<ReturnType<typeof vi.fn>> = []

beforeEach(() => {
  // `useHideOthers` is a no-op in test mode.
  vi.stubEnv('MODE', 'production')
  undos.length = 0
  vi.mocked(hideOthers).mockReset().mockImplementation(() => {
    const undo = vi.fn()
    undos.push(undo)
    return undo
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

function setup() {
  const target = ref<HTMLElement>()
  const wrapper = mount(defineComponent({
    setup() {
      useHideOthers(target)
      return () => h('div')
    },
  }), { attachTo: document.body })
  return { target, wrapper }
}

describe('useHideOthers', () => {
  it('runs each undo once: when the target goes away, not again on unmount', async () => {
    const { target, wrapper } = setup()
    target.value = document.createElement('div')
    await nextTick()
    expect(hideOthers).toHaveBeenCalledTimes(1)

    target.value = undefined
    await nextTick()
    expect(undos[0]).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(undos[0]).toHaveBeenCalledTimes(1)
  })

  it('releases the previous target before hiding around a new one', async () => {
    const { target, wrapper } = setup()
    target.value = document.createElement('div')
    await nextTick()
    target.value = document.createElement('div')
    await nextTick()
    expect(undos[0]).toHaveBeenCalledTimes(1)
    expect(hideOthers).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    expect(undos[0]).toHaveBeenCalledTimes(1)
    expect(undos[1]).toHaveBeenCalledTimes(1)
  })

  it('hides siblings in every shadow root around the target, then around the outermost host (#2725)', async () => {
    const outerHost = document.createElement('div')
    document.body.appendChild(outerHost)
    const outerRoot = outerHost.attachShadow({ mode: 'open' })
    const innerHost = document.createElement('div')
    outerRoot.appendChild(innerHost)
    const innerRoot = innerHost.attachShadow({ mode: 'open' })
    const element = document.createElement('div')
    innerRoot.appendChild(element)

    const { target, wrapper } = setup()
    target.value = element
    await nextTick()
    expect(vi.mocked(hideOthers).mock.calls).toEqual([
      [element, innerRoot],
      [innerHost, outerRoot],
      [outerHost],
    ])

    wrapper.unmount()
    expect(undos.every(undo => undo.mock.calls.length === 1)).toBe(true)
    outerHost.remove()
  })
})
