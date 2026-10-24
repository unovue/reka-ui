import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cdp } from 'vitest/browser'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { useHideOthers } from './useHideOthers'

const backgrounds: WeakRef<HTMLElement>[] = []

function createBackground() {
  const element = document.createElement('div')
  document.body.append(element)
  const background = new WeakRef(element)
  backgrounds.push(background)
  return background
}

function mountTarget() {
  const target = shallowRef<HTMLElement>()
  const wrapper = mount(defineComponent({
    setup() {
      useHideOthers(target)
      return () => h('div')
    },
  }), { attachTo: document.body })

  if (!(wrapper.element instanceof HTMLElement))
    throw new TypeError('Expected an HTML target')
  target.value = wrapper.element
  return { target, wrapper }
}

describe('useHideOthers cleanup', () => {
  beforeEach(() => {
    // Exercise the real aria-hidden behavior, normally disabled in test mode.
    vi.stubEnv('MODE', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    backgrounds.splice(0).forEach(background => background.deref()?.remove())
  })

  it.each(['target cleared', 'unmounted'] as const)('releases background elements after %s', async (cleanup) => {
    const background = createBackground()
    const { target, wrapper } = mountTarget()
    await nextTick()
    expect(background.deref()?.getAttribute('aria-hidden')).toBe('true')

    if (cleanup === 'target cleared')
      target.value = undefined
    else
      wrapper.unmount()
    await nextTick()
    expect(background.deref()?.hasAttribute('aria-hidden')).toBe(false)

    background.deref()?.remove()
    // Cross a task boundary before collecting: deref() keeps its result alive
    // until the end of the current job. Keep the component wrapper alive, as
    // a persistent dialog context can retain a closed content instance.
    await new Promise(resolve => setTimeout(resolve, 0))
    await cdp().send('HeapProfiler.collectGarbage')
    expect(background.deref() === undefined).toBe(true)
    wrapper.unmount()
  })

  it('hides the background again when the target reopens', async () => {
    const background = createBackground()
    const { target, wrapper } = mountTarget()
    const element = target.value
    await nextTick()
    expect(background.deref()?.getAttribute('aria-hidden')).toBe('true')

    target.value = undefined
    await nextTick()
    expect(background.deref()?.hasAttribute('aria-hidden')).toBe(false)

    target.value = element
    await nextTick()
    expect(background.deref()?.getAttribute('aria-hidden')).toBe('true')

    wrapper.unmount()
    expect(background.deref()?.hasAttribute('aria-hidden')).toBe(false)
  })

  it('does not undo another active target when a closed owner unmounts', async () => {
    const background = createBackground()
    const first = mountTarget()
    await nextTick()
    const second = mountTarget()
    await nextTick()

    first.target.value = undefined
    await nextTick()
    expect(background.deref()?.getAttribute('aria-hidden')).toBe('true')

    first.wrapper.unmount()
    expect(background.deref()?.getAttribute('aria-hidden')).toBe('true')

    second.wrapper.unmount()
    expect(background.deref()?.hasAttribute('aria-hidden')).toBe(false)
  })
})
