import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'
import Splitter from './story/_Splitter.vue'

// Simple a11y test for now
describe('test splitter functionalities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(Splitter)
    await nextTick()
    expect(await axe(wrapper.element, {
      rules: {
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })
})

// Regression test for https://github.com/unovue/reka-ui/issues/2509
// Bug 1: nested sizeUnit="px" group ignores defaultSize due to a ResizeObserver
// timing issue where the inner group is measured before the outer group's flex
// layout completes, producing a near-zero container size at initialization.
describe('nested px SplitterGroup layout re-initialization (issue #2509)', () => {
  const resizeCallbacks: ResizeObserverCallback[] = []

  beforeEach(() => {
    resizeCallbacks.length = 0
    vi.stubGlobal('ResizeObserver', class MockResizeObserver {
      private callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
        resizeCallbacks.push(callback)
      }

      observe() {}
      unobserve() {}
      disconnect() {
        const idx = resizeCallbacks.indexOf(this.callback)
        if (idx !== -1)
          resizeCallbacks.splice(idx, 1)
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  function fireResize(width: number) {
    resizeCallbacks.forEach(cb =>
      cb(
        [{ contentRect: { width, height: 600 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    )
  }

  it('should re-initialize layout when container grows from a tiny initial size', async () => {
    // This component starts with no panels so we can fire a ResizeObserver callback
    // with a tiny size BEFORE the panels register — replicating the exact timing
    // that occurs with nested SplitterGroups in a browser.
    const showPanels = ref(false)

    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup() {
        return { showPanels }
      },
      template: `
        <SplitterGroup direction="horizontal">
          <template v-if="showPanels">
            <SplitterPanel id="sidebar" size-unit="px" :default-size="200" :min-size="100" />
            <SplitterResizeHandle />
            <SplitterPanel id="content" />
          </template>
        </SplitterGroup>
      `,
    })

    const wrapper = mount(TestComponent)
    const splitterGroup = wrapper.findComponent(SplitterGroup)

    // Simulate the inner group being measured while the outer group is still
    // laying out: container reports only 3.45px.
    fireResize(3.45)
    await nextTick()

    // Now panels mount — they register with groupSizeInPixels already = 3.45.
    // The panelDataArrayChanged watcher will initialize a wrong layout.
    showPanels.value = true
    await nextTick() // re-render + registerPanel calls
    await nextTick() // panelDataArrayChanged watcher fires (wrong layout)

    // Outer group finishes layout: container jumps to its real size.
    fireResize(923)
    await nextTick() // groupSizeInPixels watcher detects tiny initSize → triggers re-init
    await nextTick() // panelDataArrayChanged watcher fires with correct 923px size

    // The most recent 'layout' event should contain the sidebar at ~200px
    // (i.e. 200 / 923 * 100 ≈ 21.67% converted back to px) and the content
    // panel absorbing the remainder as a percentage.
    // emitted() wraps each call as [args], so emitted()[n][0] is the layout array.
    const events = splitterGroup.emitted('layout') as [number[]][]
    expect(events).toBeDefined()
    expect(events!.length).toBeGreaterThan(0)

    const lastLayout = events!.at(-1)![0]
    // Sidebar panel (px): should be close to its 200px defaultSize
    expect(lastLayout[0]).toBeCloseTo(200, 0)
    // Content panel (%): should occupy the bulk of the remaining space
    expect(lastLayout[1]).toBeGreaterThan(50)
  })
})
