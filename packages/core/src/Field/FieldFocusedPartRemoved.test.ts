import type { Ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { parseColor } from '@/shared/color'
import { SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputRoot } from '@/TagsInput'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { FieldRoot } from '.'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

// jsdom, like Firefox and WebKit, fires no `focusout` for a focused element
// removed from the document: a control whose focused part goes away while
// the control stays mounted must still leave the field unfocused.
const items = ['a', 'b', 'c']
const cases: Array<[string, (shown: Ref<string[]>) => ReturnType<typeof h>]> = [
  ['RadioGroup', shown => h(RadioGroupRoot, null, () => shown.value.map(value => h(RadioGroupItem, { 'key': value, value, 'data-part': value })))],
  ['ToggleGroup', shown => h(ToggleGroupRoot, { type: 'single' }, () => shown.value.map(value => h(ToggleGroupItem, { 'key': value, value, 'data-part': value })))],
  ['CheckboxGroup', shown => h(CheckboxGroupRoot, null, () => shown.value.map(value => h(CheckboxRoot, { 'key': value, value, 'data-part': value })))],
  ['Listbox', shown => h(ListboxRoot, null, () => h(ListboxContent, () => shown.value.map(value => h(ListboxItem, { 'key': value, value, 'data-part': value }, () => value))))],
  ['TagsInput', shown => h(TagsInputRoot, { defaultValue: items }, () => [
    ...shown.value.map(value => h(TagsInputItem, { key: value, value }, () => h(TagsInputItemDelete, { 'data-part': value }))),
    h(TagsInputInput),
  ])],
  ['Slider', shown => h(SliderRoot, { defaultValue: [10, 50, 90] }, () => [h(SliderTrack), ...shown.value.map(value => h(SliderThumb, { 'key': value, 'data-part': value }))])],
  ['ColorArea', shown => h(ColorAreaRoot, { defaultValue: parseColor('hsl(0, 100%, 50%)') }, () => h(ColorAreaArea, () =>
    shown.value.includes('b') ? h(ColorAreaThumb, { 'data-part': 'b' }) : null))],
]

describe.each(cases)('a Field-wrapped %s whose focused part is removed', (_, render) => {
  it('leaves the field (unfocused, touched, validated on blur) while the control stays mounted', async () => {
    const shown = ref([...items])
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent(() => () =>
      h(FieldRoot, { 'name': 'field', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () => render(shown))), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    const part = document.querySelector<HTMLElement>('[data-part="b"]')!
    const focusable = part.matches('input, button, [tabindex]') ? part : part.querySelector<HTMLElement>('input, [tabindex]')!
    focusable.focus()
    await flushPromises()
    expect(document.activeElement).toBe(focusable)
    expect(field().attributes('data-focused')).toBe('')

    shown.value = items.filter(item => item !== 'b')
    await flushPromises()
    expect(focusable.isConnected).toBe(false)
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
