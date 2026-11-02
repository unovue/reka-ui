import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
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
