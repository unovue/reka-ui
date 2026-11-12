import type { VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '.'

// Regression test for https://github.com/unovue/reka-ui/issues/3126
// A handle mounted into a group that is already in the page (e.g. with v-if)
// runs its keyboard-behavior effect during setup, before its element is in the
// DOM. The DOM lookup finds nothing and, because none of the effect's
// dependencies change afterwards, it never re-runs, so the keydown listener is
// never attached and arrow keys are ignored.
describe('resize handle keyboard behavior after remount (issue #3126)', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('should resize on arrow keys on a handle mounted after the group', async () => {
    const shown = ref(true)
    const layout = ref<number[]>([])

    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup() {
        return { shown, onLayout: (val: number[]) => { layout.value = val } }
      },
      template: `
        <SplitterGroup direction="horizontal" @layout="onLayout">
          <template v-if="shown">
            <SplitterPanel id="side" :order="1" :default-size="30" />
            <SplitterResizeHandle id="handle" />
          </template>
          <SplitterPanel id="main" :order="2" />
        </SplitterGroup>
      `,
    })

    wrapper = mount(TestComponent, { attachTo: document.body })
    await nextTick()

    // Remount the panel and handle (unmount, then mount again) while the group
    // itself stays in the page.
    shown.value = false
    await nextTick()
    shown.value = true
    await nextTick()

    const handle = wrapper.find('#handle')
    const before = handle.attributes('aria-valuenow')

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    handle.element.dispatchEvent(event)
    await nextTick()

    // The attached keydown handler calls preventDefault() for arrow keys...
    expect(event.defaultPrevented).toBe(true)
    // ...and actually resizes, so the layout changes and aria-valuenow follows.
    expect(layout.value).not.toEqual([])
    expect(handle.attributes('aria-valuenow')).not.toBe(before)
  })

  it('should collapse on Enter on a handle mounted alone after the group', async () => {
    const shown = ref(true)
    const layout = ref<number[]>([])

    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup() {
        return { shown, onLayout: (val: number[]) => { layout.value = val } }
      },
      // Only the handle is behind v-if; the panels stay mounted, so this
      // exercises the group-level effects re-running when a handle mounts alone.
      template: `
        <SplitterGroup direction="horizontal" @layout="onLayout">
          <SplitterPanel id="side" :order="1" :default-size="30" collapsible :min-size="10" />
          <SplitterResizeHandle v-if="shown" id="handle" />
          <SplitterPanel id="main" :order="2" />
        </SplitterGroup>
      `,
    })

    wrapper = mount(TestComponent, { attachTo: document.body })
    await nextTick()

    // Remount the handle alone while the group and its panels stay in the page.
    shown.value = false
    await nextTick()
    shown.value = true
    await nextTick()

    const handle = wrapper.find('#handle')
    // The group-level effect must have re-run and wired up aria on the new
    // handle element (it has no aria-controls until that effect runs).
    expect(handle.attributes('aria-controls')).toBe('side')

    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    handle.element.dispatchEvent(arrow)
    await nextTick()
    expect(arrow.defaultPrevented).toBe(true)

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    handle.element.dispatchEvent(enter)
    await nextTick()

    // Enter collapses the collapsible panel to its collapsed size (0 by default).
    expect(enter.defaultPrevented).toBe(true)
    expect(layout.value[0]).toBe(0)
    expect(handle.attributes('aria-valuenow')).toBe('0')
  })

  it('should not collapse on Enter on a disabled handle', async () => {
    const disabled = ref(true)
    const layout = ref<number[]>([])

    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup() {
        return { disabled, onLayout: (val: number[]) => { layout.value = val } }
      },
      template: `
        <SplitterGroup direction="horizontal" @layout="onLayout">
          <SplitterPanel id="side" :default-size="30" collapsible :min-size="10" />
          <SplitterResizeHandle id="handle" :disabled="disabled" />
          <SplitterPanel id="main" />
        </SplitterGroup>
      `,
    })

    wrapper = mount(TestComponent, { attachTo: document.body })
    await nextTick()

    const handle = wrapper.find('#handle')
    const pressEnter = async () => {
      handle.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
      await nextTick()
    }

    await pressEnter()
    expect(layout.value[0]).toBe(30)

    // Enabling the handle later makes Enter work again.
    disabled.value = false
    await nextTick()
    await pressEnter()
    expect(layout.value[0]).toBe(0)
  })
})

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

  // https://github.com/unovue/reka-ui/issues/2968
  it('should ignore trailing mousemove events targeting the iframe', async () => {
    mountSplitter()
    await nextTick()

    const handle = wrapper.find('#handle')
    const iframe = wrapper.find('#frame')

    await fireEvent.mouseMove(handle.element, { clientX: 0, clientY: 0 })
    await fireEvent.mouseOut(handle.element, { clientX: 0, clientY: 0, relatedTarget: iframe.element })
    expect(handle.attributes('data-state')).toBe('inactive')

    // The browser may still dispatch a mousemove targeting the iframe itself
    // after the mouseout; it lands in the hit area but must not restore hover.
    await fireEvent.mouseMove(iframe.element, { clientX: 0, clientY: 0 })
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

// One registry serves every document, so the handles of a splitter in an iframe and of one in
// the page are hit-tested together, although each reports its rect in its own viewport.
describe('resize handles in two documents', () => {
  const wrappers: VueWrapper[] = []

  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    document.body.innerHTML = ''
  })

  function mountSplitter(container: HTMLElement) {
    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      template: `
        <SplitterGroup direction="horizontal">
          <SplitterPanel class="panel" />
          <SplitterResizeHandle class="handle" />
          <SplitterPanel />
        </SplitterGroup>
      `,
    })
    const wrapper = mount(TestComponent, { attachTo: container })
    wrappers.push(wrapper)
    return wrapper
  }

  it('should leave a handle in another document out of hit testing', async () => {
    const page = mountSplitter(document.body)
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const framed = mountSplitter(iframe.contentDocument!.body)
    await nextTick()

    // jsdom reports a zero rect for every element, so (0, 0) falls within both handles' hit
    // areas; only the handle in the event's document may react. Comparing the stacking order
    // with the page's handle used to throw, so the iframe's own handle never took the pointer.
    await fireEvent.mouseMove(framed.find('.panel').element, { clientX: 0, clientY: 0 })

    expect(framed.find('.handle').attributes('data-state')).toBe('hover')
    expect(page.find('.handle').attributes('data-state')).toBe('inactive')
  })
})

describe('resize handle focus', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  function mountSplitter(disabled: boolean[]) {
    const TestComponent = defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup: () => ({ disabled }),
      template: `
        <SplitterGroup direction="horizontal">
          <template v-for="(isDisabled, index) in disabled" :key="index">
            <SplitterPanel />
            <SplitterResizeHandle :id="'handle-' + index" :disabled="isDisabled" />
          </template>
          <SplitterPanel />
        </SplitterGroup>
      `,
    })
    wrapper = mount(TestComponent, { attachTo: document.body })
    return (index: number) => document.getElementById(`handle-${index}`)!
  }

  function pressF6(element: HTMLElement, shiftKey = false) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', shiftKey, bubbles: true, cancelable: true }))
  }

  it('should skip a disabled handle on F6 and Shift+F6', async () => {
    const handle = mountSplitter([false, true, false])
    await nextTick()

    handle(0).focus()
    pressF6(handle(0))
    expect(document.activeElement).toBe(handle(2))

    pressF6(handle(2), true)
    expect(document.activeElement).toBe(handle(0))

    // Wraps around past the disabled handle as well.
    pressF6(handle(0), true)
    expect(document.activeElement).toBe(handle(2))
  })

  it('should move focus from a disabled handle to an enabled one on F6, without resizing on arrow keys', async () => {
    const handle = mountSplitter([false, true, false])
    await nextTick()

    handle(1).focus()
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    handle(1).dispatchEvent(arrow)
    expect(arrow.defaultPrevented).toBe(false)

    pressF6(handle(1))
    expect(document.activeElement).toBe(handle(2))

    handle(1).focus()
    pressF6(handle(1), true)
    expect(document.activeElement).toBe(handle(0))
  })

  it('should keep focus on F6 when every other handle is disabled', async () => {
    const handle = mountSplitter([false, true])
    await nextTick()

    handle(0).focus()
    pressF6(handle(0))
    expect(document.activeElement).toBe(handle(0))
  })

  it('should mark a focused handle as keyboard-active', async () => {
    const handle = mountSplitter([false])
    await nextTick()

    expect(handle(0).hasAttribute('data-resize-handle-active')).toBe(false)

    handle(0).focus()
    await nextTick()
    expect(handle(0).getAttribute('data-resize-handle-active')).toBe('keyboard')

    handle(0).blur()
    await nextTick()
    expect(handle(0).hasAttribute('data-resize-handle-active')).toBe(false)
  })
})
