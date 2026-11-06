// Where focus goes when the combobox opens and closes, in a real browser
// (`ComboboxContent` `initialFocus` / `finalFocus`):
// - input outside the content: a trigger press moves focus to the input (not by
//   touch, so no virtual keyboard opens); the content takes no focus on open and
//   returns none on close.
// - input inside the content: opening focuses the input (the content itself when
//   opened by touch); closing returns focus to the trigger.
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

const fruits = ['Apple', 'Banana']

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

interface FixtureOptions {
  inside?: boolean
  rootProps?: Record<string, unknown>
  contentProps?: (refs: { outsideButton: HTMLElement | null }) => Record<string, unknown>
  inputProps?: Record<string, unknown>
  /** A focusable control inside the content. */
  contentControl?: boolean
}

function mountCombobox(options: FixtureOptions = {}) {
  const outsideButton = ref<HTMLElement | null>(null)
  const open = ref(false)
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'ref': outsideButton, 'data-testid': 'outside' }, 'Outside'),
        h(ComboboxRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => { open.value = value },
          ...options.rootProps,
        }, () => {
          const input = h(ComboboxInput, { 'data-testid': 'input', 'aria-label': 'Fruit', ...options.inputProps })
          const items = h(ComboboxViewport, () => fruits.map(fruit => h(ComboboxItem, { key: fruit, value: fruit, style: 'height: 24px;' }, () => fruit)))
          return [
            h(ComboboxAnchor, () => [
              options.inside ? null : input,
              h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            ]),
            h(ComboboxPortal, () => h(ComboboxContent, {
              'data-testid': 'content',
              'position': 'popper',
              'style': 'background: white;',
              ...options.contentProps?.({ outsideButton: outsideButton.value }),
            }, () => [
              options.inside ? input : null,
              items,
              options.contentControl ? h('button', { 'data-testid': 'content-control' }, 'Control') : null,
            ])),
          ]
        }),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  unmount = () => wrapper.unmount()
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  const content = () => get('content')
  const isShown = () => !!content() && content()!.getClientRects().length > 0
  return { wrapper, get, content, isShown, open, outsideButton }
}

/** A touch press: Playwright clicks carry a mouse pointer type, so the pointer events are dispatched. */
function touchPress(element: HTMLElement) {
  const init = { bubbles: true, cancelable: true, composed: true, pointerType: 'touch', isPrimary: true }
  element.dispatchEvent(new PointerEvent('pointerdown', init))
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  element.dispatchEvent(new PointerEvent('pointerup', init))
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
}

function trackFocus(element: HTMLElement) {
  const focused: Element[] = []
  element.addEventListener('focus', () => focused.push(element))
  return focused
}

describe('combobox focus with the input outside the content', () => {
  it('a trigger press moves focus to the input without the trigger taking it', async () => {
    const { get, isShown } = mountCombobox()
    const triggerFocus = trackFocus(get('trigger')!)

    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    expect(document.activeElement).toBe(get('input'))
    expect(triggerFocus).toHaveLength(0)
  })

  it('with `openOnFocus`, a trigger press opens and keeps the popup open', async () => {
    const { get, isShown, open } = mountCombobox({ rootProps: { openOnFocus: true } })

    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(open.value).toBe(true)
    expect(document.activeElement).toBe(get('input'))

    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(false)
    expect(document.activeElement).toBe(get('input'))
  })

  it('a touch press on the trigger opens without focusing the input', async () => {
    const { get, isShown } = mountCombobox()

    touchPress(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.activeElement).not.toBe(get('input'))
  })

  it('opening programmatically does not move focus', async () => {
    const { get, isShown, open } = mountCombobox()
    get('outside')!.focus()

    open.value = true
    await expect.poll(isShown).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.activeElement).toBe(get('outside'))
  })

  it('closing does not return focus to the trigger by default', async () => {
    const { get, isShown } = mountCombobox({ contentControl: true, rootProps: { unmountOnHide: false } })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)

    get('content-control')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    expect(document.activeElement).not.toBe(get('trigger'))
  })

  it('`finalFocus: true` returns focus to the input', async () => {
    const { get, isShown } = mountCombobox({ contentControl: true, contentProps: () => ({ finalFocus: true }) })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)

    get('content-control')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    await expect.poll(() => document.activeElement).toBe(get('input'))
  })

  it('`finalFocus` set to an element focuses it on close', async () => {
    const { get, isShown } = mountCombobox({ contentProps: ({ outsideButton }) => ({ finalFocus: outsideButton }) })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    expect(document.activeElement).toBe(get('input'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    await expect.poll(() => document.activeElement).toBe(get('outside'))
  })

  it('`initialFocus: true` focuses the first tabbable element in the content', async () => {
    const { get, isShown } = mountCombobox({ contentControl: true, contentProps: () => ({ initialFocus: true }) })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await expect.poll(() => document.activeElement).toBe(get('content-control'))
  })
})

describe('combobox focus with the input inside the content', () => {
  it('opening focuses the input and closing returns focus to the trigger', async () => {
    const { get, isShown } = mountCombobox({ inside: true })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await expect.poll(() => document.activeElement).toBe(get('input'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
  })

  it('opening by touch focuses the content instead of the input', async () => {
    const { get, content, isShown } = mountCombobox({ inside: true })
    touchPress(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await expect.poll(() => document.activeElement).toBe(content())
  })

  it('`initialFocus: false` leaves focus where it was (#2034)', async () => {
    const { get, isShown } = mountCombobox({ inside: true, contentProps: () => ({ initialFocus: false }) })
    get('trigger')!.focus()
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.activeElement).toBe(get('trigger'))
  })

  it('`initialFocus` as a function focuses the element it returns, given the interaction type', async () => {
    const calls: string[] = []
    const { get, isShown } = mountCombobox({
      inside: true,
      contentControl: true,
      contentProps: () => ({ initialFocus: (type: string) => {
        calls.push(type)
        return get('content-control')
      } }),
    })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await expect.poll(() => document.activeElement).toBe(get('content-control'))
    expect(calls).toEqual(['mouse'])
  })

  it('`finalFocus` as a function is given how the content closed', async () => {
    const calls: string[] = []
    const { get, isShown } = mountCombobox({ inside: true, contentProps: () => ({ finalFocus: (type: string) => {
      calls.push(type)
      return true
    } }) })
    await userEvent.click(get('trigger')!)
    await expect.poll(() => document.activeElement).toBe(get('input'))
    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
    expect(calls).toEqual(['keyboard'])
  })

  it('`finalFocus: false` does not return focus to the trigger', async () => {
    const { get, isShown } = mountCombobox({ inside: true, rootProps: { unmountOnHide: false }, contentProps: () => ({ finalFocus: false }) })
    await userEvent.click(get('trigger')!)
    await expect.poll(isShown).toBe(true)
    await expect.poll(() => document.activeElement).toBe(get('input'))

    await userEvent.keyboard('{Escape}')
    await expect.poll(isShown).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.activeElement).not.toBe(get('trigger'))
  })

  it('a kept-mounted content focuses its input on every open', async () => {
    const { get, isShown } = mountCombobox({ inside: true, rootProps: { unmountOnHide: false } })
    for (let i = 0; i < 2; i++) {
      await userEvent.click(get('trigger')!)
      await expect.poll(isShown).toBe(true)
      await expect.poll(() => document.activeElement).toBe(get('input'))
      await userEvent.keyboard('{Escape}')
      await expect.poll(isShown).toBe(false)
      await expect.poll(() => document.activeElement).toBe(get('trigger'))
    }
  })
})
