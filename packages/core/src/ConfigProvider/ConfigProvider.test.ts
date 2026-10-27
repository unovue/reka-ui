import type { VueWrapper } from '@vue/test-utils'
import type vueuse from '@vueuse/core'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useId } from '@/shared'
import { resetBodyScrollLock } from '@/shared/useBodyScrollLock'
import ConfigProviderTest from './_ConfigProvider.vue'
import ConfigProvider from './ConfigProvider.vue'

vi.mock('@vueuse/core', async (importOriginal) => {
  const mod: typeof vueuse = await importOriginal()
  const createSharedComposable: typeof vueuse.createSharedComposable = fn => fn

  return {
    ...mod,
    createSharedComposable,
  }
})

function resetPageStyles() {
  resetBodyScrollLock()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
}

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

  beforeEach(async () => {
    document.body.innerHTML = ''
    resetPageStyles()
    wrapper = mount(ConfigProviderTest, { attachTo: document.body })
    // the scroll lock applies a macrotask after the mount flush, which can outlast a fixed sleep under load
    await vi.waitFor(() => expect(document.body.style.overflowY).toBe('hidden'))
  })

  it('it should render config provider, and all it\'s slot correctly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('should render direction="ltr"', () => {
    expect(document.body.innerHTML).toContain('dir="ltr"')
  })

  it('should lock page scroll without shifting the layout', () => {
    expect(document.body.style.overflowY).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    // No padding compensation, no inherited `--scrollbar-width` (#2822)
    expect(document.body.style.paddingRight).toBe('')
    expect(document.documentElement.style.getPropertyValue('--scrollbar-width')).toBe('')
    expect(document.body.style.pointerEvents).toBe('')
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
    resetPageStyles()
  })

  it('should only hide the overflow when scrollBody is false', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: false }, attachTo: document.body })
    await vi.waitFor(() => expect(document.body.style.overflowY).toBe('hidden'))
    expect(document.body.style.overflowY).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('')
    expect(document.body.style.paddingRight).toBe('')
    expect(document.body.style.marginRight).toBe('')
  })

  it('should set the given padding on body', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: { padding: 20 } }, attachTo: document.body })
    await vi.waitFor(() => expect(document.body.style.paddingRight).toBe('20px'))
    expect(document.body.style.paddingRight).toBe('20px')
    expect(document.body.style.marginRight).toBe('0px')
  })

  it('should set the given margin on body', async () => {
    mount(ConfigProviderTest, { props: { scrollBody: { margin: 20, padding: 0 } }, attachTo: document.body })
    await vi.waitFor(() => expect(document.body.style.marginRight).toBe('20px'))
    expect(document.body.style.paddingRight).toBe('0px')
    expect(document.body.style.marginRight).toBe('20px')
  })
})

describe('given a useId ConfigProvider', () => {
  it('uses the provided id generator before Vue useId', () => {
    const IdConsumer = defineComponent({
      setup() {
        const id = useId(undefined, 'reka-test')
        return () => h('div', { id })
      },
    })

    const wrapper = mount(ConfigProvider, {
      props: {
        useId: () => 'provided-id',
      },
      slots: {
        default: () => h(IdConsumer),
      },
    })

    expect(wrapper.find('#reka-test-provided-id').exists()).toBe(true)
  })
})
