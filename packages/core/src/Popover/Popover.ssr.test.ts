import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, onMounted, ref } from 'vue'
import * as Popover from '.'

function createPopoverFixture({ PopoverContent, PopoverRoot, PopoverTrigger }: typeof Popover, open = ref(true), onContentMounted = () => {}) {
  const Content = defineComponent({
    setup() {
      onMounted(onContentMounted)
      return () => h('p', { 'data-testid': 'content' }, 'Popover content')
    },
  })

  return defineComponent({
    setup() {
      return () => h(PopoverRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(PopoverTrigger, () => 'Trigger'),
        h(PopoverContent, () => h(Content)),
      ])
    },
  })
}

afterEach(() => {
  vi.doUnmock('./PopoverContentNonModal.vue')
  document.body.innerHTML = ''
})

describe('given a Popover that is open in the SSR render', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  it('should keep the server content in place and hydrate it once the content loads', async () => {
    const html = await renderToString(createSSRApp(createPopoverFixture(Popover)))
    expect(html).toContain('Popover content')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const serverContent = container.querySelector('[data-testid="content"]')

    let releaseContent!: () => void
    const contentGate = new Promise<void>((resolve) => {
      releaseContent = resolve
    })
    vi.resetModules()
    vi.doMock('./PopoverContentNonModal.vue', async (importOriginal) => {
      await contentGate
      return importOriginal()
    })
    const ClientPopover = await import('.')

    const warn = vi.fn()
    const onContentMounted = vi.fn()
    const open = ref(true)
    const app = createSSRApp(createPopoverFixture(ClientPopover, open, onContentMounted))
    app.config.warnHandler = warn
    app.mount(container)
    await flushPromises()

    expect(onContentMounted).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="content"]')).toBe(serverContent)

    releaseContent()
    await vi.waitFor(() => expect(onContentMounted).toHaveBeenCalledOnce())
    expect(container.querySelector('[data-testid="content"]')).toBe(serverContent)
    expect(warn).not.toHaveBeenCalled()

    open.value = false
    await vi.waitFor(() => expect(container.querySelector('[data-testid="content"]')).toBeNull())

    app.unmount()
  })
})
