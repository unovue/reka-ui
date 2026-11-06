import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { FocusScope } from '.'
import { getTabbableCandidates } from './utils'

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

function radio(name: string, value: string, { checked = false, ...attrs }: { checked?: boolean, [key: string]: unknown } = {}) {
  return h('input', { 'type': 'radio', name, value, checked, 'aria-label': value, 'data-testid': value, ...attrs })
}

function button(id: string) {
  return h('button', { 'type': 'button', 'data-testid': id }, id)
}

// A trapped, looping scope around `children`, last in the document after `outside`.
function mountChildren(children: () => VNode[], outside: VNode[] = []) {
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        ...outside,
        h(FocusScope, { 'loop': true, 'trapped': true, 'data-testid': 'scope' }, children),
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

  // With nothing checked, the browser stops at a group's first radio when tabbing forwards and
  // at its last radio when tabbing backwards, even when another element sits between them.
  it('does not wrap Tab early from a radio group that another element interleaves', async () => {
    const get = mountChildren(() => [button('1'), radio('size', 'a'), button('2'), radio('size', 'c')])
    await expect.poll(() => document.activeElement).toBe(get('1'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('a'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('2'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('1'))
  })

  it('does not wrap Shift+Tab early from a radio group that another element interleaves', async () => {
    const get = mountChildren(() => [button('1'), radio('size', 'a'), button('2'), radio('size', 'c')])
    await expect.poll(() => document.activeElement).toBe(get('1'))

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('c'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('2'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('1'))
  })

  it('wraps between two radio groups at the first and last edges', async () => {
    const get = mountChildren(() => [
      radio('first', 'x'),
      radio('first', 'y', { checked: true }),
      button('middle'),
      radio('last', 'p'),
      radio('last', 'q'),
    ])
    await expect.poll(() => document.activeElement).toBe(get('y'))

    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('middle'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('p'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(get('y'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('q'))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(get('middle'))
  })
})

describe('getTabbableCandidates with native radio groups, in a real browser', () => {
  it('keeps the unchecked radios when the checked one is not tabbable', async () => {
    const get = mountChildren(() => [
      button('button'),
      radio('size', 'a'),
      radio('size', 'b', { checked: true, tabindex: -1 }),
      radio('size', 'c'),
      radio('color', 'red'),
      h('span', { style: { display: 'none' } }, [radio('color', 'blue', { checked: true })]),
    ])
    await expect.poll(() => document.activeElement).toBe(get('button'))

    const ids = getTabbableCandidates(get('scope')!).map(element => element.dataset.testid)
    expect(ids).toEqual(['button', 'a', 'c', 'red', 'blue'])
  })

  it('keeps radios of the same name in another form as their own group', async () => {
    const get = mountChildren(() => [
      h('form', [radio('size', 'a'), radio('size', 'b', { checked: true })]),
      h('form', [radio('size', 'c'), radio('size', 'd')]),
    ])
    await expect.poll(() => document.activeElement).toBe(get('b'))

    const ids = getTabbableCandidates(get('scope')!).map(element => element.dataset.testid)
    expect(ids).toEqual(['b', 'c', 'd'])
  })

  it('looks for the checked radio among the candidates only', async () => {
    const get = mountChildren(
      () => [button('button'), radio('size', 'a'), radio('size', 'b')],
      [radio('size', 'page', { checked: true })],
    )
    await expect.poll(() => document.activeElement).toBe(get('button'))

    const ids = getTabbableCandidates(get('scope')!).map(element => element.dataset.testid)
    expect(ids).toEqual(['button', 'a', 'b'])
  })
})
