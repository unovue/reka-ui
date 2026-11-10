import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { SwitchRoot } from '@/Switch'
import { formResetBinder } from './formReset'

// The delegated `reset` listener and the controls bound to it, in jsdom: what a
// reset does to the model (uncontrolled, controlled, cancelled) and to a Field.
// What the browser does around it is in `Form/FormReset.browser.test.ts`.

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function mountForm(render: () => VNode | VNode[], attach = true) {
  wrapper = mount({ render }, attach ? { attachTo: document.body } : {})
  const form = wrapper.find('form').element as HTMLFormElement
  const checkbox = (testId = 'checkbox') => form.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!
  return { form, checkbox, checked: (testId?: string) => checkbox(testId).getAttribute('aria-checked') }
}

/** Lets the Field read the value the reset left (one task later). */
async function afterReset() {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve))
  await nextTick()
}

describe('given an uncontrolled control in a form', () => {
  it('goes back to `defaultValue` when the form is reset', async () => {
    const onUpdate = vi.fn()
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true, 'onUpdate:modelValue': onUpdate })))
    checkbox().click()
    await nextTick()
    expect(checked()).toBe('false')
    onUpdate.mockClear()

    form.reset()
    await nextTick()

    expect(checked()).toBe('true')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0]
    expect(value).toBe(true)
    expect(details.reason).toBe('none')
    expect(details.event.type).toBe('reset')
  })

  it('goes back to its empty value without a `defaultValue`', async () => {
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxRoot, { 'data-testid': 'checkbox' })))
    checkbox().click()
    await nextTick()
    expect(checked()).toBe('true')

    form.reset()
    await nextTick()

    expect(checked()).toBe('false')
  })

  it('emits nothing when it already holds its default', async () => {
    const onUpdate = vi.fn()
    const { form } = mountForm(() => h('form', h(CheckboxRoot, { 'defaultValue': true, 'onUpdate:modelValue': onUpdate })))
    form.reset()
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('keeps its value when `beforeUpdate:modelValue` cancels the reset', async () => {
    const onUpdate = vi.fn()
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxRoot, {
      'data-testid': 'checkbox',
      'defaultValue': true,
      'onBeforeUpdate:modelValue': (_: unknown, details: { event?: Event, cancel: () => void }) => {
        if (details.event?.type === 'reset')
          details.cancel()
      },
      'onUpdate:modelValue': onUpdate,
    })))
    checkbox().click()
    await nextTick()
    onUpdate.mockClear()

    form.reset()
    await nextTick()

    expect(checked()).toBe('false')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('keeps its value when the `reset` event is prevented', async () => {
    const { form, checkbox, checked } = mountForm(() => h('form', { onReset: (event: Event) => event.preventDefault() }, h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true })))
    checkbox().click()
    await nextTick()

    form.reset()
    await nextTick()

    expect(checked()).toBe('false')
  })

  it('resets while disabled, as a native control does', async () => {
    const disabled = ref(false)
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true, 'disabled': disabled.value })))
    checkbox().click()
    disabled.value = true
    await nextTick()
    expect(checked()).toBe('false')

    form.reset()
    await nextTick()

    expect(checked()).toBe('true')
  })

  it('resets in a tree that is not in the document', async () => {
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true })), false)
    checkbox().click()
    await nextTick()
    expect(checked()).toBe('false')

    form.reset()
    await nextTick()

    expect(checked()).toBe('true')
  })

  it('is left alone outside the form, and by another form\'s reset', async () => {
    mountForm(() => h('div', [
      h('form', { id: 'first' }, h(CheckboxRoot, { 'data-testid': 'first', 'defaultValue': true })),
      h('form', { id: 'second' }, h(CheckboxRoot, { 'data-testid': 'second', 'defaultValue': true })),
      h(CheckboxRoot, { 'data-testid': 'outside', 'defaultValue': true }),
    ]))
    const root = wrapper!.element as HTMLElement
    for (const testId of ['first', 'second', 'outside'])
      root.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!.click()
    await nextTick()

    root.querySelector<HTMLFormElement>('#first')!.reset()
    await nextTick()

    const read = (testId: string) => root.querySelector(`[data-testid="${testId}"]`)!.getAttribute('aria-checked')
    expect(read('first')).toBe('true')
    expect(read('second')).toBe('false')
    expect(read('outside')).toBe('false')
  })
})

describe('given a controlled control in a form', () => {
  it('emits its `defaultValue` and lets the parent decide', async () => {
    const model = ref(false)
    const apply = ref(false)
    const onUpdate = vi.fn((value: unknown) => {
      if (apply.value)
        model.value = value as boolean
    })
    const { form, checked } = mountForm(() => h('form', h(SwitchRoot, { 'data-testid': 'checkbox', 'defaultValue': true, 'modelValue': model.value, 'onUpdate:modelValue': onUpdate })))
    expect(checked()).toBe('false')

    form.reset()
    await nextTick()
    expect(onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'none' }))
    // The parent did not apply it.
    expect(checked()).toBe('false')

    apply.value = true
    form.reset()
    await nextTick()
    expect(checked()).toBe('true')
  })

  it('emits the empty value without a `defaultValue`', async () => {
    const model = ref(true)
    const { form, checked } = mountForm(() => h('form', h(SwitchRoot, { 'data-testid': 'checkbox', 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as boolean } })))
    expect(checked()).toBe('true')

    form.reset()
    await nextTick()

    expect(model.value).toBe(false)
    expect(checked()).toBe('false')
  })
})

describe('given a group in a form', () => {
  it('resets once, through the group', async () => {
    const onGroupUpdate = vi.fn()
    const onItemUpdate = vi.fn()
    const { form, checkbox, checked } = mountForm(() => h('form', h(CheckboxGroupRoot, { 'defaultValue': ['a'], 'onUpdate:modelValue': onGroupUpdate }, () => [
      h(CheckboxRoot, { 'data-testid': 'a', 'value': 'a', 'onUpdate:modelValue': onItemUpdate }),
      h(CheckboxRoot, { 'data-testid': 'b', 'value': 'b', 'onUpdate:modelValue': onItemUpdate }),
    ])))
    checkbox('b').click()
    await nextTick()
    expect(checked('b')).toBe('true')
    onGroupUpdate.mockClear()

    form.reset()
    await nextTick()

    expect(checked('a')).toBe('true')
    expect(checked('b')).toBe('false')
    expect(onGroupUpdate).toHaveBeenCalledTimes(1)
    expect(onGroupUpdate).toHaveBeenLastCalledWith(['a'], expect.objectContaining({ reason: 'none' }))
    expect(onItemUpdate).not.toHaveBeenCalled()
  })
})

describe('given a control in a `FieldRoot`', () => {
  const fieldState = (form: HTMLElement) => ['dirty', 'touched', 'filled'].filter(name => form.querySelector('[data-testid="field"]')!.hasAttribute(`data-${name}`))

  it.each([
    ['a plain form', (children: () => VNode) => h('form', children())],
    ['a `FormRoot`', (children: () => VNode) => h(FormRoot, children)],
  ])('leaves the field pristine, with `filled` for the default, in %s', async (_, renderForm) => {
    const { form, checkbox, checked } = mountForm(() => renderForm(() => h(FieldRoot, { 'data-testid': 'field' }, () => h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true }))))
    await nextTick()
    expect(fieldState(form)).toEqual(['filled'])
    checkbox().focus()
    checkbox().click()
    checkbox().blur()
    await nextTick()
    expect(fieldState(form)).toEqual(['dirty', 'touched'])

    form.reset()
    await afterReset()

    expect(checked()).toBe('true')
    expect(fieldState(form)).toEqual(['filled'])
  })

  it('keeps the field state when the `reset` event is prevented', async () => {
    const { form, checkbox } = mountForm(() => h(FormRoot, { onReset: (event: Event) => event.preventDefault() }, () => h(FieldRoot, { 'data-testid': 'field' }, () => h(CheckboxRoot, { 'data-testid': 'checkbox', 'defaultValue': true }))))
    await nextTick()
    checkbox().click()
    await nextTick()

    form.reset()
    await afterReset()

    expect(fieldState(form)).toEqual(['dirty'])
  })
})

describe('formResetBinder', () => {
  it('binds the element it is mounted on, and nothing for a falsy handler', () => {
    const handler = vi.fn()
    expect(formResetBinder(undefined)).toBeUndefined()
    const { form } = mountForm(() => h('form', h('div', { onVnodeMounted: formResetBinder(handler) })))

    form.reset()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].type).toBe('reset')
  })

  it('binds the element that replaces it', async () => {
    const handler = vi.fn()
    const tag = ref('div')
    const bind = formResetBinder(handler)
    const { form } = mountForm(() => h('form', h(tag.value, { key: tag.value, onVnodeMounted: bind })))
    tag.value = 'span'
    await nextTick()

    form.reset()

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('leaves what is inside a control to that control, but looks inside a field', () => {
    const calls: string[] = []
    const bind = (name: string, field?: boolean) => ({ onVnodeMounted: formResetBinder(() => calls.push(name), field) })
    const { form } = mountForm(() => h('form', h('div', bind('field', true), h('div', bind('control'), h('span', bind('nested'))))))

    form.reset()

    expect(calls).toEqual(['field', 'control'])
  })

  it('renders on the server without touching the document', async () => {
    const app = createSSRApp({ render: () => h('form', h(FieldRoot, () => h(CheckboxRoot, { name: 'field', defaultValue: true }))) })
    await expect(renderToString(app)).resolves.toContain('role="checkbox"')
  })
})
