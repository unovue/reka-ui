import type { VNode } from 'vue'
import type { FormResetCase } from './__test__/formResetCases'
import type { UseFormReturn } from './useForm'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { FieldRoot } from '@/Field'
import { formResetCases } from './__test__/formResetCases'
import FormRoot from './FormRoot.vue'
import { useForm } from './useForm'

// A native form reset in a real browser: the `reset` event, then the browser
// resetting the native controls of the form. jsdom dispatches the event too
// (see `formReset.test.ts`), but only a browser shows what the form submits
// afterwards, and how a reset button, `form="id"` and a disabled fieldset behave.

interface ModelEvent { value: unknown, reason: string, type: string | undefined }

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

async function settle() {
  await nextTick()
  // The Field reads the value a reset left one task later.
  await new Promise(resolve => setTimeout(resolve, 20))
  await nextTick()
}

function mountForm(render: () => VNode | VNode[]) {
  wrapper = mount({ render }, { attachTo: document.body })
  const form = wrapper.get('form').element as HTMLFormElement
  return {
    form,
    data: () => Array.from(new FormData(form).entries()),
    resetButton: () => form.querySelector<HTMLElement>('button[type="reset"]')!,
  }
}

function recorder() {
  const events: ModelEvent[] = []
  return {
    events,
    'onUpdate:modelValue': (value: unknown, details: { reason: string, event?: Event }) => {
      events.push({ value, reason: details.reason, type: details.event?.type })
    },
  }
}

const resetButton = () => h('button', { type: 'reset' }, 'Reset')

const resets: [string, (form: HTMLFormElement) => unknown][] = [
  ['form.reset()', form => form.reset()],
  ['a reset button', form => userEvent.click(form.querySelector('button[type="reset"]')!)],
]

describe.each(formResetCases.map(item => [item.name, item] as [string, FormResetCase]))('given a %s in a form', (_, item) => {
  describe.each(resets)('when the form is reset with %s', (_, reset) => {
    it('goes back to its `defaultValue`, and submits it', async () => {
      const { events, ...listeners } = recorder()
      const { form, data } = mountForm(() => h('form', [item.render({ name: 'field', defaultValue: item.defaultValue, ...listeners }), resetButton()]))
      await settle()
      expect(item.display(form)).toBe(item.defaultDisplay)
      expect(data()).toEqual(item.defaultData)

      await item.change(form)
      await settle()
      expect(item.display(form)).not.toBe(item.defaultDisplay)
      expect(data()).not.toEqual(item.defaultData)
      events.length = 0

      await reset(form)
      await settle()

      expect(item.display(form)).toBe(item.defaultDisplay)
      expect(data()).toEqual(item.defaultData)
      // One change, reported like any other: `'none'` and the `reset` event.
      expect(events.map(({ reason, type }) => ({ reason, type }))).toEqual([{ reason: 'none', type: 'reset' }])
    })

    it('leaves its `FieldRoot` pristine in a `FormRoot`', async () => {
      const { form, data } = mountForm(() => h(FormRoot, () => [
        h(FieldRoot, { 'data-testid': 'field' }, () => item.render({ name: 'field', defaultValue: item.defaultValue })),
        resetButton(),
      ]))
      const field = form.querySelector('[data-testid="field"]')!
      const state = () => ['dirty', 'touched', 'filled'].filter(name => field.hasAttribute(`data-${name}`))
      await settle()
      const initialState = state()

      await item.change(form)
      await settle()
      expect(state()).toContain('dirty')

      await reset(form)
      await settle()

      expect(item.display(form)).toBe(item.defaultDisplay)
      expect(data()).toEqual(item.defaultData)
      expect(state()).toEqual(initialState)

      // The default is the baseline again: the same change is dirty again.
      await item.change(form)
      await settle()
      expect(state()).toContain('dirty')
    })
  })

  it('goes back to its empty value without a `defaultValue`', async () => {
    const { form, data } = mountForm(() => h('form', [item.render({ name: 'field' })]))
    await settle()
    const initialDisplay = item.display(form)
    const initialData = data()

    await item.change(form)
    await settle()
    expect(item.display(form)).not.toBe(initialDisplay)

    form.reset()
    await settle()

    expect(item.display(form)).toBe(initialDisplay)
    expect(data()).toEqual(initialData)
  })

  it('asks a controlled parent for its `defaultValue`', async () => {
    const model = ref<unknown>(item.defaultValue)
    const { events, ...listeners } = recorder()
    const { form, data } = mountForm(() => h('form', [item.render({
      'name': 'field',
      'defaultValue': item.defaultValue,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: unknown, details: { reason: string, event?: Event }) => {
        listeners['onUpdate:modelValue'](value, details)
        model.value = value
      },
    })]))
    await settle()

    await item.change(form)
    await settle()
    expect(item.display(form)).not.toBe(item.defaultDisplay)
    events.length = 0

    form.reset()
    await settle()

    expect(events.map(({ reason, type }) => ({ reason, type }))).toEqual([{ reason: 'none', type: 'reset' }])
    expect(item.display(form)).toBe(item.defaultDisplay)
    expect(data()).toEqual(item.defaultData)
  })

  it('keeps its value when the `reset` event is prevented', async () => {
    const { events, ...listeners } = recorder()
    const { form, data } = mountForm(() => h('form', { onReset: (event: Event) => event.preventDefault() }, [
      item.render({ name: 'field', defaultValue: item.defaultValue, ...listeners }),
      resetButton(),
    ]))
    await settle()
    await item.change(form)
    await settle()
    const changedDisplay = item.display(form)
    const changedData = data()
    events.length = 0

    form.reset()
    await userEvent.click(form.querySelector('button[type="reset"]')!)
    await settle()

    expect(events).toEqual([])
    expect(item.display(form)).toBe(changedDisplay)
    expect(data()).toEqual(changedData)
  })
})

describe.each([
  // A number field's value follows the typed text, so its reset is a change.
  ['NumberField', '5', '7', 1],
  ['Combobox', 'a', 'x', 0],
  ['ColorField', '#ff0000', 'x', 0],
  ['Editable', 'hello', 'x', 0],
])('given a %s with text typed but not committed', (name, text, key, changes) => {
  const item = formResetCases.find(item => item.name === name)!

  it('shows its value again when the form is reset', async () => {
    const { events, ...listeners } = recorder()
    const { form, data } = mountForm(() => h('form', [item.render({ name: 'field', defaultValue: item.defaultValue, ...listeners })]))
    await settle()
    // An Editable shows its input once the preview is focused.
    form.querySelector<HTMLElement>('[data-testid="preview"]')?.focus()
    await settle()
    const input = form.querySelector<HTMLInputElement>('input:not([aria-hidden])')!
    input.focus()
    await userEvent.keyboard(key)
    await settle()
    expect(input.value).not.toBe(text)

    form.reset()
    await settle()

    expect(input.value).toBe(text)
    expect(data()).toEqual(item.defaultData)
    // Only a value that left its default is reported.
    expect(events.filter(event => event.type === 'reset')).toHaveLength(changes)
  })
})

describe('given a form reset that a listener prevents', () => {
  const checkbox = (form: ParentNode) => form.querySelector('[role="checkbox"]')!

  it('keeps the value and the Field state when it is prevented above the form', async () => {
    const prevent = (event: Event) => event.preventDefault()
    document.addEventListener('reset', prevent)
    try {
      const { form } = mountForm(() => h(FormRoot, () => h(FieldRoot, { 'data-testid': 'field' }, () => h(CheckboxRoot, { name: 'field', defaultValue: true }))))
      await settle()
      await userEvent.click(checkbox(form))
      await settle()

      form.reset()
      await settle()

      expect(checkbox(form).getAttribute('aria-checked')).toBe('false')
      expect(form.querySelector('[data-testid="field"]')!.hasAttribute('data-dirty')).toBe(true)
    }
    finally {
      document.removeEventListener('reset', prevent)
    }
  })
})

describe('given `useForm().reset()` in a `FormRoot`', () => {
  it('resets a Reka control once and leaves its field pristine', async () => {
    let form!: UseFormReturn
    const Probe = defineComponent(() => {
      form = useForm()
      return () => null
    })
    const { events, ...listeners } = recorder()
    const mounted = mountForm(() => h(FormRoot, () => [
      h(FieldRoot, { 'data-testid': 'field' }, () => h(CheckboxRoot, { name: 'field', defaultValue: true, ...listeners })),
      h(Probe),
    ]))
    const field = mounted.form.querySelector('[data-testid="field"]')!
    await settle()
    await userEvent.click(mounted.form.querySelector('[role="checkbox"]')!)
    await settle()
    expect(field.hasAttribute('data-dirty')).toBe(true)
    events.length = 0

    form.reset()
    await settle()

    expect(mounted.form.querySelector('[role="checkbox"]')!.getAttribute('aria-checked')).toBe('true')
    expect(mounted.data()).toEqual([['field', 'on']])
    expect(events.map(({ reason, type }) => ({ reason, type }))).toEqual([{ reason: 'none', type: 'reset' }])
    expect(field.hasAttribute('data-dirty')).toBe(false)
    expect(field.hasAttribute('data-touched')).toBe(false)
  })
})

describe('given controls associated like native ones', () => {
  const checked = (root: ParentNode, testId: string) => root.querySelector(`[data-testid="${testId}"]`)!.getAttribute('aria-checked')

  it('resets a control outside the form that names it with `form="id"`, and not one that names another form', async () => {
    const { form } = mountForm(() => h('div', [
      h('form', { id: 'reset-target' }, [
        h(CheckboxRoot, { 'data-testid': 'inside', 'defaultValue': true }),
        h(CheckboxRoot, { 'data-testid': 'elsewhere', 'form': 'reset-other', 'defaultValue': true }),
      ]),
      h('form', { id: 'reset-other' }),
      h(CheckboxRoot, { 'data-testid': 'outside', 'form': 'reset-target', 'defaultValue': true }),
      h(CheckboxRoot, { 'data-testid': 'unrelated', 'defaultValue': true }),
    ]))
    await settle()
    for (const testId of ['inside', 'elsewhere', 'outside', 'unrelated'])
      await userEvent.click(document.querySelector(`[data-testid="${testId}"]`)!)
    await settle()

    form.reset()
    await settle()

    expect(checked(document, 'inside')).toBe('true')
    expect(checked(document, 'outside')).toBe('true')
    expect(checked(document, 'elsewhere')).toBe('false')
    expect(checked(document, 'unrelated')).toBe('false')
  })

  it('resets a disabled control, and one in a disabled fieldset', async () => {
    const disabled = ref(false)
    const { form, data } = mountForm(() => h('form', [
      h(CheckboxRoot, { 'data-testid': 'own', 'name': 'own', 'defaultValue': true, 'disabled': disabled.value }),
      h('fieldset', { disabled: disabled.value }, h(CheckboxRoot, { 'data-testid': 'fieldset', 'name': 'fieldset', 'defaultValue': true })),
    ]))
    await settle()
    await userEvent.click(form.querySelector('[data-testid="own"]')!)
    await userEvent.click(form.querySelector('[data-testid="fieldset"]')!)
    disabled.value = true
    await settle()
    expect(checked(form, 'own')).toBe('false')
    expect(checked(form, 'fieldset')).toBe('false')

    form.reset()
    disabled.value = false
    await settle()

    expect(checked(form, 'own')).toBe('true')
    expect(checked(form, 'fieldset')).toBe('true')
    expect(data()).toEqual([['own', 'on'], ['fieldset', 'on']])
  })

  it('resets a control in a form inside a shadow root', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    const container = document.createElement('div')
    root.append(container)
    wrapper = mount({ render: () => h('form', h(CheckboxRoot, { 'data-testid': 'shadow', 'defaultValue': true })) }, { attachTo: container })
    await settle()
    await userEvent.click(root.querySelector('[data-testid="shadow"]')!)
    await settle()
    expect(checked(root, 'shadow')).toBe('false')

    root.querySelector('form')!.reset()
    await settle()

    expect(checked(root, 'shadow')).toBe('true')
    wrapper.unmount()
    wrapper = undefined
    host.remove()
  })
})
