import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '.'

function mountInForm({ addOnTab = false } = {}) {
  const values = ref<string[]>([])
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const Form = defineComponent({
    setup() {
      return () => h('form', { onSubmit }, [
        h(TagsInputRoot<string>, {
          addOnTab,
          'modelValue': values.value,
          'onUpdate:modelValue': (v: string[]) => { values.value = v },
        }, {
          default: ({ modelValue }: { modelValue: string[] }) => [
            ...modelValue.map(item => h(TagsInputItem, { key: item, value: item }, () => h(TagsInputItemText))),
            h(TagsInputInput, { placeholder: 'Add tag' }),
          ],
        }),
        h('button', { type: 'submit' }, 'Save'),
      ])
    },
  })
  const wrapper = mount(Form, { attachTo: document.body })
  const input = wrapper.get('input').element
  return { input, values, onSubmit }
}

describe('given a TagsInput inside a form, in a real browser', () => {
  it('adds the draft on Enter without submitting the form', async () => {
    const { input, values, onSubmit } = mountInForm()

    await userEvent.type(input, 'draft{Enter}')

    await expect.poll(() => values.value).toEqual(['draft'])
    expect(input.value).toBe('')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the form on Enter when the draft is empty', async () => {
    const { input, onSubmit } = mountInForm()

    await userEvent.click(input)
    await userEvent.keyboard('{Enter}')

    await expect.poll(() => onSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps focus in the input when Tab adds the draft (addOnTab)', async () => {
    const { input, values } = mountInForm({ addOnTab: true })

    await userEvent.type(input, 'draft')
    await userEvent.keyboard('{Tab}')

    await expect.poll(() => values.value).toEqual(['draft'])
    expect(document.activeElement).toBe(input)
  })

  it('moves focus on Tab when the draft is empty (addOnTab)', async () => {
    const { input } = mountInForm({ addOnTab: true })

    await userEvent.click(input)
    await userEvent.keyboard('{Tab}')

    expect(document.activeElement).toBe(document.querySelector('button[type="submit"]'))
  })
})

// Chromium fires `focusout` for a removed element; Firefox and WebKit fire nothing.
describe('given a TagsInput whose focused tag is removed, in a real browser', () => {
  it('stops reporting focus when the delete button holding it goes', async () => {
    const values = ref(['vue', 'react'])
    mount(defineComponent(() => () => h(TagsInputRoot<string>, {
      'data-testid': 'root',
      'modelValue': values.value,
      'onUpdate:modelValue': (v: string[]) => { values.value = v },
    }, {
      default: ({ modelValue }: { modelValue: string[] }) => [
        ...modelValue.map(item => h(TagsInputItem, { key: item, value: item }, () => [
          h(TagsInputItemText),
          h(TagsInputItemDelete, { 'data-testid': `delete-${item}` }, () => 'x'),
        ])),
        h(TagsInputInput, { placeholder: 'Add tag' }),
      ],
    })), { attachTo: document.body })
    const root = () => document.querySelector('[data-testid="root"]')!
    const focused = () => root().hasAttribute('data-focused')
    const deleteButton = document.querySelector<HTMLElement>('[data-testid="delete-vue"]')!

    deleteButton.focus()
    await expect.poll(focused).toBe(true)
    deleteButton.click()

    await expect.poll(() => values.value).toEqual(['react'])
    expect(document.querySelector('[data-testid="delete-vue"]')).toBeNull()
    await expect.poll(focused).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(focused()).toBe(false)
  })
})
