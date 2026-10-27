import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, vShow, withDirectives } from 'vue'
import * as Reka from '../index'
import { useAvatar, useAvatarFallback, useAvatarImage } from './useAvatar'

class MockImage {
  static loadDelay = 20
  static last: MockImage | undefined
  referrerPolicy = ''
  crossOrigin: string | null = null
  /** The policies in force when `src` was set. */
  srcSetWith: { referrerPolicy: string, crossOrigin: string | null } | undefined
  _src = ''
  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value
    this.srcSetWith = { referrerPolicy: this.referrerPolicy, crossOrigin: this.crossOrigin }
  }

  complete = false
  naturalWidth = 0
  listeners: Record<string, Array<() => void>> = {}
  constructor() {
    MockImage.last = this
    setTimeout(() => {
      this.complete = true
      this.naturalWidth = 10
      this.listeners.load?.forEach(callback => callback())
    }, MockImage.loadDelay)
  }

  addEventListener(event: string, callback: () => void) {
    (this.listeners[event] ??= []).push(callback)
  }

  removeEventListener(event: string, callback: () => void) {
    this.listeners[event] = (this.listeners[event] ?? []).filter(cb => cb !== callback)
  }
}

const originalImage = window.Image
beforeEach(() => {
  MockImage.loadDelay = 20
  window.Image = MockImage as unknown as typeof Image
})
afterEach(() => {
  window.Image = originalImage
})

function mountStandalone(onLoadingStatusChange = vi.fn(), delayMs?: number, imageProps: Record<string, any> = {}) {
  return mount(defineComponent({
    setup() {
      const { imageLoadingStatus, context } = useAvatar()
      const image = useAvatarImage(context, { src: '/avatar.png', onLoadingStatusChange, ...imageProps })
      const fallback = useAvatarFallback(context, { delayMs })
      return () => h('span', { 'data-status': imageLoadingStatus.value }, [
        withDirectives(h('img', { ...image.root.attrs.value, alt: 'Avatar' }), [[vShow, image.visible.value]]),
        fallback.visible.value ? h('span', { class: 'fallback' }, 'AB') : null,
      ])
    },
  }), { attachTo: document.body })
}

describe('useAvatar', () => {
  it('renders standalone, swaps the fallback for the loaded image and passes axe', async () => {
    const onLoadingStatusChange = vi.fn()
    const wrapper = mountStandalone(onLoadingStatusChange)
    await nextTick()
    expect(wrapper.find('.fallback').exists()).toBe(true)
    expect(wrapper.find('img').attributes()).toMatchObject({ role: 'img', src: '/avatar.png' })
    expect(await axe(wrapper.element)).toHaveNoViolations()

    await vi.waitFor(() => expect(wrapper.attributes('data-status')).toBe('loaded'))
    await nextTick()
    expect(wrapper.find('.fallback').exists()).toBe(false)
    expect(wrapper.find('img').isVisible()).toBe(true)
    expect(onLoadingStatusChange.mock.calls.map(([status]) => status)).toEqual(['idle', 'loading', 'loaded'])
    wrapper.unmount()
  })

  it('delays the fallback by delayMs', async () => {
    MockImage.loadDelay = 500
    const wrapper = mountStandalone(vi.fn(), 10)
    await nextTick()
    expect(wrapper.find('.fallback').exists()).toBe(false)
    await vi.waitFor(() => expect(wrapper.find('.fallback').exists()).toBe(true))
    wrapper.unmount()
  })

  it('renders the fallback immediately with delayMs 0', async () => {
    MockImage.loadDelay = 500
    const wrapper = mountStandalone(vi.fn(), 0)
    await nextTick()
    expect(wrapper.find('.fallback').exists()).toBe(true)
    wrapper.unmount()
  })

  it('sets referrerPolicy and crossOrigin before src on the loading image', async () => {
    const wrapper = mountStandalone(vi.fn(), undefined, { referrerPolicy: 'no-referrer', crossOrigin: 'anonymous' })
    await nextTick()
    expect(MockImage.last!.srcSetWith).toEqual({ referrerPolicy: 'no-referrer', crossOrigin: 'anonymous' })
    wrapper.unmount()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useAvatar).toBe('function')
    expect(typeof Reka.useAvatarImage).toBe('function')
    expect(typeof Reka.useAvatarFallback).toBe('function')
  })
})
