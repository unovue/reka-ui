import type { PropType } from 'vue'
import type { ComboboxRootEmits, ComboboxRootProps } from '.'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AutocompleteCancel, AutocompleteInput, AutocompleteRoot } from '@/Autocomplete'
import { useForwardProps, useForwardPropsEmits } from '@/shared'
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
    ['explicit undefined prop', { clearValue: undefined }, null],
    ['factory returning undefined', { clearValue: () => undefined }, undefined],
    ['kebab-case factory returning undefined', { 'clear-value': () => undefined }, undefined],
    ['factory returning null', { clearValue: () => null }, null],
    ['factory returning a custom value', { clearValue: () => 'Apple' }, 'Apple'],
    ['factory returning an empty string', { clearValue: () => '' }, ''],
  ])('clears a controlled selection: %s', async (_name, props, expected) => {
    const { wrapper, value } = mountCombobox(props)
    await wrapper.get('button').trigger('click')
    expect(value.value).toBe(expected)
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([expected])
    wrapper.unmount()
  })

  it('clears an uncontrolled selection to undefined', async () => {
    const { wrapper } = mountCombobox({ clearValue: () => undefined }, false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('reads a clearValue added, changed, and removed after mounting', async () => {
    const { wrapper, value, overrides } = mountCombobox({})
    for (const [props, expected] of [
      [{ clearValue: () => 'Apple' }, 'Apple'],
      [{ clearValue: () => undefined }, undefined],
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

  it('calls the factory once per clear, and only when clearing', async () => {
    const clearValue = vi.fn(() => undefined)
    const { wrapper, value } = mountCombobox({ clearValue })
    expect(clearValue).not.toHaveBeenCalled()
    await wrapper.get('button').trigger('click')
    expect(clearValue).toHaveBeenCalledTimes(1)
    expect(value.value).toBe(undefined)
    wrapper.unmount()
  })

  it.each([
    ['omitted', {}, []],
    ['factory returning an empty array', { clearValue: () => [] }, []],
    ['factory returning an array', { clearValue: () => ['Apple'] }, ['Apple']],
    ['factory returning a non-array', { clearValue: () => 'Apple' }, []],
    ['factory returning undefined', { clearValue: () => undefined }, []],
    ['factory returning null', { clearValue: () => null }, []],
  ])('clears a multiple selection: %s', async (_name, props, expected) => {
    const { wrapper, value } = mountCombobox({ multiple: true, modelValue: ['Banana'], ...props })
    await wrapper.get('button').trigger('click')
    expect(value.value).toEqual(expected)
    wrapper.unmount()
  })

  it('keeps the selection when resetModelValueOnClear is false', async () => {
    const clearValue = vi.fn(() => undefined)
    const { wrapper, value } = mountCombobox({ resetModelValueOnClear: false, clearValue })
    await wrapper.get('button').trigger('click')
    expect(value.value).toBe('Banana')
    expect(clearValue).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps clearing Autocomplete to an empty string', async () => {
    const value = ref('Banana')
    const wrapper = mount(defineComponent({
      setup: () => () => h(AutocompleteRoot, {
        'modelValue': value.value,
        'onUpdate:modelValue': (next: string) => { value.value = next },
      }, () => [h(AutocompleteInput), h(AutocompleteCancel, () => 'Clear')]),
    }), { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    expect(value.value).toBe('')
    wrapper.unmount()
  })
})

// The two ways a design-system wrapper passes props on to `ComboboxRoot`.
const BoundWrapper = defineComponent({
  props: {
    modelValue: { type: null as unknown as PropType<unknown> },
    clearValue: { type: Function as PropType<() => unknown> },
  },
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () => h(ComboboxRoot, {
    'modelValue': props.modelValue as string,
    'resetModelValueOnClear': true,
    'clearValue': props.clearValue as () => undefined,
    'onUpdate:modelValue': (next: unknown) => emit('update:modelValue', next),
  }, () => [h(ComboboxInput), h(ComboboxCancel, () => 'Clear')]),
})

const wrapperProps = {
  modelValue: { type: null as unknown as PropType<ComboboxRootProps['modelValue']> },
  resetModelValueOnClear: { type: Boolean, default: undefined },
  clearValue: { type: Function as PropType<ComboboxRootProps['clearValue']> },
}

const ForwardPropsWrapper = defineComponent({
  props: wrapperProps,
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const forwarded = useForwardProps(props)
    return () => h(ComboboxRoot, {
      ...forwarded.value,
      'onUpdate:modelValue': (next: unknown) => emit('update:modelValue', next),
    }, () => [h(ComboboxInput), h(ComboboxCancel, () => 'Clear')])
  },
})

const ForwardPropsEmitsWrapper = defineComponent({
  props: wrapperProps,
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const forwarded = useForwardPropsEmits(props, emit as (name: keyof ComboboxRootEmits, ...args: any[]) => void)
    return () => h(ComboboxRoot, forwarded.value, () => [h(ComboboxInput), h(ComboboxCancel, () => 'Clear')])
  },
})

describe('combobox clearValue through a wrapper component', () => {
  describe.each([
    ['binding its own clearValue prop', BoundWrapper],
    ['useForwardProps', ForwardPropsWrapper],
    ['useForwardPropsEmits', ForwardPropsEmitsWrapper],
  ])('%s', (_name, Wrapper) => {
    function mountWrapper(props: Record<string, unknown>) {
      const value = ref<unknown>('Banana')
      const wrapper = mount(defineComponent({
        setup: () => () => h(Wrapper as any, {
          'modelValue': value.value,
          'resetModelValueOnClear': true,
          'onUpdate:modelValue': (next: unknown) => { value.value = next },
          ...props,
        }),
      }), { attachTo: document.body })
      return { wrapper, value }
    }

    it('clears to null when clearValue is not passed', async () => {
      const { wrapper, value } = mountWrapper({})
      await wrapper.get('button').trigger('click')
      expect(value.value).toBe(null)
      expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([null])
      wrapper.unmount()
    })

    it('clears to undefined when passed a factory returning undefined', async () => {
      const { wrapper, value } = mountWrapper({ clearValue: () => undefined })
      await wrapper.get('button').trigger('click')
      expect(value.value).toBe(undefined)
      expect(wrapper.findComponent(ComboboxRoot).emitted('update:modelValue')?.at(-1)).toEqual([undefined])
      wrapper.unmount()
    })
  })
})
