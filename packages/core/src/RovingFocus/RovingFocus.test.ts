import { mount } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
