import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

function mountSplitter(defaultSize = 50) {
  const layout = ref<number[]>([])
  const panel = ref<{ collapse: () => void, expand: () => void }>()
  mount(defineComponent({
    setup() {
      return () => h('div', { style: 'width: 800px; height: 200px;' }, [
        h(SplitterGroup, { direction: 'horizontal', onLayout: (sizes: number[]) => layout.value = sizes }, () => [
          h(SplitterPanel, { ref: panel, id: 'left', defaultSize, minSize: 20, maxSize: 80, collapsible: true, collapsedSize: 0 }, () => 'Left'),
          h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 8px;' }),
          h(SplitterPanel, { id: 'right' }, () => 'Right'),
        ]),
      ])
    },
  }), { attachTo: document.body })
  return { layout, panel }
}

async function focusHandle() {
  const handle = document.querySelector<HTMLElement>('[data-testid="handle"]')!
  await expect.poll(() => handle.getAttribute('aria-valuenow')).toBeTruthy()
  handle.focus()
  return handle
}

describe('given a Splitter with a collapsible panel, in a real browser', () => {
  it('restores the size the panel had when Enter expands it again', async () => {
    const { layout } = mountSplitter()
    const handle = await focusHandle()

    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => layout.value[0]).toBe(60)

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(0)

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(60)
    expect(handle.getAttribute('aria-valuenow')).toBe('60')
  })

  it('shares the remembered size between Enter and the collapse and expand methods', async () => {
    const { layout, panel } = mountSplitter()
    await focusHandle()

    panel.value!.collapse()
    await expect.poll(() => layout.value[0]).toBe(0)
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(50)

    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(() => layout.value[0]).toBe(40)
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(0)
    panel.value!.expand()
    await expect.poll(() => layout.value[0]).toBe(40)
  })

  it('expands a panel that started collapsed to its minimum size', async () => {
    const { layout } = mountSplitter(0)
    await focusHandle()

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(20)
  })
})
