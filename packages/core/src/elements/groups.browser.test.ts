import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, radioGroupElements, toggleGroupElements, toolbarElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([radioGroupElements, toggleGroupElements, toolbarElements])
})
afterEach(cleanup)

const BOX = 'style="display: inline-block; width: 20px; height: 20px"'

function events(el: Element, type: string) {
  const seen: { value: unknown, reason: unknown }[] = []
  el.addEventListener(type, (event) => {
    const { value, details } = (event as RekaElementEvent<unknown, { reason?: unknown }>).detail
    seen.push({ value, reason: details?.reason })
  })
  return seen
}

const RADIOS = `
  <reka-radio-group-root aria-label="Density" name="density" default-value="default">
    <reka-radio-group-item value="default" id="r1" ${BOX}><reka-radio-group-indicator>•</reka-radio-group-indicator></reka-radio-group-item>
    <reka-radio-group-item value="comfortable" id="r2" ${BOX}><reka-radio-group-indicator>•</reka-radio-group-indicator></reka-radio-group-item>
    <reka-radio-group-item value="compact" id="r3" disabled ${BOX}><reka-radio-group-indicator>•</reka-radio-group-indicator></reka-radio-group-item>
  </reka-radio-group-root>
`

describe('radio group elements', () => {
  it('wires the radios, and moves the selection with the arrow keys', async () => {
    render(`<button id="before">Before</button>${RADIOS}`)
    const root = query('reka-radio-group-root')
    const [first, second, third] = document.querySelectorAll<HTMLElement>('reka-radio-group-item')
    const [firstDot, secondDot] = document.querySelectorAll<HTMLElement>('reka-radio-group-indicator')
    await vi.waitFor(() => expect(first.getAttribute('aria-checked')).toBe('true'))
    expect(root.getAttribute('role')).toBe('radiogroup')
    expect(first.getAttribute('role')).toBe('radio')
    expect(third.getAttribute('aria-disabled')).toBe('true')
    expect(firstDot.getAttribute('data-state')).toBe('checked')
    expect(secondDot.hasAttribute('data-reka-unmounted')).toBe(true)
    const changes = events(root, 'update-model-value')

    // One tab stop: the checked radio.
    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(first)

    // The item checks itself a task after the arrow key moved focus to it, if the
    // key is still down (as in Vue): hold it like a person would.
    await userEvent.keyboard('{ArrowDown>}')
    expect(document.activeElement).toBe(second)
    await vi.waitFor(() => expect(second.getAttribute('aria-checked')).toBe('true'))
    await userEvent.keyboard('{/ArrowDown}')
    expect(first.getAttribute('aria-checked')).toBe('false')
    await vi.waitFor(() => expect(secondDot.getAttribute('data-state')).toBe('checked'))
    expect(changes).toEqual([{ value: 'comfortable', reason: 'item-press' }])

    // The disabled radio is skipped.
    await userEvent.keyboard('{ArrowDown>}')
    expect(document.activeElement).toBe(first)
    await vi.waitFor(() => expect(first.getAttribute('aria-checked')).toBe('true'))
    await userEvent.keyboard('{/ArrowDown}')
  })

  it('submits, validates and resets with its form', async () => {
    const container = render(`<form>${RADIOS.replace('default-value="default"', 'required')}</form>`)
    const form = container.querySelector('form')!
    const root = query('reka-radio-group-root')
    const [, second] = document.querySelectorAll<HTMLElement>('reka-radio-group-item')
    await vi.waitFor(() => expect(second.getAttribute('role')).toBe('radio'))

    await vi.waitFor(() => expect(form.checkValidity()).toBe(false))
    expect(root.matches(':invalid')).toBe(true)
    // Like the Vue component's hidden input: an empty value until one is checked.
    expect(new FormData(form).get('density')).toBe('')

    await userEvent.click(second)
    await vi.waitFor(() => expect(new FormData(form).get('density')).toBe('comfortable'))
    expect(form.checkValidity()).toBe(true)
    // Only the group submits: the radios have no name of their own.
    expect([...new FormData(form).keys()]).toEqual(['density'])

    form.reset()
    await vi.waitFor(() => expect(second.getAttribute('aria-checked')).toBe('false'))
    await vi.waitFor(() => expect(new FormData(form).get('density')).toBe(''))
    expect(form.checkValidity()).toBe(false)
  })

  it('is disabled by a disabled fieldset', async () => {
    render(`<form><fieldset disabled>${RADIOS}</fieldset></form>`)
    const [first, second] = document.querySelectorAll<HTMLElement>('reka-radio-group-item')
    await vi.waitFor(() => expect(first.getAttribute('aria-checked')).toBe('true'))
    await vi.waitFor(() => expect(second.hasAttribute('data-disabled')).toBe(true))
    await userEvent.click(second, { force: true })
    expect(second.getAttribute('aria-checked')).toBe('false')
  })

  it('labels a radio with `<label for>`', async () => {
    render(`${RADIOS}<label for="r2">Comfortable</label>`)
    const second = query('#r2')
    await vi.waitFor(() => expect(second.getAttribute('role')).toBe('radio'))
    await userEvent.click(query('label'))
    await vi.waitFor(() => expect(second.getAttribute('aria-checked')).toBe('true'))
  })
})

const TOGGLES = `
  <reka-toggle-group-root type="multiple" aria-label="Formatting" name="format">
    <reka-toggle-group-item value="bold" aria-label="Bold">B</reka-toggle-group-item>
    <reka-toggle-group-item value="italic" aria-label="Italic">I</reka-toggle-group-item>
    <reka-toggle-group-item value="underline" aria-label="Underline" disabled>U</reka-toggle-group-item>
  </reka-toggle-group-root>
`

describe('toggle group elements', () => {
  it('toggles items with the keyboard and moves focus with the arrow keys', async () => {
    render(`<button id="before">Before</button>${TOGGLES}`)
    const root = query('reka-toggle-group-root')
    const [bold, italic, underline] = document.querySelectorAll<HTMLElement>('reka-toggle-group-item')
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('false'))
    expect(root.getAttribute('role')).toBe('group')
    expect(bold.getAttribute('role')).toBe('button')
    expect(underline.getAttribute('aria-disabled')).toBe('true')
    const changes = events(root, 'update-model-value')

    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(bold)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('true'))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(italic)
    await userEvent.keyboard(' ')
    await vi.waitFor(() => expect(italic.getAttribute('aria-pressed')).toBe('true'))
    expect(italic.getAttribute('data-state')).toBe('checked')
    expect(changes).toEqual([
      { value: ['bold'], reason: 'item-press' },
      { value: ['bold', 'italic'], reason: 'item-press' },
    ])

    // The disabled item is skipped and focus loops.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(bold)
  })

  it('in `single` mode, can be controlled, and cancelled through `before-update-model-value`', async () => {
    render(TOGGLES.replace('type="multiple"', 'type="single"'))
    const root = query<HTMLElement & { modelValue?: unknown }>('reka-toggle-group-root')
    const [bold, italic] = document.querySelectorAll<HTMLElement>('reka-toggle-group-item')
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('false'))

    root.modelValue = 'italic'
    await vi.waitFor(() => expect(italic.getAttribute('aria-pressed')).toBe('true'))
    root.addEventListener('update-model-value', event => (root.modelValue = (event as RekaElementEvent).detail.value))
    await userEvent.click(bold)
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('true'))
    expect(italic.getAttribute('aria-pressed')).toBe('false')

    root.addEventListener('before-update-model-value', event => event.preventDefault())
    await userEvent.click(italic)
    expect(bold.getAttribute('aria-pressed')).toBe('true')
  })

  it('submits, validates and resets with its form', async () => {
    const container = render(`<form>${TOGGLES.replace('name="format"', 'name="format" required')}</form>`)
    const form = container.querySelector('form')!
    const [bold, italic] = document.querySelectorAll<HTMLElement>('reka-toggle-group-item')
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('false'))
    await vi.waitFor(() => expect(form.checkValidity()).toBe(false))
    // A required, empty group submits one empty value, like the Vue component.
    expect([...new FormData(form)]).toEqual([['format', '']])

    await userEvent.click(bold)
    await userEvent.click(italic)
    // The same names as the Vue component's hidden inputs.
    await vi.waitFor(() => expect([...new FormData(form)]).toEqual([['format[0]', 'bold'], ['format[1]', 'italic']]))
    expect(form.checkValidity()).toBe(true)

    form.reset()
    await vi.waitFor(() => expect(bold.getAttribute('aria-pressed')).toBe('false'))
    await vi.waitFor(() => expect([...new FormData(form)]).toEqual([['format', '']]))
    expect(form.checkValidity()).toBe(false)
  })
})

describe('toolbar elements', () => {
  const TOOLBAR = `
    <button id="before">Before</button>
    <reka-toolbar-root aria-label="Formatting">
      <reka-toolbar-toggle-group type="single" aria-label="Alignment">
        <reka-toolbar-toggle-item value="left">Left</reka-toolbar-toggle-item>
        <reka-toolbar-toggle-item value="right">Right</reka-toolbar-toggle-item>
      </reka-toolbar-toggle-group>
      <reka-toolbar-separator></reka-toolbar-separator>
      <reka-toolbar-button>Share</reka-toolbar-button>
      <reka-toolbar-button disabled>Delete</reka-toolbar-button>
    </reka-toolbar-root>
  `

  it('is one tab stop, with arrow keys across buttons and toggle items', async () => {
    render(TOOLBAR)
    const root = query('reka-toolbar-root')
    const [left, right] = document.querySelectorAll<HTMLElement>('reka-toolbar-toggle-item')
    const [share, remove] = document.querySelectorAll<HTMLElement>('reka-toolbar-button')
    await vi.waitFor(() => expect(left.getAttribute('aria-pressed')).toBe('false'))
    expect(root.getAttribute('role')).toBe('toolbar')
    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(left.getAttribute('role')).toBe('button')
    expect(share.getAttribute('role')).toBe('button')
    expect(remove.getAttribute('aria-disabled')).toBe('true')
    const separator = query('reka-toolbar-separator')
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    const changes = events(query('reka-toolbar-toggle-group'), 'update-model-value')
    const onShare = vi.fn()
    share.addEventListener('click', onShare)

    await userEvent.click(query('#before'))
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(left)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(right)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(right.getAttribute('aria-pressed')).toBe('true'))
    expect(changes).toEqual([{ value: 'right', reason: 'item-press' }])

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(share)
    await userEvent.keyboard('{Enter}')
    expect(onShare).toHaveBeenCalledTimes(1)
    // Disabled buttons are skipped; the toolbar does not loop by default.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(share)

    // Tab leaves the toolbar.
    await userEvent.keyboard('{Tab}')
    expect(root.contains(document.activeElement)).toBe(false)
  })

  it('follows a vertical orientation', async () => {
    render(TOOLBAR.replace('aria-label="Formatting"', 'aria-label="Formatting" orientation="vertical"'))
    const [left, right] = document.querySelectorAll<HTMLElement>('reka-toolbar-toggle-item')
    await vi.waitFor(() => expect(left.getAttribute('aria-pressed')).toBe('false'))
    expect(query('reka-toolbar-separator').getAttribute('data-orientation')).toBe('horizontal')
    left.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(right)
  })
})
