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

  it('honours stopPropagation() on a teleported item', async () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const wrapper = mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, null, () => [
        h(RovingFocusItem, { as: 'button' }, () => 'Item 0'),
        h(Teleport, { to: target }, h(RovingFocusItem, {
          'as': 'button',
          'data-testid': 'item-1',
          'onKeydown': (event: KeyboardEvent) => event.stopPropagation(),
        }, () => 'Item 1')),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const teleported = target.querySelector<HTMLElement>('[data-testid=item-1]')!
    teleported.focus()
    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(teleported)
    wrapper.unmount()
    target.remove()
  })

  it('keeps arrow keys on a teleported item whose element is replaced', async () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const as = ref('button')
    const wrapper = mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, null, () => [
        h(RovingFocusItem, { as: 'button' }, () => 'Item 0'),
        h(Teleport, { to: target }, h(RovingFocusItem, { 'as': as.value, 'tabindex': 0, 'data-testid': 'item-1' }, () => 'Item 1')),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const before = target.querySelector<HTMLElement>('[data-testid=item-1]')!
    as.value = 'div'
    await nextTick()
    await nextTick()
    const after = target.querySelector<HTMLElement>('[data-testid=item-1]')!
    expect(after).not.toBe(before)
    after.focus()
    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).not.toBe(after)
    expect(wrapper.element.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
    target.remove()
  })
})

describe('given a RovingFocusGroup `currentTabStopId` model', () => {
  const ids = ['a', 'b', 'c']
  const Fixture = defineComponent({
    props: { groupProps: { type: Object, default: () => ({}) } },
    setup: props => () => h(RovingFocusGroup, props.groupProps, () =>
      ids.map(id => h(RovingFocusItem, { 'tabStopId': id, 'as': 'button', 'data-id': id }, () => id))),
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function tabStops(wrapper: ReturnType<typeof mount>) {
    return wrapper.findAll('button').filter(b => b.attributes('tabindex') === '0').map(b => b.attributes('data-id'))
  }

  async function focusItem(wrapper: ReturnType<typeof mount>, id: string) {
    const button = wrapper.find(`[data-id="${id}"]`).element as HTMLElement
    button.blur()
    button.focus()
    await nextTick()
  }

  it('uncontrolled: starts from `defaultCurrentTabStopId` and moves the tab stop on focus', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    expect(tabStops(wrapper)).toEqual(['b'])
    await focusItem(wrapper, 'c')
    expect(tabStops(wrapper)).toEqual(['c'])
    const group = wrapper.findComponent(RovingFocusGroup)
    expect(group.emitted('update:currentTabStopId')).toEqual([['c']])
    expect(group.emitted('beforeUpdate:currentTabStopId')).toBeUndefined()
  })

  it('uncontrolled: does not emit when the same item is focused again', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    await focusItem(wrapper, 'b')
    await focusItem(wrapper, 'c')
    await focusItem(wrapper, 'c')
    expect(wrapper.findComponent(RovingFocusGroup).emitted('update:currentTabStopId')).toEqual([['c']])
  })

  it('uncontrolled: follows a `currentTabStopId` the parent sets later', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    await wrapper.setProps({ groupProps: { defaultCurrentTabStopId: 'b', currentTabStopId: 'a' } })
    expect(tabStops(wrapper)).toEqual(['a'])
  })

  it('controlled: reflects the prop over `defaultCurrentTabStopId` and emits without moving', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { currentTabStopId: 'a', defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    expect(tabStops(wrapper)).toEqual(['a'])
    await focusItem(wrapper, 'c')
    const group = wrapper.findComponent(RovingFocusGroup)
    expect(group.emitted('update:currentTabStopId')).toEqual([['c']])
    expect(group.emitted('beforeUpdate:currentTabStopId')).toBeUndefined()
    expect(tabStops(wrapper)).toEqual(['a'])
    await wrapper.setProps({ groupProps: { currentTabStopId: 'c' } })
    expect(tabStops(wrapper)).toEqual(['c'])
  })

  it('controlled: emits each time an item is focused, even the current tab stop', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { currentTabStopId: 'a' } }, attachTo: document.body })
    await nextTick()
    await focusItem(wrapper, 'a')
    await focusItem(wrapper, 'a')
    expect(wrapper.findComponent(RovingFocusGroup).emitted('update:currentTabStopId')).toEqual([['a'], ['a']])
  })

  it('controlled: falls back to `defaultCurrentTabStopId` once the binding is cleared', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { currentTabStopId: 'a', defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    await wrapper.setProps({ groupProps: { defaultCurrentTabStopId: 'b' } })
    expect(tabStops(wrapper)).toEqual(['b'])
    // Still controlled: focus emits without moving the tab stop.
    await focusItem(wrapper, 'c')
    expect(wrapper.findComponent(RovingFocusGroup).emitted('update:currentTabStopId')).toEqual([['c']])
    expect(tabStops(wrapper)).toEqual(['b'])
  })

  it('controlled `null`: stays controlled and emits the focused item', async () => {
    const wrapper = mount(Fixture, { props: { groupProps: { currentTabStopId: null, defaultCurrentTabStopId: 'b' } }, attachTo: document.body })
    await nextTick()
    expect(tabStops(wrapper)).toEqual([])
    await focusItem(wrapper, 'c')
    expect(wrapper.findComponent(RovingFocusGroup).emitted('update:currentTabStopId')).toEqual([['c']])
    expect(tabStops(wrapper)).toEqual([])
  })

  it('v-model: focus updates the bound id, and the bound id moves the tab stop', async () => {
    const stop = ref<string | null | undefined>('a')
    const wrapper = mount(defineComponent({
      setup: () => () => h(RovingFocusGroup, { 'currentTabStopId': stop.value, 'onUpdate:currentTabStopId': (v: string | null | undefined) => { stop.value = v } }, () =>
        ids.map(id => h(RovingFocusItem, { 'tabStopId': id, 'as': 'button', 'data-id': id }, () => id))),
    }), { attachTo: document.body })
    await nextTick()
    await focusItem(wrapper as any, 'b')
    expect(stop.value).toBe('b')
    expect(tabStops(wrapper as any)).toEqual(['b'])
    stop.value = 'c'
    await nextTick()
    expect(tabStops(wrapper as any)).toEqual(['c'])
  })
})
