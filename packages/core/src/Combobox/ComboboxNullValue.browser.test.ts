// In a real browser, as Base UI's Combobox: a `''` item is selectable, shows its
// text and submits `''`; a `null` item clears; `required` treats both as missing,
// and a multiple selection holding `''` submits.
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

const items = [{ value: null, text: 'None' }, { value: '', text: 'Empty' }, { value: 'a', text: 'Apple' }]

function mountCombobox(rootProps: Record<string, unknown> = {}, initial: any = 'a') {
  const model = ref<any>(initial)
  const submitted: FormData[] = []
  const Fixture = defineComponent({
    setup() {
      return () => h('form', {
        onSubmit: (event: SubmitEvent) => {
          event.preventDefault()
          submitted.push(new FormData(event.target as HTMLFormElement))
        },
      }, [
        h(ComboboxRoot, {
          'name': 'fruit',
          'modelValue': model.value,
          'onUpdate:modelValue': (v: any) => { model.value = v },
          'displayValue': (v: any) => items.find(item => item.value === v)?.text ?? '',
          ...rootProps,
        }, () => [
          h(ComboboxAnchor, () => [
            h(ComboboxInput, { 'data-testid': 'input', 'aria-label': 'Fruit', 'style': 'width: 160px; height: 32px;' }),
            h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          ]),
          h(ComboboxPortal, () => h(ComboboxContent, { position: 'popper', style: 'background: white;' }, () =>
            h(ComboboxViewport, () => items.map(item => h(ComboboxItem, { key: String(item.value), value: item.value, textValue: item.text, style: 'height: 24px;' }, () => item.text))))),
        ]),
        h('button', { 'type': 'submit', 'data-testid': 'submit' }, 'Submit'),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const option = (text: string) => Array.from(document.querySelectorAll<HTMLElement>('[role=option]')).find(el => el.textContent === text)
  const form = () => document.querySelector('form')!
  return { wrapper, get, option, model, submitted, form }
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

describe('combobox with an empty-string and a null item, in a real browser', () => {
  it('selects `\'\'` (selected item, its text in the input) and submits `\'\'`; the null item clears', async () => {
    const { wrapper, get, option, model, submitted } = mountCombobox()
    unmount = () => wrapper.unmount()
    const input = () => get('input') as HTMLInputElement
    await expect.poll(() => input().value).toBe('Apple')

    await userEvent.click(get('trigger'))
    await expect.poll(() => option('Empty')).toBeTruthy()
    await userEvent.click(option('Empty')!)
    await expect.poll(() => model.value).toBe('')
    await expect.poll(() => input().value).toBe('Empty')

    await userEvent.click(get('submit'))
    await expect.poll(() => submitted.length).toBe(1)
    expect(submitted[0].get('fruit')).toBe('')

    await userEvent.click(get('trigger'))
    await expect.poll(() => option('None')).toBeTruthy()
    expect(option('Empty')!.getAttribute('aria-selected')).toBe('true')
    await userEvent.click(option('None')!)
    await expect.poll(() => model.value).toBe(null)
    await expect.poll(() => input().value).toBe('')
  })

  it('`required` blocks submitting `null` and `\'\'`, allows a non-empty value', async () => {
    const { wrapper, get, model, submitted, form } = mountCombobox({ required: true })
    unmount = () => wrapper.unmount()
    await expect.poll(() => (get('input') as HTMLInputElement).value).toBe('Apple')
    expect(form().checkValidity()).toBe(true)

    // Checked through the form's own constraint validation rather than clicking
    // submit: a blocked submit opens the browser's validation popup.
    model.value = ''
    await expect.poll(() => form().checkValidity()).toBe(false)
    model.value = null
    await expect.poll(() => form().checkValidity()).toBe(false)
    expect(submitted).toHaveLength(0)

    model.value = 'a'
    await expect.poll(() => form().checkValidity()).toBe(true)
    await userEvent.click(get('submit'))
    await expect.poll(() => submitted.length).toBe(1)
    expect(submitted[0].get('fruit')).toBe('a')
  })

  it('a required multiple combobox submits a selection holding `\'\'` and `null`, and blocks `[]`', async () => {
    const { wrapper, get, option, model, submitted, form } = mountCombobox({ required: true, multiple: true }, [])
    unmount = () => wrapper.unmount()
    await expect.poll(() => form().checkValidity()).toBe(false)

    await userEvent.click(get('trigger'))
    await expect.poll(() => option('Empty')).toBeTruthy()
    await userEvent.click(option('Empty')!)
    await userEvent.click(option('None')!)
    await expect.poll(() => model.value).toEqual(['', null])
    await expect.poll(() => form().checkValidity()).toBe(true)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(get('submit'))
    await expect.poll(() => submitted.length).toBe(1)
    expect(submitted[0].get('fruit[0]')).toBe('')
    expect(submitted[0].get('fruit[1]')).toBe('')
  })
})
