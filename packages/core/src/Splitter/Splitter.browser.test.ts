import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

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
  mount(Fixture, { attachTo: document.body })
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

    mount(() => h(SplitterGroup, { direction: 'horizontal', style: 'height: 200px;' }, () => [
      h(SplitterPanel, { defaultSize: 50 }, () => 'Left'),
      h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 4px;' }),
      h(SplitterPanel, { defaultSize: 50 }, () => 'Right'),
    ]), { attachTo: container })

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

describe('given a Splitter with a disabled resize handle between two enabled ones, in a real browser', () => {
  it('moves focus past the disabled handle with F6 and Shift+F6', async () => {
    document.body.innerHTML = ''
    mount(() => h('div', { style: 'width: 400px; height: 200px;' }, [
      h(SplitterGroup, { direction: 'horizontal' }, () => [0, 1, 2].flatMap(index => [
        h(SplitterPanel),
        h(SplitterResizeHandle, { 'data-testid': `handle-${index}`, 'disabled': index === 1, 'style': 'width: 4px;' }),
      ]).concat(h(SplitterPanel))),
    ]), { attachTo: document.body })
    await nextTick()
    const handle = (index: number) => document.querySelector<HTMLElement>(`[data-testid="handle-${index}"]`)!

    await userEvent.tab()
    expect(document.activeElement).toBe(handle(0))
    await expect.poll(() => handle(0).getAttribute('data-resize-handle-active')).toBe('keyboard')

    await userEvent.keyboard('{F6}')
    expect(document.activeElement).toBe(handle(2))
    await expect.poll(() => handle(2).getAttribute('data-resize-handle-active')).toBe('keyboard')
    expect(handle(0).hasAttribute('data-resize-handle-active')).toBe(false)

    await userEvent.keyboard('{Shift>}{F6}{/Shift}')
    expect(document.activeElement).toBe(handle(0))
  })
})

// https://github.com/unovue/reka-ui/issues/3126
describe('given a Splitter whose resize handle is remounted with v-if, in a real browser', () => {
  it.each([
    ['with its panel', true],
    ['on its own', false],
  ])('resizes from the keyboard after the handle is remounted %s', async (_, withPanel) => {
    document.body.innerHTML = ''
    const shown = ref(true)
    const layout = ref<number[]>([])
    const panel = () => h(SplitterPanel, { id: 'side', order: 1, defaultSize: 30, collapsible: true, minSize: 10 })
    const handle = () => h(SplitterResizeHandle, { 'data-testid': 'handle', 'style': 'width: 4px;' })
    mount(() => h('div', { style: 'width: 400px; height: 200px;' }, [
      h(SplitterGroup, { direction: 'horizontal', onLayout: (value: number[]) => { layout.value = value } }, () => [
        ...(withPanel
          ? (shown.value ? [panel(), handle()] : [])
          : [panel(), shown.value ? handle() : null]),
        h(SplitterPanel, { id: 'main', order: 2 }),
      ]),
    ]), { attachTo: document.body })
    await nextTick()

    shown.value = false
    await nextTick()
    shown.value = true
    await nextTick()

    await userEvent.tab()
    const el = document.querySelector<HTMLElement>('[data-testid="handle"]')!
    expect(document.activeElement).toBe(el)

    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => layout.value[0]).toBe(40)
    expect(el.getAttribute('aria-valuenow')).toBe('40')

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => layout.value[0]).toBe(0)
  })
})
