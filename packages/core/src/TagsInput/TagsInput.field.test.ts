import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '.'

function renderTagsInput(props: Record<string, unknown>) {
  return h(TagsInputRoot, props, {
    default: ({ modelValue }: { modelValue: string[] }) => [
      ...modelValue.map(tag => h(TagsInputItem, { key: tag, value: tag }, () => [
        h(TagsInputItemText),
        h(TagsInputItemDelete, { 'data-testid': `delete-${tag}` }, () => 'x'),
      ])),
      h(TagsInputInput, { 'data-testid': 'input' }),
    ],
  })
}

const input = (wrapper: VueWrapper) => wrapper.find('[data-testid="input"]').element as HTMLInputElement

async function addTag(wrapper: VueWrapper, text: string) {
  const inputWrapper = wrapper.find('[data-testid="input"]')
  await inputWrapper.setValue(text)
  await inputWrapper.trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

describeFieldControlContract({
  name: 'TagsInput',
  render: renderTagsInput,
  control: input,
  interact: wrapper => addTag(wrapper, 'Kiwi'),
  interactedValue: ['Kiwi'],
  emptyValue: [],
  filledValue: ['Apple'],
})

describe('given a Field-wrapped TagsInput', () => {
  function mountInField(model = ref<string[]>([])) {
    const Harness = defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'tags', 'data-testid': 'field' }, () => [
        h(FieldLabel, () => 'Tags'),
        renderTagsInput({ 'modelValue': model.value, 'onUpdate:modelValue': (value: string[]) => { model.value = value } }),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, model, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('isn\'t dirtied by typing until the text becomes a tag', async () => {
    const { wrapper, field } = mountInField()
    await nextTick()
    await wrapper.find('[data-testid="input"]').setValue('Ki')
    await flushPromises()
    expect(field().attributes('data-dirty')).toBeUndefined()
    await addTag(wrapper, 'Kiwi')
    expect(field().attributes('data-dirty')).toBe('')
    expect(field().attributes('data-filled')).toBe('')
    wrapper.unmount()
  })

  it('is touched only once focus leaves the tags input, not when it moves to a tag\'s delete button', async () => {
    const { wrapper, field } = mountInField(ref(['Apple']))
    await nextTick()
    input(wrapper).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    const deleteButton = wrapper.find('[data-testid="delete-Apple"]').element as HTMLElement
    deleteButton.focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()

    deleteButton.blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })

  it('takes the root\'s own id over the field\'s', async () => {
    const Harness = defineComponent({
      setup: () => () => h(FieldRoot, { name: 'tags' }, () => [
        h(FieldLabel, () => 'Tags'),
        renderTagsInput({ id: 'own' }),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    expect(input(wrapper).id).toBe('own')
    expect(wrapper.find('label').attributes('for')).toBe('own')
    wrapper.unmount()
  })
})

describe('given a controlled TagsInput that adds a tag on blur', () => {
  it('validates on blur with the tag the blur added', async () => {
    const model = ref<string[]>([])
    const validate = vi.fn((value: unknown) => (value as string[]).length > 0 ? null : 'Add a tag')
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h(FieldRoot, { 'name': 'tags', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () => [
          h(FieldLabel, () => 'Tags'),
          renderTagsInput({ 'addOnBlur': true, 'modelValue': model.value, 'onUpdate:modelValue': (value: string[]) => { model.value = value } }),
        ]),
        h('button', { 'data-testid': 'outside' }, 'Outside'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    input(wrapper).focus()
    await wrapper.find('[data-testid="input"]').setValue('Kiwi')
    ;(wrapper.find('[data-testid="outside"]').element as HTMLElement).focus()
    await flushPromises()
    expect(model.value).toEqual(['Kiwi'])
    expect(validate).toHaveBeenLastCalledWith(['Kiwi'], expect.anything())
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBeUndefined()
    wrapper.unmount()
  })
})
