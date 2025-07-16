import type { VueWrapper } from '@vue/test-utils'
import type vueuse from '@vueuse/core'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ConfigProviderTest from './_ConfigProvider.vue'

vi.mock('@vueuse/core', async (importOriginal) => {
  const mod: typeof vueuse = await importOriginal()
  const createSharedComposable: typeof vueuse.createSharedComposable = fn => fn

  return {
    ...mod,
    createSharedComposable,
  }
})

describe('given a default ConfigProvider', async () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  let wrapper: VueWrapper<InstanceType<typeof ConfigProviderTest>>
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 200 })
  Object.defineProperty(document, 'clientWidth', { writable: true, configurable: true, value: 190 })
  Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 190 })

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ConfigProviderTest, { attachTo: document.body })
  })

  it('it should render config provider, and all it\'s slot correctly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('should render direction="ltr"', () => {
    expect(document.body.innerHTML).toContain('dir="ltr"')
  })

  it('should add scrollBody\'s css to body', () => {
    expect(document.body.style.paddingRight).toBe('10px')
    expect(document.body.style.marginRight).toBe('0px')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.getPropertyValue('--scrollbar-width')).toBe('10px')
  })
})

describe('given a dir="rtl" ConfigProvider', async () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mount(ConfigProviderTest, { props: { dir: 'rtl' }, attachTo: document.body })
  })

  it('should render direction="rtl"', () => {
    expect(document.body.innerHTML).toContain('dir="rtl"')
  })
})

describe('given a scrollBody ConfigProvider', async () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should set 0 padding, 0 margin body', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: false }, attachTo: document.body })
    await nextTick()
    expect(document.body.style.paddingRight).toBe('0px')
    expect(document.body.style.marginRight).toBe('0px')
  })

  it('should set 0 padding body', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: { padding: 20 } }, attachTo: document.body })
    await nextTick()
    expect(document.body.style.paddingRight).toBe('20px')
    expect(document.body.style.marginRight).toBe('0px')
  })

  it('should set 0 margin body', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: { margin: 20, padding: 0 } }, attachTo: document.body })
    await nextTick()
    expect(document.body.style.paddingRight).toBe('0px')
    expect(document.body.style.marginRight).toBe('20px')
  })
})
