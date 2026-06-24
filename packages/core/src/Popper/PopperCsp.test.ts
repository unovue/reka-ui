import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import ConfigProvider from '@/ConfigProvider/ConfigProvider.vue'
import PopperAnchor from './PopperAnchor.vue'
import PopperArrow from './PopperArrow.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'

function tree(configProps: Record<string, unknown> = {}) {
  return h(ConfigProvider, configProps, {
    default: () =>
      h(PopperRoot, null, {
        default: () => [
          h(PopperAnchor, null, { default: () => 'anchor' }),
          h(PopperContent, null, { default: () => ['content', h(PopperArrow)] }),
        ],
      }),
  })
}

describe('popperContent CSP-safe positioning (issue #2732)', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  describe('sSR output', () => {
    it('emits the positioning style attribute by default (unchanged behavior)', async () => {
      const app = createSSRApp({ render: () => tree() })
      const html = await renderToString(app)

      expect(html).toMatch(/data-reka-popper-content-wrapper[^>]*style="[^"]*position:fixed/)
      expect(html).toContain('transform:')
    })

    it('omits positioning style attributes during SSR when cspSafePositioning is enabled', async () => {
      const app = createSSRApp({ render: () => tree({ cspSafePositioning: true }) })
      const html = await renderToString(app)

      // Not even an empty `style=""` may be serialized — its mere presence triggers a
      // `style-src-attr` violation. The whole popper subtree must be style-attribute-free.
      expect(html).toContain('data-reka-popper-content-wrapper')
      expect(html).not.toContain('style=')
    })
  })

  describe('client output', () => {
    it('applies the positioning style after mount when cspSafePositioning is enabled', async () => {
      const wrapper = mount(defineComponent({ render: () => tree({ cspSafePositioning: true }) }), {
        attachTo: document.body,
      })
      await nextTick()
      await nextTick()

      const el = wrapper.find('[data-reka-popper-content-wrapper]')
      expect(el.attributes('style')).toContain('position: fixed')
    })

    it('does not change default client output', async () => {
      const wrapper = mount(defineComponent({ render: () => tree() }), {
        attachTo: document.body,
      })
      await nextTick()

      const el = wrapper.find('[data-reka-popper-content-wrapper]')
      expect(el.attributes('style')).toContain('position: fixed')
    })
  })
})
