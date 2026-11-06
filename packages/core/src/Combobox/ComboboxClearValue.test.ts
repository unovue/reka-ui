import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxCancel, ComboboxInput, ComboboxRoot } from '.'

function mountCombobox(props: Record<string, unknown>, controlled = true) {
  const value = ref<unknown>('Banana')
  const overrides = ref(props)
  const wrapper = mount(defineComponent({
    setup: () => () => h(ComboboxRoot, {
      ...(controlled
        ? { 'modelValue': value.value, 'onUpdate:modelValue': (next: unknown) => { value.value = next } }
        : { defaultValue: 'Banana' }),
      resetModelValueOnClear: true,
      ...overrides.value,
    }, () => [h(ComboboxInput), h(ComboboxCancel, () => 'Clear')]),
  }), { attachTo: document.body })
  return { wrapper, value, overrides }
}

describe('combobox clearValue', () => {
  it.each([
    ['omitted', {}, null],
    ['explicit undefined', { clearValue: undefined }, undefined],
    ['kebab-case undefined', { 'clear-value': undefined }, undefined],
    ['explicit null', { clearValue: null }, null],
    ['custom value', { clearValue: 'Apple' }, 'Apple'],
    ['empty string', { clearValue: '' }, ''],
  ])('clears a controlled selection to %s', async (_name, props, expected) => {
    const { wrapper, value } = mountCombobox(props)
    await wrapper.get('button').trigger('click')
    expect(value.value).toBe(expected)
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([expected])
    wrapper.unmount()
  })

  it('clears an uncontrolled selection to explicit undefined', async () => {
    const { wrapper } = mountCombobox({ clearValue: undefined }, false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('reads a clearValue added, changed, and removed after mounting', async () => {
    const { wrapper, value, overrides } = mountCombobox({})
    for (const [props, expected] of [
      [{ clearValue: 'Apple' }, 'Apple'],
      [{ clearValue: undefined }, undefined],
      [{}, null],
    ] as const) {
      value.value = 'Banana'
      overrides.value = props
      await nextTick()
      await wrapper.get('button').trigger('click')
      expect(value.value).toBe(expected)
    }
    wrapper.unmount()
  })

  it('ignores clearValue in multiple mode', async () => {
    const { wrapper, value } = mountCombobox({ multiple: true, modelValue: ['Banana'], clearValue: 'Apple' })
    await wrapper.get('button').trigger('click')
    expect(value.value).toEqual([])
    wrapper.unmount()
  })

  it('keeps the selection when resetModelValueOnClear is false', async () => {
    const { wrapper, value } = mountCombobox({ resetModelValueOnClear: false, clearValue: undefined })
    await wrapper.get('button').trigger('click')
    expect(value.value).toBe('Banana')
    wrapper.unmount()
  })
})
