// #2484 in a real browser, as Base UI: a `''` item is selectable, submits `''`
// and reads as empty (placeholder); `null` clears; `required` treats both as missing.
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const items = [{ value: null, text: 'None' }, { value: '', text: 'Empty' }, { value: 'a', text: 'Apple' }]

function mountSelect(rootProps: Record<string, unknown> = {}) {
  const model = ref<any>('a')
  const submitted: FormData[] = []
  const Fixture = defineComponent({
    setup() {
      return () => h('form', {
        onSubmit: (event: SubmitEvent) => {
          event.preventDefault()
          submitted.push(new FormData(event.target as HTMLFormElement))
        },
      }, [
        h(SelectRoot, { 'name': 'fruit', 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v }, ...rootProps }, () => [
          h(SelectTrigger, { 'data-testid': 'trigger', 'aria-label': 'Fruit', 'style': 'width: 160px; height: 32px;' }, () =>
            h(SelectValue, { 'data-testid': 'value', 'placeholder': 'Pick a fruit' })),
          h(SelectPortal, () => h(SelectContent, { position: 'popper', style: 'background: white;' }, () =>
            h(SelectViewport, () => items.map(item => h(SelectItem, { key: String(item.value), value: item.value, style: 'height: 24px;' }, () =>
              h(SelectItemText, () => item.text)))))),
        ]),
        h('button', { 'type': 'submit', 'data-testid': 'submit' }, 'Submit'),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const option = (text: string) => Array.from(document.querySelectorAll<HTMLElement>('[role=option]')).find(el => el.textContent === text)
  const nativeSelect = () => document.querySelector('select')!
  return { wrapper, get, option, model, submitted, nativeSelect }
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

describe('select with an empty-string and a null item, in a real browser', () => {
  it('selects `\'\'` (checked item, placeholder shown) and submits `\'\'`; the null item clears', async () => {
    const { wrapper, get, option, model, submitted } = mountSelect()
    unmount = () => wrapper.unmount()
    await expect.poll(() => get('value').textContent).toBe('Apple')

    await userEvent.click(get('trigger'))
    await expect.poll(() => option('Empty')).toBeTruthy()
    await userEvent.click(option('Empty')!)
    await expect.poll(() => model.value).toBe('')
    expect(get('value').textContent).toBe('Pick a fruit')
    expect(get('trigger').hasAttribute('data-placeholder')).toBe(true)

    await userEvent.click(get('submit'))
    await expect.poll(() => submitted.length).toBe(1)
    expect(submitted[0].get('fruit')).toBe('')

    await userEvent.click(get('trigger'))
    await expect.poll(() => option('None')).toBeTruthy()
    expect(option('Empty')!.getAttribute('aria-selected')).toBe('true')
    await userEvent.click(option('None')!)
    await expect.poll(() => model.value).toBe(null)
    expect(get('value').textContent).toBe('Pick a fruit')
    expect(get('trigger').hasAttribute('data-placeholder')).toBe(true)
  })

  it('`required` blocks submitting `null` and `\'\'`, allows a non-empty value', async () => {
    const { wrapper, get, model, submitted, nativeSelect } = mountSelect({ required: true })
    unmount = () => wrapper.unmount()
    await expect.poll(() => get('value').textContent).toBe('Apple')
    expect(nativeSelect().checkValidity()).toBe(true)

    model.value = ''
    await expect.poll(() => nativeSelect().validity.valueMissing).toBe(true)
    await userEvent.click(get('submit'))
    model.value = null
    await expect.poll(() => nativeSelect().validity.valueMissing).toBe(true)
    await userEvent.click(get('submit'))
    expect(submitted).toHaveLength(0)

    model.value = 'a'
    await expect.poll(() => nativeSelect().checkValidity()).toBe(true)
    await userEvent.click(get('submit'))
    await expect.poll(() => submitted.length).toBe(1)
    expect(submitted[0].get('fruit')).toBe('a')
  })
})
