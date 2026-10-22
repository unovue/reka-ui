import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import ConfigProvider from '@/ConfigProvider/ConfigProvider.vue'
import { useId } from './useId'

describe('useId', () => {
  it('returns an explicit ID without calling the configured generator', () => {
    const generateId = vi.fn(() => 'configured-id')
    const Consumer = defineComponent({
      setup() {
        const id = useId('explicit-id', 'custom')
        return () => h('div', { id })
      },
    })
    const wrapper = mount(ConfigProvider, {
      props: { useId: generateId },
      slots: { default: () => h(Consumer) },
    })

    expect(wrapper.get('div').attributes('id')).toBe('explicit-id')
    expect(generateId).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses the configured generator with default, custom, and empty prefixes', () => {
    const generateId = vi.fn(() => 'configured-id')
    const ids: string[] = []
    const Consumer = defineComponent({
      setup() {
        ids.push(useId(), useId(null, 'custom'), useId(undefined, ''))
        return () => null
      },
    })
    const wrapper = mount(ConfigProvider, {
      props: { useId: generateId },
      slots: { default: () => h(Consumer) },
    })

    expect(ids).toEqual(['reka-configured-id', 'custom-configured-id', 'configured-id'])
    expect(generateId).toHaveBeenCalledTimes(3)
    wrapper.unmount()
  })

  it('uses native Vue IDs and respects the app ID prefix', () => {
    const ids: string[] = []
    const Consumer = defineComponent({
      setup() {
        ids.push(useId(), useId('', 'custom'), useId(undefined, ''))
        return () => null
      },
    })
    const wrapper = mount(Consumer, {
      global: { config: { idPrefix: 'native' } },
    })

    expect(ids[0]).toMatch(/^reka-native-/)
    expect(ids[1]).toMatch(/^custom-native-/)
    expect(ids[2]).toMatch(/^native-/)
    expect(new Set(ids.map(id => id.replace(/^(reka|custom)-/, ''))).size).toBe(3)
    wrapper.unmount()
  })

  it('keeps native IDs unique and stable during SSR hydration', async () => {
    const Consumer = defineComponent({
      setup() {
        const id = useId()
        return () => h('div', [
          h('label', { for: id }, 'Name'),
          h('input', { id }),
        ])
      },
    })
    const App = defineComponent({
      setup: () => () => h('main', [h(Consumer), h(Consumer)]),
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(App))
    const serverIds = Array.from(container.querySelectorAll('input'), input => input.id)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const clientApp = createSSRApp(App)

    try {
      clientApp.mount(container)

      const clientIds = Array.from(container.querySelectorAll('input'), input => input.id)
      const labelTargets = Array.from(container.querySelectorAll('label'), label => label.htmlFor)
      expect(new Set(serverIds).size).toBe(2)
      expect(clientIds).toEqual(serverIds)
      expect(labelTargets).toEqual(clientIds)
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    }
    finally {
      clientApp.unmount()
      warn.mockRestore()
      error.mockRestore()
    }
  })
})
