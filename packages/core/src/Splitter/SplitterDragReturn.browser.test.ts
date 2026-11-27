import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

// Needs real layout: the layout follows the pointer's distance from where the drag started.
describe('given a Splitter handle dragged away and back, in a real browser', () => {
  it('puts the handle back under the pointer when the pointer returns to where the drag started', async () => {
    const layout = ref<number[]>([])
    mount(defineComponent({
      setup() {
        return () => h('div', { style: 'width: 808px; height: 200px;' }, [
          h(SplitterGroup, { direction: 'horizontal', onLayout: (sizes: number[]) => layout.value = sizes }, () => [
            h(SplitterPanel, { id: 'left', defaultSize: 50, minSize: 20 }, () => 'Left'),
            h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 8px;' }),
            h(SplitterPanel, { id: 'right' }, () => 'Right'),
          ]),
        ])
      },
    }), { attachTo: document.body })
    const handle = document.querySelector<HTMLElement>('[data-testid="handle"]')!
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50')
    const start = handle.getBoundingClientRect()
    const x = start.left + start.width / 2
    const y = start.top + start.height / 2

    // One press: out by 100 px in steps, then back in steps, so the last move
    // lands exactly on the point where the drag started.
    const mouse = (type: string, clientX: number, buttons = 1) =>
      document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY: y, buttons }))
    mouse('mousemove', x, 0)
    mouse('mousedown', x)
    for (let step = 1; step <= 10; step++)
      mouse('mousemove', x - step * 10)
    await expect.poll(() => layout.value[0]).toBeLessThan(40)
    for (let step = 9; step >= 0; step--)
      mouse('mousemove', x - step * 10)

    await expect.poll(() => layout.value[0]).toBe(50)
    expect(handle.getBoundingClientRect().left).toBeCloseTo(start.left, 0)
    mouse('mouseup', x, 0)
  })
})
