import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
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
