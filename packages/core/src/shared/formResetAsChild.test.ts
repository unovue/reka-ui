import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from '@/TagsInput'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'

// An `asChild` root with a `name` renders a fragment: its child, then the
// hidden input. The reset binds the child, the element the attrs land on.

function setup(template: string, components: Record<string, Component>) {
  const wrapper = mount(defineComponent({ components, template: `<form>${template}</form>` }), { attachTo: document.body })
  return { wrapper, form: wrapper.find('form').element as HTMLFormElement }
}

describe('given an `asChild` root with a hidden input', () => {
  it('resets a Listbox', async () => {
    const { wrapper, form } = setup(`
      <ListboxRoot as-child name="fruit" default-value="a">
        <ListboxContent>
          <ListboxItem value="a">A</ListboxItem>
          <ListboxItem value="b">B</ListboxItem>
        </ListboxContent>
      </ListboxRoot>`, { ListboxRoot, ListboxContent, ListboxItem })
    const items = wrapper.findAll('[role=option]')
    await items[1].trigger('click')
    expect(items[1].attributes('aria-selected')).toBe('true')
    form.reset()
    await nextTick()
    expect(items[0].attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('resets a RadioGroup', async () => {
    const { wrapper, form } = setup(`
      <RadioGroupRoot as-child name="size" default-value="s">
        <div>
          <RadioGroupItem value="s">S</RadioGroupItem>
          <RadioGroupItem value="m">M</RadioGroupItem>
        </div>
      </RadioGroupRoot>`, { RadioGroupRoot, RadioGroupItem })
    const items = wrapper.findAll('[role=radio]')
    await items[1].trigger('click')
    expect(items[1].attributes('aria-checked')).toBe('true')
    form.reset()
    await nextTick()
    expect(items[0].attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('resets a ToggleGroup', async () => {
    const { wrapper, form } = setup(`
      <ToggleGroupRoot as-child type="single" name="align" default-value="l">
        <div>
          <ToggleGroupItem value="l">L</ToggleGroupItem>
          <ToggleGroupItem value="r">R</ToggleGroupItem>
        </div>
      </ToggleGroupRoot>`, { ToggleGroupRoot, ToggleGroupItem })
    const items = wrapper.findAll('button')
    await items[1].trigger('click')
    expect(items[1].attributes('data-state')).toBe('checked')
    form.reset()
    await nextTick()
    expect(items[0].attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })

  it('resets a TagsInput', async () => {
    const { wrapper, form } = setup(`
      <TagsInputRoot as-child name="tags" :default-value="['a']" v-slot="{ modelValue }">
        <div>
          <TagsInputItem v-for="tag in modelValue" :key="tag" :value="tag"><TagsInputItemText /></TagsInputItem>
          <TagsInputInput />
        </div>
      </TagsInputRoot>`, { TagsInputRoot, TagsInputItem, TagsInputItemText, TagsInputInput })
    const input = wrapper.find('input:not([type=hidden]):not([aria-hidden])')
    await input.setValue('b')
    await input.trigger('keydown', { key: 'Enter' })
    const texts = () => wrapper.findAll('span').map(s => s.text()).filter(Boolean)
    expect(texts()).toEqual(['a', 'b'])
    form.reset()
    await nextTick()
    expect(texts()).toEqual(['a'])
    wrapper.unmount()
  })
})
