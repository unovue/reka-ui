import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import ConfigProvider from '@/ConfigProvider/ConfigProvider.vue'
import SelectContent from './SelectContent.vue'
import SelectItem from './SelectItem.vue'
import SelectItemText from './SelectItemText.vue'
import SelectRoot from './SelectRoot.vue'
import SelectViewport from './SelectViewport.vue'

// SelectItemAlignedPosition (Select's default `position="item-aligned"`) serializes its
// wrapper/content positioning styles during SSR. Under `cspSafePositioning` these must be
// withheld so a strict `style-src` finds no inline style attribute to block. See issue #2732.
function tree(configProps: Record<string, unknown> = {}) {
  return h(ConfigProvider, configProps, {
    default: () =>
      h(SelectRoot, { open: true, modelValue: 'Apple' }, {
        default: () =>
          h(SelectContent, { forceMount: true }, {
            default: () =>
              h(SelectViewport, null, {
                default: () => h(SelectItem, { value: 'Apple' }, {
                  default: () => h(SelectItemText, null, { default: () => 'Apple' }),
                }),
              }),
          }),
      }),
  })
}

describe('selectItemAlignedPosition CSP-safe positioning (issue #2732)', () => {
  it('emits the positioning style attribute by default (unchanged behavior)', async () => {
    const html = await renderToString(createSSRApp({ render: () => tree() }))
    expect(html).toMatch(/position:\s*fixed/)
  })

  it('omits positioning style attributes during SSR when cspSafePositioning is enabled', async () => {
    const html = await renderToString(createSSRApp({ render: () => tree({ cspSafePositioning: true }) }))
    expect(html).not.toMatch(/position:\s*fixed/)
    expect(html).not.toMatch(/box-sizing/)
  })
})
