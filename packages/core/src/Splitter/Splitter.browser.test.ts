import type { ChangeEventDetails } from '@/shared'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
})

function mountSplitter(panelA: Record<string, any>, model = ref<number[]>()) {
  const onUpdate = vi.fn((value: number[], _details?: ChangeEventDetails) => {
    model.value = value
  })
  const Test = defineComponent({
    setup() {
      return () => h('div', { style: { width: '400px', height: '100px' } }, h(SplitterGroup, {
        'direction': 'horizontal',
        'layout': model.value,
        'onUpdate:layout': onUpdate,
      }, () => [
        h(SplitterPanel, { id: 'a', ...panelA }, () => 'A'),
        h(SplitterResizeHandle, { id: 'h', style: { width: '10px' } }),
        h(SplitterPanel, { id: 'b' }, () => 'B'),
      ]))
    },
  })
  const wrapper = mount(Test, { attachTo: document.body })
  unmount = () => wrapper.unmount()
  return { model, onUpdate }
}

const width = (id: string) => document.getElementById(id)!.getBoundingClientRect().width
const panelSize = (id: string) => Number(document.getElementById(id)!.getAttribute('data-panel-size'))

describe('given a SplitterGroup in a real browser', () => {
  it('reports a pointer drag as `drag` with the mouse event', async () => {
    const { model, onUpdate } = mountSplitter({ minSize: 10 })
    await expect.poll(() => model.value).toEqual([50, 50])

    // `force`: the drag injects a global cursor style mid-gesture, which fails
    // Playwright's hit-target check on the drop target.
    await userEvent.dragAndDrop(document.getElementById('h')!, document.getElementById('b')!, { force: true } as any)

    await expect.poll(() => model.value![0]).toBeGreaterThan(60)
    const details = onUpdate.mock.calls.at(-1)![1]!
    expect(details.reason).toBe('drag')
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(width('a')).toBeGreaterThan(width('b'))
  })

  it('keeps the model in px for a px panel through a controlled round-trip', async () => {
    const { model } = mountSplitter({ sizeUnit: 'px', defaultSize: 100, minSize: 50 })
    // Panel sizes are a share of the whole 400px group, handle included.
    await expect.poll(() => model.value?.[0]).toBeCloseTo(100, 0)
    expect(panelSize('a')).toBe(25)

    document.getElementById('h')!.focus()
    await userEvent.keyboard('{ArrowRight}')
    // keyboardResizeBy is 10% of the 400px group.
    await expect.poll(() => model.value?.[0]).toBeCloseTo(140, 0)
    await expect.poll(() => panelSize('a')).toBe(35)

    // 200px of 400px plus the % panel's 50 fills the group.
    model.value = [200, 50]
    await expect.poll(() => panelSize('a')).toBe(50)
  })
})
