import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { checkboxElements, defineRekaElements, switchElements, toggleElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([switchElements, checkboxElements, toggleElements])
})
afterEach(cleanup)

const BOX = 'style="display: inline-block; width: 20px; height: 20px"'

async function focusFirstAfter(selector: string) {
  await userEvent.click(query(selector))
  await userEvent.keyboard('{Tab}')
}

describe('switch elements', () => {
  it('is focusable and toggles with Space and Enter, like a native button', async () => {
    render(`
      <button id="before">Before</button>
      <reka-switch-root aria-label="Wi-Fi" ${BOX}><reka-switch-thumb></reka-switch-thumb></reka-switch-root>
    `)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await focusFirstAfter('#before')
    expect(document.activeElement).toBe(el)

    await userEvent.keyboard(' ')
    expect(el.getAttribute('aria-checked')).toBe('true')
    expect(query('reka-switch-thumb').getAttribute('data-state')).toBe('checked')
    // The part handles Enter itself; the button shim must not toggle a second time.
    await userEvent.keyboard('{Enter}')
    expect(el.getAttribute('aria-checked')).toBe('false')
  })

  it('cannot be focused or toggled while disabled', async () => {
    render(`
      <button id="before">Before</button>
      <reka-switch-root aria-label="Wi-Fi" disabled ${BOX}></reka-switch-root>
      <button id="after">After</button>
    `)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.hasAttribute('tabindex')).toBe(false)

    await focusFirstAfter('#before')
    expect(document.activeElement).toBe(query('#after'))
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-checked')).toBe('false')
  })
})

describe('checkbox elements', () => {
  it('toggles with Space but not Enter, and renders the indicator only when checked', async () => {
    render(`
      <button id="before">Before</button>
      <reka-checkbox-root aria-label="Accept" ${BOX}><reka-checkbox-indicator>✓</reka-checkbox-indicator></reka-checkbox-root>
    `)
    const el = query('reka-checkbox-root')
    const indicator = query('reka-checkbox-indicator')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('checkbox'))
    expect(indicator.hasAttribute('data-reka-unmounted')).toBe(true)
    await focusFirstAfter('#before')
    expect(document.activeElement).toBe(el)

    // WAI-ARIA checkboxes do not activate on Enter.
    await userEvent.keyboard('{Enter}')
    expect(el.getAttribute('aria-checked')).toBe('false')
    await userEvent.keyboard(' ')
    expect(el.getAttribute('aria-checked')).toBe('true')
    await vi.waitFor(() => expect(indicator.getAttribute('data-state')).toBe('checked'))
    expect(indicator.hasAttribute('data-reka-unmounted')).toBe(false)
  })

  it('reads `indeterminate` from the attribute', async () => {
    render(`<reka-checkbox-root aria-label="All" default-value="indeterminate" ${BOX}></reka-checkbox-root>`)
    const el = query('reka-checkbox-root')
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('mixed'))
    expect(el.getAttribute('data-state')).toBe('indeterminate')
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
  })

  it('submits with its form', async () => {
    const container = render(`
      <form><reka-checkbox-root aria-label="Accept" name="accept" value="yes" ${BOX}></reka-checkbox-root></form>
    `)
    const el = query('reka-checkbox-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('checkbox'))
    const form = container.querySelector('form')!
    expect(new FormData(form).get('accept')).toBeNull()
    await userEvent.click(el)
    expect(new FormData(form).get('accept')).toBe('yes')
  })
})

describe('toggle element', () => {
  it('toggles `aria-pressed` with Enter and Space', async () => {
    render(`<button id="before">Before</button><reka-toggle aria-label="Bold">B</reka-toggle>`)
    const el = query('reka-toggle')
    await vi.waitFor(() => expect(el.getAttribute('aria-pressed')).toBe('false'))
    expect(el.getAttribute('role')).toBe('button')
    await focusFirstAfter('#before')
    expect(document.activeElement).toBe(el)

    await userEvent.keyboard('{Enter}')
    expect(el.getAttribute('aria-pressed')).toBe('true')
    await userEvent.keyboard(' ')
    expect(el.getAttribute('aria-pressed')).toBe('false')
  })

  it('ignores clicks while disabled', async () => {
    render(`<reka-toggle aria-label="Bold" disabled>B</reka-toggle>`)
    const el = query('reka-toggle')
    await vi.waitFor(() => expect(el.getAttribute('aria-pressed')).toBe('false'))
    expect(el.getAttribute('aria-disabled')).toBe('true')
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-pressed')).toBe('false')
  })
})
