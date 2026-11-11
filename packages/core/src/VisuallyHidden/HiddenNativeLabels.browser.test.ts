import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectValue } from '@/Select'

/**
 * Mount required named controls backed by hidden native twins.
 *
 * @param initiallyFilled Whether both controls start with valid values.
 * @returns The rendered form for native submission and validity assertions.
 */
function mountForm(initiallyFilled = false) {
  const wrapper = mount(() => h('form', [
    h(SelectRoot, { name: 'topic', required: true, defaultValue: initiallyFilled ? 'news' : undefined }, () => [
      h(SelectTrigger, { 'aria-label': 'Topic' }, () => h(SelectValue)),
      h(SelectContent, null, () => h(SelectItem, { value: 'news' }, () => h(SelectItemText, null, () => 'News'))),
    ]),
    h(CheckboxRoot, { 'name': 'agree', 'required': true, 'defaultValue': initiallyFilled, 'aria-label': 'Accept terms' }),
  ]), { attachTo: document.body })

  return wrapper.element as HTMLFormElement
}

describe('labelled hidden native controls in a real browser', () => {
  it('submits the selected value and checked state', async () => {
    const form = mountForm(true)
    await expect.poll(() => form.querySelector('select option[value="news"]')).not.toBeNull()

    expect(form.checkValidity()).toBe(true)
    expect([...new FormData(form)]).toEqual([['topic', 'news'], ['agree', 'on']])
    expect(form.querySelector('select')?.getAttribute('aria-label')).toBe('topic')
    expect(form.querySelector('input')?.getAttribute('aria-label')).toBe('agree')
  })

  it('keeps native required validation and select autofill working', async () => {
    const form = mountForm()
    await expect.poll(() => form.querySelector('select option[value="news"]')).not.toBeNull()

    const select = form.querySelector('select')!
    const checkbox = form.querySelector('input')!
    expect(select.validity.valueMissing).toBe(true)
    expect(checkbox.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)

    select.value = 'news'
    select.dispatchEvent(new Event('input', { bubbles: true }))
    await expect.poll(() => form.querySelector('[role="combobox"]')?.textContent).toBe('News')
    expect(form.checkValidity()).toBe(false)

    await userEvent.click(form.querySelector<HTMLElement>('[role="checkbox"]')!)

    expect(form.checkValidity()).toBe(true)
    expect([...new FormData(form)]).toEqual([['topic', 'news'], ['agree', 'on']])
  })
})
