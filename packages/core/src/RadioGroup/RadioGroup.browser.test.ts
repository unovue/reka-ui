import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { RadioGroupItem, RadioGroupRoot } from '.'

// With a real key press, the microtask in which `RovingFocusGroup` moves focus runs before
// the document's bubbling keydown listeners. jsdom's synthetic events don't reproduce that.
function group(values: string[]) {
  return defineComponent(() => () => h(
    RadioGroupRoot,
    { defaultValue: 'a', orientation: 'horizontal', loop: false },
    () => values.map(value => h(RadioGroupItem, { 'value': value, 'aria-label': value })),
  ))
}

const sleep = (ms = 30) => new Promise(resolve => setTimeout(resolve, ms))

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

async function setup(container: Element, values = ['a', 'b', 'c']) {
  const wrapper = mount(group(values), { attachTo: container })
  unmount = () => wrapper.unmount()
  const radios = wrapper.findAll('[role=radio]').map(radio => radio.element as HTMLElement)
  await sleep()
  radios[0].focus()
  return radios
}

const states = (radios: HTMLElement[]) => radios.map(radio => radio.dataset.state)

describe('radioGroup with real key presses', () => {
  it('selects the next item when an arrow key is held and released', async () => {
    const container = document.body.appendChild(document.createElement('div'))
    const radios = await setup(container)

    await userEvent.keyboard('{ArrowRight>}')
    await sleep(80)
    await userEvent.keyboard('{/ArrowRight}')
    await sleep()

    expect(document.activeElement).toBe(radios[1])
    expect(states(radios)).toEqual(['unchecked', 'checked', 'unchecked'])
  })

  it('selects the focused item after fast arrow-key taps', async () => {
    const container = document.body.appendChild(document.createElement('div'))
    const radios = await setup(container)

    await userEvent.keyboard('{ArrowRight}{ArrowLeft}{ArrowRight}{ArrowRight}')
    await sleep()

    expect(document.activeElement).toBe(radios[2])
    expect(states(radios)).toEqual(['unchecked', 'unchecked', 'checked'])
  })

  it('does not select on Tab focus', async () => {
    const before = document.body.appendChild(document.createElement('button'))
    const container = document.body.appendChild(document.createElement('div'))
    const radios = await setup(container)
    before.focus()

    await userEvent.keyboard('{Tab}')
    await sleep()

    expect(document.activeElement).toBe(radios[0])
    expect(states(radios)).toEqual(['checked', 'unchecked', 'unchecked'])
  })

  it('selects inside a closed shadow root', async () => {
    const host = document.body.appendChild(document.createElement('div'))
    const shadowRoot = host.attachShadow({ mode: 'closed' })
    const radios = await setup(shadowRoot.appendChild(document.createElement('div')), ['a', 'b'])

    await userEvent.keyboard('{ArrowRight}')
    await sleep()

    expect(shadowRoot.activeElement).toBe(radios[1])
    expect(states(radios)).toEqual(['unchecked', 'checked'])
  })
})
