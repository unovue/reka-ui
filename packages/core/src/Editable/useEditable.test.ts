import type { UseEditableProps } from './useEditable'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { EditableArea, EditableInput, EditablePreview, EditableRoot, EditableSubmitTrigger } from '.'
import * as Reka from '../index'
import { useEditable } from './useEditable'

function scoped(props: UseEditableProps = {}) {
  const scope = effectScope()
  const editable = scope.run(() => useEditable(props))!
  return editable
}

function enter(target: Record<string, any>, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, ...init })
  target.onKeydown(event)
  return event
}

function type(e: ReturnType<typeof useEditable>, value: string) {
  e.input.props.value.onInput({ target: { value } } as unknown as Event)
}

describe('useEditable — model', () => {
  it('is uncontrolled by default, starting from defaultValue', () => {
    const e = scoped({ defaultValue: 'a' })
    expect(e.modelValue.value).toBe('a')
    expect(e.inputValue.value).toBe('a')
    expect(e.isControlled.value).toBe(false)
    expect(e.isEditing.value).toBe(false)
  })

  it('commits the draft only on submit, then leaves edit mode', () => {
    const onUpdate = vi.fn()
    const onSubmit = vi.fn()
    const onStateChange = vi.fn()
    const e = scoped({ onUpdate, onSubmit, onStateChange })
    e.edit()
    type(e, 'hello')
    expect(e.modelValue.value).toBe('')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(e.submit()).toBe(true)
    expect(e.modelValue.value).toBe('hello')
    expect(e.isEditing.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe('hello')
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
    expect(onSubmit).toHaveBeenCalledWith('hello')
    expect(onStateChange.mock.calls.map(c => c[0])).toEqual(['edit', 'submit'])
  })

  it('cancel() reverts the draft on the next edit and does not commit', () => {
    const onUpdate = vi.fn()
    const e = scoped({ defaultValue: 'a', onUpdate })
    e.edit()
    type(e, 'b')
    e.cancel()
    expect(e.modelValue.value).toBe('a')
    expect(e.isEditing.value).toBe(false)
    e.edit()
    expect(e.inputValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('does not emit update:modelValue when the draft is unchanged, but still submits', () => {
    const emit = vi.fn()
    const e = scoped({ defaultValue: 'a', emit })
    e.edit()
    expect(e.submit()).toBe(true)
    expect(emit.mock.calls.map(c => c[0])).toEqual(['update:state', 'update:state', 'submit'])
    expect(e.isEditing.value).toBe(false)
  })

  it('emits beforeUpdate, update, update:state and submit in that order', () => {
    const emit = vi.fn()
    const e = scoped({ emit })
    e.edit()
    type(e, 'x')
    e.submit()
    expect(emit.mock.calls.map(c => c[0])).toEqual(['update:state', 'beforeUpdate:modelValue', 'update:modelValue', 'update:state', 'submit'])
  })

  it('controlled: does not write, follows the parent, and resets the draft when the model changes', async () => {
    const model = ref<string | undefined>('a')
    const onUpdate = vi.fn((value: string) => {
      model.value = value
    })
    const e = scoped({ modelValue: () => model.value, onUpdate })
    expect(e.isControlled.value).toBe(true)
    e.edit()
    type(e, 'b')
    e.submit()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(e.modelValue.value).toBe('b')
    model.value = 'c'
    await nextTick()
    expect(e.inputValue.value).toBe('c')
  })

  it('controlled without a parent write keeps the old value', () => {
    const onUpdate = vi.fn()
    const e = scoped({ modelValue: () => 'a', onUpdate })
    e.edit()
    type(e, 'b')
    e.submit()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(e.modelValue.value).toBe('a')
  })

  it('ref-owned mode writes through the passed ref', () => {
    const model = ref('a')
    const e = scoped({ modelValue: model })
    e.edit()
    type(e, 'b')
    e.submit()
    expect(model.value).toBe('b')
  })
})

describe('useEditable — cancellation', () => {
  it('details.cancel() vetoes the commit and keeps edit mode with the draft', () => {
    const onUpdate = vi.fn()
    const onSubmit = vi.fn()
    const e = scoped({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate, onSubmit })
    e.edit()
    type(e, 'nope')
    expect(e.submit()).toBe(false)
    expect(e.modelValue.value).toBe('')
    expect(e.isEditing.value).toBe(true)
    expect(e.inputValue.value).toBe('nope')
    expect(e.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('a cancelled blur submit keeps edit mode on', () => {
    const e = scoped({ onBeforeUpdate: (_v, details) => details.cancel() })
    e.edit()
    type(e, 'x')
    e.dismiss('focus-outside')
    expect(e.isEditing.value).toBe(true)
  })

  it('one outside interaction makes one cancelled attempt, the next interaction tries again', async () => {
    const onBeforeUpdate = vi.fn((_v: string, details: { cancel: () => void }) => details.cancel())
    const e = scoped({ onBeforeUpdate })
    e.edit()
    type(e, 'x')
    // A pointer press outside reports outside-press, then the focus move reports focus-outside.
    e.dismiss('outside-press')
    e.dismiss('focus-outside')
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdate.mock.calls[0][1]).toMatchObject({ reason: 'outside-press' })
    await new Promise(resolve => setTimeout(resolve))
    e.dismiss('focus-outside')
    expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
    expect(e.isEditing.value).toBe(true)
  })
})

describe('useEditable — touch outside dismiss', () => {
  it('a deferred touch press after a cancelled focus-outside is the same interaction', async () => {
    const onBeforeUpdate = vi.fn((_v: string, details: { cancel: () => void }) => details.cancel())
    const e = scoped({ onBeforeUpdate })
    e.edit()
    type(e, 'x')
    const touchDown = new Event('pointerdown')
    await new Promise(resolve => setTimeout(resolve, 5))
    // Focus moves outside first and is vetoed …
    e.dismiss('focus-outside', new CustomEvent('focus.outside', { detail: { originalEvent: new FocusEvent('focusin') } }))
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    // … then the click that releases the deferred touch press lands in a later task.
    await new Promise(resolve => setTimeout(resolve))
    e.dismiss('outside-press', new CustomEvent('pointerdown.outside', { detail: { originalEvent: touchDown } }))
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(e.isEditing.value).toBe(true)
    // A new press starts a new interaction and tries again.
    await new Promise(resolve => setTimeout(resolve, 5))
    e.dismiss('outside-press', new CustomEvent('pointerdown.outside', { detail: { originalEvent: new Event('pointerdown') } }))
    expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
  })
})

describe('useEditable — reasons', () => {
  it('submit trigger click reports "submit-press" with the event', () => {
    const onUpdate = vi.fn()
    const e = scoped({ onUpdate })
    e.edit()
    type(e, 'x')
    const click = new MouseEvent('click')
    e.submitTrigger.props.value.onClick(click)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'submit-press', event: click })
  })

  it('enter in the input reports "enter-key" when submitMode allows it', () => {
    const onUpdate = vi.fn()
    const e = scoped({ onUpdate, submitMode: 'enter' })
    e.edit()
    type(e, 'x')
    enter(e.input.props.value, { shiftKey: true })
    expect(onUpdate).not.toHaveBeenCalled()
    const event = enter(e.input.props.value)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'enter-key', event })
  })

  it('enter does nothing with submitMode "blur"', () => {
    const onUpdate = vi.fn()
    const e = scoped({ onUpdate, submitMode: 'blur' })
    e.edit()
    type(e, 'x')
    enter(e.input.props.value)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(e.isEditing.value).toBe(true)
  })

  it('escape cancels', () => {
    const e = scoped()
    e.edit()
    e.input.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(e.isEditing.value).toBe(false)
  })

  it('dismiss reports "outside-press" / "focus-outside", or cancels with submitMode "enter"', () => {
    const onUpdate = vi.fn()
    const e = scoped({ onUpdate, submitMode: 'both' })
    e.edit()
    type(e, 'x')
    e.dismiss('outside-press')
    expect(onUpdate.mock.calls[0][1].reason).toBe('outside-press')
    e.edit()
    type(e, 'y')
    e.dismiss('focus-outside')
    expect(onUpdate.mock.calls[1][1].reason).toBe('focus-outside')

    const c = scoped({ onUpdate: vi.fn(), submitMode: 'enter' })
    c.edit()
    type(c, 'z')
    c.dismiss('outside-press')
    expect(c.isEditing.value).toBe(false)
    expect(c.modelValue.value).toBe('')
  })

  it('submit called with a native event (e.g. `@click="submit"`) reports "imperative-action"', () => {
    const onUpdate = vi.fn()
    const e = scoped({ onUpdate })
    e.edit()
    type(e, 'x')
    const click = new MouseEvent('click')
    e.context.submit(click as any)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'imperative-action', event: click })
  })
})

describe('useEditable — part surfaces', () => {
  it('derives data-* from state, never from props', () => {
    const e = scoped({ defaultValue: '', readonly: true })
    for (const part of [e.root, e.area, e.preview, e.input, e.editTrigger, e.submitTrigger, e.cancelTrigger])
      expect(Object.keys(part.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(e.area.attrs.value).toMatchObject({ 'data-placeholder-shown': '', 'data-empty': '', 'data-readonly': '' })
    expect(e.input.attrs.value).toMatchObject({ 'data-readonly': '', 'readonly': true, 'hidden': true })
    expect(e.editTrigger.attrs.value.hidden).toBeUndefined()
    expect(e.submitTrigger.attrs.value.hidden).toBe('')
    e.edit()
    expect(e.area.attrs.value).toMatchObject({ 'data-focus': '', 'data-focused': '' })
    expect(e.area.attrs.value).not.toHaveProperty('data-placeholder-shown')
    expect(e.editTrigger.attrs.value.hidden).toBe('')
    expect(e.submitTrigger.attrs.value.hidden).toBeUndefined()
  })

  it('preview activates on focus or double click per activationMode', () => {
    const f = scoped()
    f.preview.props.value.onFocusin()
    expect(f.isEditing.value).toBe(true)
    const d = scoped({ activationMode: 'dblclick' })
    d.preview.props.value.onFocusin()
    expect(d.isEditing.value).toBe(false)
    d.preview.props.value.onDblclick()
    expect(d.isEditing.value).toBe(true)
  })
})

describe('useEditable — standalone render', () => {
  const Fixture = defineComponent({
    setup() {
      const e = useEditable({ defaultValue: 'Hello', submitMode: 'enter' })
      return { e }
    },
    template: `
      <div v-bind="e.root.attrs.value">
        <div v-bind="e.area.attrs.value">
          <span v-bind="e.preview.attrs.value" data-testid="preview">{{ e.modelValue.value }}</span>
          <input v-bind="e.input.attrs.value" data-testid="input">
        </div>
        <button type="button" v-bind="e.editTrigger.attrs.value">Edit</button>
        <button type="button" v-bind="e.submitTrigger.attrs.value">Submit</button>
        <button type="button" v-bind="e.cancelTrigger.attrs.value">Cancel</button>
      </div>
    `,
  })

  it('edits, submits with Enter and passes axe', async () => {
    const { container, getByTestId, getByText } = render(Fixture)
    const input = getByTestId('input') as HTMLInputElement
    expect(input.hidden).toBe(true)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(getByText('Edit'))
    expect(input.hidden).toBe(false)
    expect(input.value).toBe('Hello')
    await fireEvent.update(input, 'World')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(input.hidden).toBe(true)
    expect(getByTestId('preview').textContent).toBe('World')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('editableRoot — change details', () => {
  function mount(rootProps: Record<string, any>) {
    return render(defineComponent({
      setup: () => () => h(EditableRoot, { submitMode: 'enter', ...rootProps }, () => [
        h(EditableArea, () => [h(EditablePreview), h(EditableInput, { 'data-testid': 'input' })]),
        h(EditableSubmitTrigger, { 'data-testid': 'submit' }),
      ]),
    }))
  }

  it('emits update:modelValue with details and reason "submit-press"', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = mount({ 'defaultValue': 'a', 'startWithEditMode': true, 'onUpdate:modelValue': onUpdate })
    await fireEvent.update(getByTestId('input'), 'b')
    await fireEvent.click(getByTestId('submit'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe('b')
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'submit-press' })
  })

  it('beforeUpdate:modelValue cancel keeps the value and edit mode', async () => {
    const onUpdate = vi.fn()
    const onSubmit = vi.fn()
    const { getByTestId } = mount({
      'startWithEditMode': true,
      'onBeforeUpdate:modelValue': (_v: string, details: { cancel: () => void }) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
      onSubmit,
    })
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.update(input, 'b')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(input.hidden).toBe(false)
  })

  it('a cancelled outside click runs beforeUpdate:modelValue once', async () => {
    const onBeforeUpdate = vi.fn((_v: string, details: { cancel: () => void }) => details.cancel())
    const { getByTestId } = render(defineComponent({
      setup: () => () => [
        h(EditableRoot, { 'submitMode': 'blur', 'startWithEditMode': true, 'onBeforeUpdate:modelValue': onBeforeUpdate }, () =>
          h(EditableArea, () => [h(EditablePreview), h(EditableInput, { 'data-testid': 'input' })])),
        h('button', { 'data-testid': 'outside' }, 'outside'),
      ],
    }), { attachTo: document.body })
    const input = getByTestId('input') as HTMLInputElement
    await userEvent.type(input, 'b')
    expect(document.activeElement).toBe(input)
    await userEvent.click(getByTestId('outside'))
    expect(document.activeElement).toBe(getByTestId('outside'))
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(input.hidden).toBe(false)
  })

  it('reports "enter-key" from the input', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = mount({ 'startWithEditMode': true, 'onUpdate:modelValue': onUpdate })
    const input = getByTestId('input')
    await fireEvent.update(input, 'b')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onUpdate.mock.calls[0][1].reason).toBe('enter-key')
  })
})

describe('useEditable — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useEditable).toBe('function')
    expect('getEditableInputSurface' in Reka).toBe(false)
  })
})
