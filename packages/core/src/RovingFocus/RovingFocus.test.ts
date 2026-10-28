import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, Teleport } from 'vue'
import { RovingFocusGroup, RovingFocusItem } from '.'
import Button from './story/_Button.vue'
import ButtonGroup from './story/_ButtonGroup.vue'

const ButtonsTemplate = `
  <Button value="one">
    One
  </Button>
  <Button value="two">
    Two
  </Button>
  <Button disabled value="three">
    Three
  </Button>
  <Button value="four">
    Four
  </Button>
`

describe('test RovingFocus functionalities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  it('should only receive focus once, and select first item', async () => {
    const wrapper = mount(ButtonGroup, {
      global: {
        stubs: { Button },
      },
      slots: {
        default: {
          template: ButtonsTemplate,
        },
      },
      attachTo: document.body,
    })
    const buttons = wrapper.findAll('button')

    expect(document.activeElement).toBe(document.body)
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0].element)
    await userEvent.tab()
    expect(document.activeElement).toBe(document.body)
  })

  it('should have default selected value based on `defaultValue`', async () => {
    const wrapper = mount(ButtonGroup, {
      global: {
        stubs: { Button },
      },
      props: {
        defaultValue: 'one',
      },
      slots: {
        default: {
          template: ButtonsTemplate,
        },
      },
      attachTo: document.body,
    })
    const buttons = wrapper.findAll('button')

    expect(buttons[0].attributes('data-active')).toBe('')
    expect(buttons[1].attributes('data-active')).toBe(undefined)
    expect(buttons[2].attributes('data-active')).toBe(undefined)
  })
})

describe('test RovingFocus with Arrow Navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  it('[loop=false]: should stop at last item', async () => {
    const wrapper = mount(ButtonGroup, {
      global: {
        stubs: { Button },
      },
      props: {
        defaultValue: 'two',
      },
      slots: {
        default: {
          template: ButtonsTemplate,
        },
      },
      attachTo: document.body,
    })
    const buttons = wrapper.findAll('button')
    // make focus to the RovingFocusGroup
    await userEvent.tab()
    expect(buttons[1].attributes('data-active')).toBe('')
    expect(buttons[1].element).toBe(document.activeElement)

    await userEvent.keyboard('[ArrowRight]')
    expect(buttons[2].element).not.toBe(document.activeElement) // this element was disabled
    expect(buttons[3].element).toBe(document.activeElement)

    await userEvent.keyboard('[ArrowRight]')
    expect(buttons[3].element).toBe(document.activeElement) // stay at index 3 because loop=false
  })

  it('[loop=true]: should loop through items', async () => {
    const wrapper = mount(ButtonGroup, {
      global: {
        stubs: { Button },
      },
      props: {
        defaultValue: 'two',
        loop: true,
      },
      slots: {
        default: {
          template: ButtonsTemplate,
        },
      },
      attachTo: document.body,
    })
    const buttons = wrapper.findAll('button')

    // make focus to the RovingFocusGroup
    await userEvent.tab()
    expect(buttons[1].attributes('data-active')).toBe('')
    expect(buttons[1].element).toBe(document.activeElement)

    await userEvent.keyboard('[ArrowRight]')
    await userEvent.keyboard('[ArrowRight]')
    expect(buttons[3].element).not.toBe(document.activeElement)
    expect(buttons[0].element).toBe(document.activeElement)
  })
})

describe('test RovingFocus with an `asChild` item whose element is replaced', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should keep arrow navigation working on the new element', async () => {
    const asLink = ref(false)
    // Re-renders on its own, so `RovingFocusItem` is not updated when the root element changes.
    const Swappable = defineComponent({
      setup: () => () => asLink.value
        ? h('a', { 'href': '#', 'data-testid': 'first' }, 'One')
        : h('button', { 'data-testid': 'first' }, 'One'),
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, null, () => [
        h(RovingFocusItem, { asChild: true }, () => h(Swappable)),
        h(RovingFocusItem, { asChild: true }, () => h('button', { 'data-testid': 'second' }, 'Two')),
      ]),
    }), { attachTo: document.body })

    // Make the item the current tab stop first, so focusing it again later does not re-render it.
    wrapper.get<HTMLElement>('[data-testid="first"]').element.focus()
    await nextTick()

    asLink.value = true
    await nextTick()

    const first = wrapper.get<HTMLElement>('[data-testid="first"]').element
    expect(first.tagName).toBe('A')
    first.focus()
    await userEvent.keyboard('[ArrowRight]')

    expect(wrapper.get('[data-testid="second"]').element).toBe(document.activeElement)
    wrapper.unmount()
  })
})

describe('test RovingFocus delegated keyboard handling', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function mountGroup(itemProps: Record<string, unknown> = {}, count = 3) {
    return mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, { 'data-testid': 'group' }, () =>
        Array.from({ length: count }, (_, i) =>
          h(RovingFocusItem, { 'as': 'button', 'data-testid': `item-${i}`, ...itemProps }, () => [
            `Item ${i}`,
            h('input', { 'data-testid': `input-${i}` }),
          ]))),
    }), { attachTo: document.body })
  }

  it('adds one keydown listener for the group, none per item', async () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const wrapper = mountGroup({}, 20)
    const keydownTargets = spy.mock.contexts.filter((_, i) => spy.mock.calls[i][0] === 'keydown')
    spy.mockRestore()
    // (test-utils also records the root's events with a keydown listener there.)
    const group = wrapper.get('[data-testid=group]').element
    expect(keydownTargets.length).toBeGreaterThan(0)
    expect(keydownTargets.every(target => target === group)).toBe(true)
    wrapper.unmount()
  })

  it('moves focus with the arrow keys from the item itself', async () => {
    const wrapper = mountGroup()
    wrapper.get<HTMLElement>('[data-testid=item-0]').element.focus()
    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(wrapper.get('[data-testid=item-1]').element)
    wrapper.unmount()
  })

  it('ignores arrow keys from an element inside an item', async () => {
    const wrapper = mountGroup()
    const input = wrapper.get<HTMLElement>('[data-testid=input-0]').element
    input.focus()
    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('does not move focus when an item handler prevented the key', async () => {
    const wrapper = mountGroup({ onKeydown: (event: KeyboardEvent) => event.preventDefault() })
    const first = wrapper.get<HTMLElement>('[data-testid=item-0]').element
    first.focus()
    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(first)
    wrapper.unmount()
  })

  it('moves focus from an item teleported out of the group', async () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const wrapper = mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, { 'data-testid': 'group' }, () => [
        h(RovingFocusItem, { 'as': 'button', 'data-testid': 'item-0' }, () => 'Item 0'),
        h(Teleport, { to: target }, h(RovingFocusItem, { 'as': 'button', 'data-testid': 'item-1' }, () => 'Item 1')),
        h(RovingFocusItem, { 'as': 'button', 'data-testid': 'item-2' }, () => 'Item 2'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const teleported = target.querySelector<HTMLElement>('[data-testid=item-1]')!
    teleported.focus()
    await userEvent.keyboard('[ArrowRight]')
    // The teleported item comes first in the collection's order (outside the group).
    expect(document.activeElement).not.toBe(teleported)
    expect(wrapper.element.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
    target.remove()
  })
})
