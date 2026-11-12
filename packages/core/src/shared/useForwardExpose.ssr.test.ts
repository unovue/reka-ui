// @vitest-environment node
import type { ComponentInternalInstance } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, getCurrentInstance, h } from 'vue'
import { useForwardExpose } from './useForwardExpose'

describe('given useForwardExpose rendered on the server', () => {
  it('does not build `exposed`', async () => {
    let instance: ComponentInternalInstance | null = null
    const comp = defineComponent({
      props: { foo: String, bar: Number },
      setup() {
        const { forwardRef } = useForwardExpose()
        instance = getCurrentInstance()
        return () => h('div', { ref: forwardRef }, 'content')
      },
    })

    const html = await renderToString(createSSRApp({ render: () => h(comp, { foo: 'a', bar: 1 }) }))

    expect(html).toBe('<div>content</div>')
    expect(instance!.exposed).toBeNull()
  })

  it('keeps values exposed before it', async () => {
    let instance: ComponentInternalInstance | null = null
    const comp = defineComponent({
      setup(_, { expose }) {
        expose({ focus: () => {} })
        const { forwardRef } = useForwardExpose()
        instance = getCurrentInstance()
        return () => h('div', { ref: forwardRef })
      },
    })

    await renderToString(createSSRApp({ render: () => h(comp) }))

    expect(Object.keys(instance!.exposed!)).toEqual(['focus'])
  })
})
