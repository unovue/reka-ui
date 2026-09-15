import type { VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

// Regression test for https://github.com/unovue/reka-ui/issues/2893
// Once the pointer enters an iframe the parent document stops receiving
// mousemove events, so the handle's hover state was never cleared.
describe('resize handle hover state next to an iframe (issue #2893)', () => {
  let wrapper: VueWrapper

  // Unmount so the handle unregisters its document-level listeners, otherwise
  // a detached handle would leak into the next test.
  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  function mountSplitter() {
    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      template: `
        <SplitterGroup direction="horizontal">
          <SplitterPanel id="left">
            <iframe id="frame" />
          </SplitterPanel>
          <SplitterResizeHandle id="handle" />
          <SplitterPanel id="right" />
        </SplitterGroup>
      `,
    })

    wrapper = mount(TestComponent, { attachTo: document.body })
  }

  it('should reset the handle to inactive when the pointer moves into an iframe', async () => {
    mountSplitter()
    await nextTick()

    const handle = wrapper.find('#handle')
    const iframe = wrapper.find('#frame')
    expect(handle.attributes('data-state')).toBe('inactive')

    // jsdom reports a zero rect for every element, so (0, 0) lands inside the
    // handle's hit area and puts it into the hover state.
    await fireEvent.mouseMove(handle.element, { clientX: 0, clientY: 0 })
    expect(handle.attributes('data-state')).toBe('hover')

    // Moving into the iframe only yields a mouseout on the handle; no further
    // mousemove reaches the parent document.
    await fireEvent.mouseOut(handle.element, { clientX: 0, clientY: 0, relatedTarget: iframe.element })
    expect(handle.attributes('data-state')).toBe('inactive')
  })

  it('should keep the hover state on mouseout to a regular element', async () => {
    mountSplitter()
    await nextTick()

    const handle = wrapper.find('#handle')
    const right = wrapper.find('#right')

    await fireEvent.mouseMove(handle.element, { clientX: 0, clientY: 0 })
    expect(handle.attributes('data-state')).toBe('hover')

    // A mouseout to a regular element is followed by mousemove events, which
    // keep managing the hover state, so mouseout alone must not reset it.
    await fireEvent.mouseOut(handle.element, { clientX: 0, clientY: 0, relatedTarget: right.element })
    expect(handle.attributes('data-state')).toBe('hover')
  })

  it('should not interrupt a drag when the pointer passes over an iframe', async () => {
    mountSplitter()
    await nextTick()

    const handle = wrapper.find('#handle')
    const iframe = wrapper.find('#frame')

    await fireEvent.mouseMove(handle.element, { clientX: 0, clientY: 0 })
    await fireEvent.mouseDown(handle.element, { clientX: 0, clientY: 0 })
    expect(handle.attributes('data-state')).toBe('drag')

    await fireEvent.mouseOut(handle.element, { clientX: 0, clientY: 0, relatedTarget: iframe.element })
    expect(handle.attributes('data-state')).toBe('drag')

    await fireEvent.mouseUp(window, { clientX: 0, clientY: 0 })
    expect(handle.attributes('data-state')).toBe('hover')
  })
})
