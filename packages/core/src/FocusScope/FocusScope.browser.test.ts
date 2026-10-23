import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { FocusScope } from '.'

type Wrapper = ReturnType<typeof mount>
let wrapper: Wrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function radios(checked: string | null, disabled?: string) {
  return ['a', 'b', 'c'].map(value => h('input', {
    'type': 'radio',
    'name': 'size',
    value,
    'checked': value === checked,
    'disabled': value === disabled,
    'aria-label': value,
    'data-testid': value,
  }))
}

// A trapped, looping scope with a native radio group placed either after or before a button.
// The scope is last in the document, so a Tab that is not caught leaves the page.
function mountScope({ checked, disabled, radiosFirst = false, inForm = false }: { checked: string | null, disabled?: string, radiosFirst?: boolean, inForm?: boolean }) {
  const button = h('button', { 'type': 'button', 'data-testid': 'button' }, 'Button')
  const children = () => radiosFirst ? [...radios(checked, disabled), button] : [button, ...radios(checked, disabled)]
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(FocusScope, { loop: true, trapped: true }, () => inForm ? [h('form', children())] : children()),
      ])
    },
  })
  wrapper = mount(Fixture, { attachTo: document.body })
  return (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
}

describe('given a trapped FocusScope with a native radio group, in a real browser', () => {
  it.each(['a', 'b', 'c'])('wraps Tab from the checked radio "%s" back to the first element', async (checked) => {
    const get = mountScope({ checked })
    await expect.poll(() => document.activeElement).toBe(get('button'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get(checked))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('button'))
  })

  it('wraps Tab from the checked radio of a group inside a form', async () => {
    const get = mountScope({ checked: 'b', inForm: true })
    await expect.poll(() => document.activeElement).toBe(get('button'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('b'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('button'))
  })

  it('wraps Tab from a radio group with nothing checked back to the first element', async () => {
    const get = mountScope({ checked: null })
    await expect.poll(() => document.activeElement).toBe(get('button'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('a'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('button'))
  })

  it('wraps Tab from a radio group whose checked radio is disabled', async () => {
    const get = mountScope({ checked: 'b', disabled: 'b' })
    await expect.poll(() => document.activeElement).toBe(get('button'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('a'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('button'))
  })

  it('wraps Shift+Tab from the checked radio back to the last element', async () => {
    const get = mountScope({ checked: 'b', radiosFirst: true })
    // The group's tab stop is its checked radio, so that is what the scope focuses on mount.
    await expect.poll(() => document.activeElement).toBe(get('b'))

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('button'))
  })

  it('wraps Tab from the last element to the checked radio of a leading group', async () => {
    const get = mountScope({ checked: 'b', radiosFirst: true })
    await expect.poll(() => document.activeElement).toBe(get('b'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('button'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('b'))
  })
})
