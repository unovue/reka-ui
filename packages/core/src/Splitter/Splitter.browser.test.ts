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

// A horizontal splitter and, stacked above the upper part of its handle, a layer such as a
// popover holding a text label and an SVG icon, both centred on the handle.
function mountCoveredSplitter() {
  const Fixture = defineComponent({
    setup() {
      return () => [
        h('div', { style: 'width: 400px; height: 200px;' }, [
          h(SplitterGroup, { direction: 'horizontal' }, () => [
            h(SplitterPanel, { defaultSize: 50 }, () => 'Left'),
            h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 4px;' }),
            h(SplitterPanel, { defaultSize: 50 }, () => 'Right'),
          ]),
        ]),
        h('div', {
          'data-testid': 'layer',
          'style': 'position: fixed; z-index: 10; width: 40px; height: 80px; background: white;',
        }, [
          h('span', { 'data-testid': 'label', 'style': 'position: absolute; top: 0; left: 0; width: 40px; height: 30px;' }, 'Text'),
          h('svg', { 'data-testid': 'icon', 'width': 24, 'height': 24, 'viewBox': '0 0 24 24', 'style': 'position: absolute; top: 50px; left: 8px;' }, [
            h('rect', { width: 24, height: 24, fill: 'currentColor' }),
          ]),
        ]),
      ]
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  unmount = () => wrapper.unmount()
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!

  // Centre the layer on the handle, over its upper part only.
  const handle = get('handle').getBoundingClientRect()
  const layer = get('layer')
  layer.style.left = `${handle.left + handle.width / 2 - 20}px`
  layer.style.top = `${handle.top + 10}px`
  return { get }
}

const globalCursor = () => getComputedStyle(document.body).cursor

describe('given a Splitter with a layer stacked above its resize handle, in a real browser', () => {
  it.each(['label', 'icon'])('ignores the pointer over the layer\'s %s', async (covering) => {
    const { get } = mountCoveredSplitter()

    // The uncovered part of the handle still takes the pointer.
    await userEvent.hover(get('handle'))
    await expect.poll(() => get('handle').getAttribute('data-state')).toBe('hover')
    expect(globalCursor()).toBe('ew-resize')

    await userEvent.hover(get(covering))
    await expect.poll(() => get('handle').getAttribute('data-state')).toBe('inactive')
    expect(globalCursor()).not.toBe('ew-resize')
  })
})

describe('given a Splitter in a shadow root inside an iframe, in a real browser', () => {
  it('takes the pointer over its resize handle', async () => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'width: 400px; height: 200px; border: 0;'
    document.body.appendChild(iframe)
    const frameDocument = iframe.contentDocument!
    const host = frameDocument.createElement('div')
    frameDocument.body.appendChild(host)
    const container = frameDocument.createElement('div')
    host.attachShadow({ mode: 'open' }).appendChild(container)

    const wrapper = mount(() => h(SplitterGroup, { direction: 'horizontal', style: 'height: 200px;' }, () => [
      h(SplitterPanel, { defaultSize: 50 }, () => 'Left'),
      h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 4px;' }),
      h(SplitterPanel, { defaultSize: 50 }, () => 'Right'),
    ]), { attachTo: container })
    unmount = () => {
      wrapper.unmount()
      iframe.remove()
    }

    // userEvent can't reach into an iframe, so dispatch the move from inside the shadow root.
    // The registry sees the event retargeted to the host, and comparing the host's stacking order
    // with the handle's must walk out of a shadow root that belongs to the iframe's realm.
    const handle = container.querySelector<HTMLElement>('[data-testid="handle"]')!
    const { left, top } = handle.getBoundingClientRect()
    handle.dispatchEvent(new frameDocument.defaultView!.MouseEvent('mousemove', {
      bubbles: true,
      composed: true,
      clientX: left + 1,
      clientY: top + 10,
    }))

    await expect.poll(() => handle.getAttribute('data-state')).toBe('hover')
  })
})
