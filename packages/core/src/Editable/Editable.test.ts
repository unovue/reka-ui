import type { EditableRootProps } from './EditableRoot.vue'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { useTestKbd } from '@/shared'
import { EditableArea, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot } from '.'
import Editable from './story/_Editable.vue'

const kbd = useTestKbd()

function setup(props: {
  editableProps?: EditableRootProps
  onSubmit?: (data: string) => void
  emits?: { 'onUpdate:modelValue'?: (data: string) => void }
} = {}) {
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
    const { input, edit } = setup({ editableProps: { defaultValue: 'Default Value', selectOnFocus: true } })

    await userEvent.click(edit)
    await vi.waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveValue('Default Value')
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('starts in edit mode if the property is set', async () => {
    const { input } = setup({ editableProps: { startWithEditMode: true } })

    expect(input).toBeVisible()
  })

  it('submits the value when pressing enter', async () => {
    let submittedValue = ''
    const { input, preview, edit, rerender } = setup({
      editableProps: { modelValue: '', submitMode: 'enter' },
      onSubmit: data => submittedValue = data,
      emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data }) },
    })

    await userEvent.click(edit)
    await userEvent.type(input, 'New Value')
    await userEvent.keyboard(kbd.ENTER)
    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
    expect(submittedValue).toBe('New Value')
  })

  it('submits the value on blur', async () => {
    const { input, preview, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'blur' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data, submitMode: 'blur' }) } })

    await userEvent.dblClick(preview)
    await userEvent.type(input, 'New Value')
    await userEvent.click(document.children[0])

    expect(preview).toBeVisible()
    expect(preview).toHaveTextContent('New Value')
  })

  // TODO(v3-port): #3047 submit when focusing another editable (Editable source resolved to v3)
  it.skip('submits the value when another editable is focused', async () => {
    const { getAllByTestId } = render({
      components: { Editable },
      template: '<Editable /><Editable />',
    })

    const [firstInput] = getAllByTestId('input')
    const [firstPreview, secondPreview] = getAllByTestId('preview')

    await userEvent.click(firstPreview)
    await userEvent.type(firstInput, 'New Value')
    await userEvent.click(secondPreview)

    expect(firstPreview).toHaveTextContent('New Value')
  })

  it('submits the value when pressing enter if submitMode is both', async () => {
    const { input, preview, edit, rerender } = setup({ editableProps: { modelValue: '', submitMode: 'both' }, emits: { 'onUpdate:modelValue': (data: string) => rerender({ modelValue: data }) } })

    await userEvent.click(edit)
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
    const { preview, edit, input } = setup({ editableProps: { disabled: true } })

    await userEvent.click(preview)

    // The edit trigger hides while editing, so it staying visible means edit mode was not entered.
    expect(edit).toBeVisible()
    expect(input).not.toBeVisible()
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

describe('given a disabled Editable', () => {
  it('should not enter edit mode when the preview receives focus', async () => {
    const { preview, input } = setup({ editableProps: { disabled: true, defaultValue: 'Value' } })

    await fireEvent.focusIn(preview)
    await nextTick()

    expect(preview).toBeVisible()
    expect(input).not.toBeVisible()
  })

  it('should not enter edit mode on double click', async () => {
    const { preview, input } = setup({ editableProps: { disabled: true, activationMode: 'dblclick' } })

    await fireEvent.dblClick(preview)
    await nextTick()

    expect(input).not.toBeVisible()
  })

  it('should take the preview out of the tab order', async () => {
    const { preview, rerender } = setup({ editableProps: { disabled: true } })
    expect(preview).toHaveAttribute('tabindex', '-1')

    await rerender({ editableProps: { disabled: false } })
    expect(preview).toHaveAttribute('tabindex', '0')
  })
})

describe('given a disabled Editable with a natively focusable preview', () => {
  it('should take a button preview out of the tab order', () => {
    const { getByTestId } = render(defineComponent({
      components: { EditableRoot, EditableArea, EditablePreview, EditableInput },
      template: `<EditableRoot disabled><EditableArea><EditablePreview as="button" data-testid="preview" /><EditableInput /></EditableArea></EditableRoot>`,
    }))
    expect(getByTestId('preview').tabIndex).toBe(-1)
  })
})

describe('given the Editable input name', () => {
  function renderLabelled(template: string) {
    return render(defineComponent({
      components: { EditableRoot, EditableArea, EditablePreview, EditableInput },
      template,
    }))
  }
  const parts = (inputAttrs = '') => `<EditableArea><EditablePreview /><EditableInput data-testid="input" ${inputAttrs} /></EditableArea>`

  it('should bind the root `id` to the input', () => {
    const { getByTestId } = renderLabelled(`<EditableRoot id="title">${parts()}</EditableRoot>`)
    expect(getByTestId('input')).toHaveAttribute('id', 'title')
  })

  it('should fall back to the default name', () => {
    const { getByTestId } = renderLabelled(`<EditableRoot>${parts()}</EditableRoot>`)
    expect(getByTestId('input')).toHaveAttribute('aria-label', 'editable input')
    expect(getByTestId('input')).not.toHaveAttribute('id')
  })

  it('should let a consumer `aria-label` win', () => {
    const { getByTestId } = renderLabelled(`<EditableRoot>${parts('aria-label="Project title"')}</EditableRoot>`)
    expect(getByTestId('input')).toHaveAttribute('aria-label', 'Project title')
  })

  it('should drop the default name for `aria-labelledby`', () => {
    const { getByTestId } = renderLabelled(`<span id="heading">Project title</span><EditableRoot start-with-edit-mode>${parts('aria-labelledby="heading"')}</EditableRoot>`)
    expect(getByTestId('input')).not.toHaveAttribute('aria-label')
    expect(getByTestId('input')).toHaveAccessibleName('Project title')
  })

  it('should be named by a label pointing at the root `id`', async () => {
    const { getByTestId } = renderLabelled(`<label for="title">Project title</label><EditableRoot id="title" start-with-edit-mode>${parts()}</EditableRoot>`)
    await nextTick()
    expect(getByTestId('input')).not.toHaveAttribute('aria-label')
    expect(getByTestId('input')).toHaveAccessibleName('Project title')
  })
})

describe('given a label added after the Editable input mounts', () => {
  it('should drop the default name once editing starts', async () => {
    const { getByTestId, container } = render(defineComponent({
      components: { EditableRoot, EditableArea, EditablePreview, EditableInput, EditableEditTrigger },
      template: `<div><EditableRoot id="late"><EditableArea><EditablePreview /><EditableInput data-testid="input" /></EditableArea><EditableEditTrigger data-testid="edit" /></EditableRoot></div>`,
    }))
    const input = getByTestId('input')
    expect(input).toHaveAttribute('aria-label', 'editable input')

    const label = document.createElement('label')
    label.htmlFor = 'late'
    label.textContent = 'Late label'
    container.prepend(label)

    await userEvent.click(getByTestId('edit'))
    await nextTick()

    expect(input).not.toHaveAttribute('aria-label')
    expect(input).toHaveAccessibleName('Late label')
  })
})
