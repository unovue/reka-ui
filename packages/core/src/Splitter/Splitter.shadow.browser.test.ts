import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

function mountSplitter() {
  const layout = ref<number[]>()
  const mounted = mountInShadowRoot(defineComponent({
    setup: () => () => h('div', { style: { width: '400px', height: '100px' } }, h(SplitterGroup, {
      'direction': 'horizontal',
      'layout': layout.value,
      'onUpdate:layout': (value: number[]) => { layout.value = value },
    }, () => [
      h(SplitterPanel, { 'id': 'a', 'minSize': 10, 'data-testid': 'a' }, () => 'A'),
      h(SplitterResizeHandle, { 'id': 'h', 'data-testid': 'handle', 'style': { width: '10px' } }),
      h(SplitterPanel, { 'id': 'b', 'data-testid': 'b' }, () => 'B'),
    ])),
  }))
  return { ...mounted, layout }
}

describe('given a SplitterGroup inside a shadow root, in a real browser', () => {
  // The resize listeners sit on `document.body`, where the event target is the
  // shadow host: the hit test must read the composed target.
  it('resizes with a pointer drag', async () => {
    const { get, layout } = mountSplitter()
    await expect.poll(() => layout.value).toEqual([50, 50])

    // `force`: the drag injects a global cursor style mid-gesture, which fails
    // Playwright's hit-target check on the drop target.
    await userEvent.dragAndDrop(get('handle')!, get('b')!, { force: true } as any)
    await expect.poll(() => layout.value![0]).toBeGreaterThan(60)
  })

  it('resizes with the keyboard', async () => {
    const { get, layout } = mountSplitter()
    await expect.poll(() => layout.value).toEqual([50, 50])

    get('handle')!.focus()
    await userEvent.keyboard('{Home}')
    await expect.poll(() => layout.value![0]).toBe(10)
  })
})
