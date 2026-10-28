import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { checkboxElements, defineRekaElements, fieldElements, formElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([fieldElements, formElements, checkboxElements])
})
afterEach(cleanup)

const BOX = 'style="display: inline-block; width: 20px; height: 20px"'

// `<reka-form-root>` cannot be a `<form>`: it handles the `submit` and `reset`
// events of the native form inside it, which validates nothing itself.
const FORM = `
  <reka-form-root>
    <form novalidate>
      <reka-field-root name="terms" required>
        <reka-field-label>Accept the terms</reka-field-label>
        <reka-checkbox-root ${BOX}></reka-checkbox-root>
        <reka-field-description>Required to continue.</reka-field-description>
        <reka-field-error match="valueMissing">Accept the terms to continue.</reka-field-error>
      </reka-field-root>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  </reka-form-root>
`

/** Records whether the native submission went ahead, and stops it (no navigation in tests). */
function nativeSubmissions() {
  const submitted: boolean[] = []
  const listener = (event: Event) => {
    submitted.push(!event.defaultPrevented)
    event.preventDefault()
  }
  document.addEventListener('submit', listener)
  return { submitted, stop: () => document.removeEventListener('submit', listener) }
}

describe('field elements', () => {
  it('label and describe a Reka element control', async () => {
    render(FORM)
    const checkbox = query('reka-checkbox-root')
    const label = query('reka-field-label')
    const description = query('reka-field-description')
    await vi.waitFor(() => expect(checkbox.getAttribute('aria-labelledby')).toBe(label.id))
    expect(label.id).not.toBe('')
    expect(label.hasAttribute('for')).toBe(false)
    expect(checkbox.getAttribute('aria-describedby')).toBe(description.id)
    expect(checkbox.getAttribute('aria-required')).toBe('true')
    expect(query('reka-field-error').hasAttribute('data-reka-unmounted')).toBe(true)

    // Not a native label: a click focuses the control instead of toggling it.
    await userEvent.click(label)
    expect(document.activeElement).toBe(checkbox)
    expect(checkbox.getAttribute('aria-checked')).toBe('false')

    // The field's state, on every part.
    await userEvent.click(checkbox)
    await vi.waitFor(() => expect(query('reka-field-root').hasAttribute('data-dirty')).toBe(true))
    expect(query('reka-field-root').hasAttribute('data-filled')).toBe(true)
    expect(label.hasAttribute('data-dirty')).toBe(true)
  })

  it('validate on submit: the error shows, describes the control and blocks the submission', async () => {
    const { submitted, stop } = nativeSubmissions()
    try {
      render(FORM)
      const formRoot = query('reka-form-root')
      const field = query('reka-field-root')
      const checkbox = query('reka-checkbox-root')
      const error = query('reka-field-error')
      const description = query('reka-field-description')
      await vi.waitFor(() => expect(checkbox.getAttribute('aria-describedby')).toBe(description.id))
      const onSubmit = vi.fn()
      formRoot.addEventListener('submit', (event) => {
        if (event instanceof CustomEvent)
          onSubmit((event as RekaElementEvent).detail.value)
      })

      await userEvent.click(query('button[type="submit"]'))
      await vi.waitFor(() => expect(error.hasAttribute('data-reka-unmounted')).toBe(false))
      expect(submitted).toEqual([false])
      expect(onSubmit).not.toHaveBeenCalled()
      expect(field.hasAttribute('data-invalid')).toBe(true)
      expect(checkbox.getAttribute('aria-invalid')).toBe('true')
      expect(checkbox.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`)
      // The first invalid control gets focus.
      expect(document.activeElement).toBe(checkbox)

      // After a submit, the field validates on change.
      await userEvent.click(checkbox)
      await vi.waitFor(() => expect(error.hasAttribute('data-reka-unmounted')).toBe(true))
      expect(field.hasAttribute('data-valid')).toBe(true)
      await userEvent.click(query('button[type="submit"]'))
      expect(submitted).toEqual([false, true])
      expect(onSubmit).toHaveBeenCalledWith(expect.any(SubmitEvent))
      // Once: the element's own \`submit\` event does not reach the part's listener again.
      expect(onSubmit).toHaveBeenCalledTimes(1)
    }
    finally {
      stop()
    }
  })

  it('reports `form-submit` with the values, which prevents the native submission', async () => {
    const { submitted, stop } = nativeSubmissions()
    try {
      render(FORM)
      const formRoot = query('reka-form-root')
      const checkbox = query('reka-checkbox-root')
      await vi.waitFor(() => expect(checkbox.getAttribute('role')).toBe('checkbox'))
      await userEvent.click(checkbox)
      const onFormSubmit = vi.fn()
      const listener = (event: Event) => onFormSubmit((event as RekaElementEvent).detail.value)
      formRoot.addEventListener('form-submit', listener)

      await userEvent.click(query('button[type="submit"]'))
      await vi.waitFor(() => expect(onFormSubmit).toHaveBeenCalledWith({ terms: true }))
      expect(submitted).toEqual([false])

      // Without a listener, the form submits natively again.
      formRoot.removeEventListener('form-submit', listener)
      await userEvent.click(query('button[type="submit"]'))
      await vi.waitFor(() => expect(submitted).toEqual([false, true]))
      expect(onFormSubmit).toHaveBeenCalledTimes(1)
    }
    finally {
      stop()
    }
  })

  it('show server errors from the `errors` property', async () => {
    render(FORM.replace('<reka-field-error match="valueMissing">Accept the terms to continue.</reka-field-error>', '<reka-field-error>Not accepted.</reka-field-error>'))
    const formRoot = query<HTMLElement & { errors?: Record<string, string> }>('reka-form-root')
    const error = query('reka-field-error')
    const checkbox = query('reka-checkbox-root')
    await vi.waitFor(() => expect(checkbox.getAttribute('role')).toBe('checkbox'))
    expect(error.hasAttribute('data-reka-unmounted')).toBe(true)

    formRoot.errors = { terms: 'Not accepted.' }
    await vi.waitFor(() => expect(error.hasAttribute('data-reka-unmounted')).toBe(false))
    expect(query('reka-field-root').hasAttribute('data-invalid')).toBe(true)
    // Editing the field dismisses it.
    await userEvent.click(checkbox)
    await vi.waitFor(() => expect(error.hasAttribute('data-reka-unmounted')).toBe(true))
  })

  it('reset with their form', async () => {
    const { stop } = nativeSubmissions()
    try {
      render(FORM)
      const field = query('reka-field-root')
      const checkbox = query('reka-checkbox-root')
      const error = query('reka-field-error')
      await vi.waitFor(() => expect(checkbox.getAttribute('role')).toBe('checkbox'))
      await userEvent.click(query('button[type="submit"]'))
      await vi.waitFor(() => expect(error.hasAttribute('data-reka-unmounted')).toBe(false))
      await userEvent.click(checkbox)
      await vi.waitFor(() => expect(field.hasAttribute('data-dirty')).toBe(true))

      await userEvent.click(query('button[type="reset"]'))
      await vi.waitFor(() => expect(checkbox.getAttribute('aria-checked')).toBe('false'))
      await vi.waitFor(() => expect(field.hasAttribute('data-dirty')).toBe(false))
      expect(field.hasAttribute('data-touched')).toBe(false)
      expect(field.hasAttribute('data-invalid')).toBe(false)
      expect(error.hasAttribute('data-reka-unmounted')).toBe(true)
    }
    finally {
      stop()
    }
  })

  it('disable their control, also from a disabled fieldset', async () => {
    render(`<form><fieldset disabled>${FORM.replace(/<\/?reka-form-root>|<\/?form[^>]*>/g, '')}</fieldset></form>`)
    const field = query('reka-field-root')
    const checkbox = query('reka-checkbox-root')
    await vi.waitFor(() => expect(field.hasAttribute('data-disabled')).toBe(true))
    await vi.waitFor(() => expect(checkbox.hasAttribute('data-disabled')).toBe(true))
    await userEvent.click(checkbox, { force: true })
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
  })
})
