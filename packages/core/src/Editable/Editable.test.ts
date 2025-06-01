import type { EditableRootProps } from './EditableRoot.vue'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useTestKbd } from '@/shared'
import Editable from './story/_Editable.vue'

const kbd = useTestKbd()

function setup(props: { editableProps?: EditableRootProps, emits?: { 'onUpdate:modelValue'?: (data: string) => void } } = {}) {
  const user = userEvent.setup()
  const returned = render(Editable, { props })
  const editable = returned.getByTestId('root')
  const input = returned.getByTestId('input') as HTMLInputElement
  const preview = returned.getByTestId('preview')
  const area = returned.getByTestId('area')
  const edit = returned.getByTestId('edit')
  const submit = returned.getByTestId('submit')
  const cancel = returned.getByTestId('cancel')
  expect(editable).toBeVisible()
  return { ...returned, user, root: editable, input, area, edit, submit, cancel, preview }
}

it('should pass axe accessibility tests', async () => {
  const { root } = setup()
  expect(await axe(root)).toHaveNoViolations()
})

describe('editable', () => {
  it('respects a default value if provided', async () => {
    const { preview } = setup({ editableProps: { defaultValue: 'Default Value' } })
    expect(preview).toHaveTextContent('Default Value')
  })

  it('respects a default value if provided - `modelValue`', async () => {
    const { preview } = setup({ editableProps: { modelValue: 'Default Value' } })

    expect(preview).toHaveTextContent('Default Value')
  })

  it('sets the placeholder value if any value isn\'t set', async () => {
    const { preview } = setup({ editableProps: { placeholder: 'Enter text...' } })

    expect(preview).toHaveTextContent('Enter text...')
  })

  it('changes to editable mode when clicking on the preview', async () => {
    const { preview, edit } = setup()

    userEvent.click(preview)
    expect(edit).toBeVisible()
  })

  it('changes to editable mode when clicking on the edit button', async () => {
    const { edit, input } = setup()

    await userEvent.click(edit)
    expect(input).toBeVisible()
  })

  it('changes to editable mode when double clicking on the preview', async () => {
    const { preview, input } = setup({ editableProps: { activationMode: 'dblclick' } })

    await userEvent.dblClick(preview)
    expect(input).toBeVisible()
  })

  it('selects the input value when entering edit mode and selectOnFocus is true', async () => {
    const { input } = setup({ editableProps: { defaultValue: 'Default Value', selectOnFocus: true } })

    await userEvent.click(input)
    expect(input).toHaveFocus()
    expect(input).toHaveValue('Default Value')
    expect(input.selectionStart).toBe(input.value.length)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('starts in edit mode if the property is set', async () => {
    const { input } = setup({ editableProps: { startWithEditMode: true } })

    expect(input).toBeVisible()
  })

  it('submits the value when pressing enter', async () => {
    const { input, preview, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'enter' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data }) } })

    await userEvent.type(input, 'New Value')
    await userEvent.keyboard(kbd.ENTER)
    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
  })

  it('submits the value on blur', async () => {
    const { input, preview, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'blur' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data, submitMode: 'blur' }) } })

    await userEvent.dblClick(preview)
    await userEvent.type(input, 'New Value')
    await userEvent.click(document.children[0])

    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
  })

  it('submits the value when pressing enter if submitMode is both', async () => {
    const { input, preview, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'both' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data }) } })

    await userEvent.type(input, 'New Value')
    await userEvent.keyboard(kbd.ENTER)
    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
  })

  it('submits the value on blur if submitMode is both', async () => {
    const { input, preview, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'both' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data, submitMode: 'blur' }) } })

    await userEvent.dblClick(preview)
    await userEvent.type(input, 'New Value')
    await userEvent.click(document.children[0])

    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
  })

  it('prevents entering edit mode when disabled', async () => {
    const { preview, edit } = setup({ editableProps: { disabled: true } })

    await userEvent.click(preview)

    expect(edit).not.toBeVisible()
  })

  it('prevents editing the input value when readonly', async () => {
    const { input, edit } = setup({ editableProps: { defaultValue: 'Default Value', readonly: true } })

    await userEvent.click(edit)

    expect(input).toBeVisible()

    await userEvent.type(input, 'New Value')

    expect(input).toHaveValue('Default Value')
  })

  it('uses the proper styles when autoResize is true', async () => {
    const { input, preview, edit } = setup({ editableProps: { defaultValue: 'Default Value', autoResize: true } })

    expect(input).toHaveStyle({ visibility: 'hidden' })

    await userEvent.click(edit)

    expect(preview).toHaveStyle({ visibility: 'hidden' })
  })

  it('should prevent user input text more than given `maxLength`', async () => {
    const { input, edit } = setup({ editableProps: { maxLength: 10 } })

    await userEvent.click(edit)

    await userEvent.type(input, 'lorem ipsum dolor sit amet')

    expect(input).toHaveValue('lorem ipsu')
  })
})
