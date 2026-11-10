import type { UseFormReturn } from '../index'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { FieldControl, FieldLabel, FieldRoot, FormRoot, useFieldControl, useForm } from '../index'

describe('useForm and useFieldControl in a real browser', () => {
  let wrapper: ReturnType<typeof mount> | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('reset() restores the default values natively and clears the fields\' state', async () => {
    let form!: UseFormReturn
    const Probe = defineComponent(() => {
      form = useForm()
      return () => null
    })
    wrapper = mount(defineComponent(() => () => h(FormRoot, null, () => [
      // `^value` sets the attribute: the default value a native reset restores.
      h(FieldRoot, { 'name': 'email', 'data-testid': 'field' }, () => h(FieldControl, { '^value': 'a@b.co' })),
      h(Probe),
    ])), { attachTo: document.body })
    const input = document.querySelector<HTMLInputElement>('[data-testid="field"] input')!
    const field = document.querySelector('[data-testid="field"]')!

    await userEvent.fill(input, 'changed')
    await userEvent.tab()
    await expect.poll(() => field.hasAttribute('data-dirty')).toBe(true)
    expect(field.hasAttribute('data-touched')).toBe(true)
    expect(form.getValues()).toEqual({ email: 'changed' })

    form.reset()
    await expect.poll(() => field.hasAttribute('data-dirty')).toBe(false)
    expect(field.hasAttribute('data-touched')).toBe(false)
    expect(input.value).toBe('a@b.co')
    expect(form.getValues()).toEqual({ email: 'a@b.co' })
  })

  it('a label click focuses a custom control, and tabbing away touches the field', async () => {
    const Editor = defineComponent(() => {
      let element: HTMLElement | null = null
      const field = useFieldControl({ value: () => element?.textContent ?? '', element: () => element })
      return () => h('div', {
        ...field.control.attrs.value,
        ref: (el) => { element = el as HTMLElement | null },
        role: 'textbox',
        contenteditable: 'true',
        onInput: () => field.input(),
      })
    })
    wrapper = mount(defineComponent(() => () => h(FieldRoot, { 'data-testid': 'field' }, () => [
      h(FieldLabel, { nativeLabel: false, as: 'span' }, () => 'Note'),
      h(Editor),
      h('button', 'After'),
    ])), { attachTo: document.body })
    const field = document.querySelector('[data-testid="field"]')!
    const editor = document.querySelector<HTMLElement>('[role="textbox"]')!

    await userEvent.click(document.querySelector('[data-testid="field"] span')!)
    await expect.poll(() => document.activeElement).toBe(editor)
    expect(field.hasAttribute('data-focused')).toBe(true)

    await userEvent.keyboard('hello')
    await expect.poll(() => field.hasAttribute('data-dirty')).toBe(true)
    expect(editor.hasAttribute('data-filled')).toBe(true)

    await userEvent.tab()
    await expect.poll(() => field.hasAttribute('data-touched')).toBe(true)
    expect(field.hasAttribute('data-focused')).toBe(false)
  })
})
