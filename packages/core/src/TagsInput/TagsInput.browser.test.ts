import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from '.'

function mountInForm({ addOnTab = false } = {}) {
  const values = ref<string[]>([])
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const Form = defineComponent({
    setup() {
      return () => h('form', { onSubmit }, [
        h(TagsInputRoot, {
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
