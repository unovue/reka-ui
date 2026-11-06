import type { VueWrapper } from '@vue/test-utils'
import type { Direction } from './utils/types'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
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

describe('resize handle keyboard behavior after mounting into an existing group (issue #3160)', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  function mountSplitter({
    direction = 'horizontal',
    initiallyShown = true,
    withSecondHandle = false,
  }: {
    direction?: Direction
    initiallyShown?: boolean
    withSecondHandle?: boolean
  } = {}) {
    const shown = ref(initiallyShown)
    const disabled = ref(false)

    wrapper = mount(defineComponent({
      components: { SplitterGroup, SplitterPanel, SplitterResizeHandle },
      setup() {
        return { shown, disabled, direction, withSecondHandle }
      },
      template: `
        <SplitterGroup :direction="direction">
          <template v-if="shown">
            <SplitterPanel id="side" :order="0" :default-size="30" :min-size="10" />
            <SplitterResizeHandle id="handle" :disabled="disabled" />
          </template>
          <SplitterPanel id="main" :order="1" />
          <template v-if="withSecondHandle">
            <SplitterResizeHandle id="second-handle" />
            <SplitterPanel id="end" :order="2" :default-size="20" />
          </template>
        </SplitterGroup>
      `,
    }), { attachTo: document.body })

    return { shown, disabled }
  }

  function sideSize() {
    return Number(wrapper.get<HTMLElement>('#side').element.style.flexGrow)
  }

  it.each([
    { direction: 'horizontal', key: 'ArrowRight', expectedSize: 40 },
    { direction: 'horizontal', key: 'ArrowLeft', expectedSize: 20 },
    { direction: 'vertical', key: 'ArrowDown', expectedSize: 40 },
    { direction: 'vertical', key: 'ArrowUp', expectedSize: 20 },
    { direction: 'horizontal', key: 'Home', expectedSize: 10 },
    { direction: 'horizontal', key: 'End', expectedSize: 100 },
  ] as const)('should resize with $key in a $direction group before and after remounting', async ({ direction, key, expectedSize }) => {
    const { shown } = mountSplitter({ direction })
    await nextTick()
    const groupElement = wrapper.getComponent(SplitterGroup).element

    expect(sideSize()).toBe(30)
    wrapper.get<HTMLElement>('#handle').element.focus()
    await fireEvent.keyDown(wrapper.get('#handle').element, { key })
    expect(sideSize()).toBe(expectedSize)

    shown.value = false
    await nextTick()
    expect(wrapper.find('#handle').exists()).toBe(false)

    shown.value = true
    await nextTick()
    expect(wrapper.getComponent(SplitterGroup).element).toBe(groupElement)
    expect(sideSize()).toBe(30)
    wrapper.get<HTMLElement>('#handle').element.focus()
    await fireEvent.keyDown(wrapper.get('#handle').element, { key })
    expect(sideSize()).toBe(expectedSize)
  })

  it('should resize when the handle first mounts after the group', async () => {
    const { shown } = mountSplitter({ initiallyShown: false })
    await nextTick()
    expect(wrapper.find('#handle').exists()).toBe(false)

    shown.value = true
    await nextTick()
    wrapper.get<HTMLElement>('#handle').element.focus()
    await fireEvent.keyDown(wrapper.get('#handle').element, { key: 'ArrowRight' })
    expect(sideSize()).toBe(40)
  })

  it('should cycle focus with F6 and Shift+F6 after remounting', async () => {
    const { shown } = mountSplitter({ withSecondHandle: true })
    await nextTick()

    shown.value = false
    await nextTick()
    shown.value = true
    await nextTick()

    const handle = wrapper.get<HTMLElement>('#handle').element
    const secondHandle = wrapper.get<HTMLElement>('#second-handle').element
    handle.focus()

    await fireEvent.keyDown(handle, { key: 'F6' })
    expect(document.activeElement).toBe(secondHandle)
    await fireEvent.keyDown(secondHandle, { key: 'F6' })
    expect(document.activeElement).toBe(handle)
    await fireEvent.keyDown(handle, { key: 'F6', shiftKey: true })
    expect(document.activeElement).toBe(secondHandle)
  })

  it('should respect disabled changes after mounting into an existing group', async () => {
    const { shown, disabled } = mountSplitter({ initiallyShown: false })
    await nextTick()
    disabled.value = true
    shown.value = true
    await nextTick()

    const handle = wrapper.get<HTMLElement>('#handle').element
    handle.focus()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(sideSize()).toBe(30)

    disabled.value = false
    await nextTick()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(sideSize()).toBe(40)

    disabled.value = true
    await nextTick()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(sideSize()).toBe(40)

    disabled.value = false
    await nextTick()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(sideSize()).toBe(50)
  })
})
