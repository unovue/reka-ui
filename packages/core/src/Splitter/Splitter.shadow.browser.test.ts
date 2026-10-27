import type { Ref, VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

function splitter(layout: Ref<number[] | undefined>, handleSlot?: () => VNode) {
  return h(SplitterGroup, {
    'direction': 'horizontal',
    'layout': layout.value,
    'onUpdate:layout': (value: number[]) => { layout.value = value },
  }, () => [
    h(SplitterPanel, { 'id': 'a', 'minSize': 10, 'data-testid': 'a' }, () => 'A'),
    h(SplitterResizeHandle, { 'id': 'h', 'data-testid': 'handle', 'style': { width: '10px', display: 'block' } }, handleSlot),
    h(SplitterPanel, { 'id': 'b', 'data-testid': 'b' }, () => 'B'),
  ])
}

function mountSplitter() {
  const layout = ref<number[]>()
  const mounted = mountInShadowRoot(defineComponent({
    setup: () => () => h('div', { style: { width: '400px', height: '100px' } }, splitter(layout)),
  }))
  return { ...mounted, layout }
}

// A grip icon as a web component: the press lands inside its shadow root.
if (!customElements.get('x-splitter-grip')) {
  customElements.define('x-splitter-grip', class extends HTMLElement {
    constructor() {
      super()
      const inner = document.createElement('span')
      inner.setAttribute('data-inner', '')
      inner.style.cssText = 'display: block; width: 10px; height: 100px;'
      this.attachShadow({ mode: 'open' }).append(inner)
    }
  })
}

/** Lets the pointer handlers and the layout emit settle (no fixed sleep). */
async function settle() {
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await nextTick()
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

describe('given a SplitterGroup whose hit test sees a composed target, in a real browser', () => {
  // The hit test used to see the shadow host, which contains the handle, so a
  // press on anything inside the root started a drag.
  it('does not start a drag from an element in the same shadow root that overlays the handle', async () => {
    const layout = ref<number[]>()
    const { get } = mountInShadowRoot(defineComponent({
      setup: () => () => h('div', { style: { position: 'relative', width: '400px', height: '100px' } }, [
        splitter(layout),
        h('div', { 'data-testid': 'overlay', 'style': 'position: absolute; inset: 0 150px; z-index: 1; background: white' }),
      ]),
    }))
    await expect.poll(() => layout.value).toEqual([50, 50])

    await userEvent.dragAndDrop(get('overlay')!, get('b')!, { force: true } as any)
    await settle()
    expect(layout.value).toEqual([50, 50])
  })

  it('drags from inside a web component in a light-DOM handle', async () => {
    const layout = ref<number[]>()
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', { style: { width: '400px', height: '100px' } }, splitter(layout, () => h('x-splitter-grip', { style: 'display: block' }))),
    }), { attachTo: document.body })
    onTestFinished(() => wrapper.unmount())
    await expect.poll(() => layout.value).toEqual([50, 50])

    const inner = document.querySelector('x-splitter-grip')!.shadowRoot!.querySelector<HTMLElement>('[data-inner]')!
    await userEvent.dragAndDrop(inner, wrapper.find('[data-testid="b"]').element as HTMLElement, { force: true } as any)
    await expect.poll(() => layout.value![0]).toBeGreaterThan(60)
  })
})
