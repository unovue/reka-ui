import type { TagsInputChangeReason } from './useTagsInput'
import type { ChangeEventDetails } from '@/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TagsInputClear, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '.'
import * as Reka from '../index'
import { useTagsInput } from './useTagsInput'

function inputEvent(target: HTMLInputElement, data: string) {
  const event = new InputEvent('input', { data })
  Object.defineProperty(event, 'target', { value: target })
  return event
}

function keydown(target: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true })
  Object.defineProperty(event, 'target', { value: target })
  return event
}

describe('useTagsInput — model', () => {
  it('defaults to an empty, uncontrolled list', () => {
    const t = useTagsInput()
    expect(t.modelValue.value).toEqual([])
    expect(t.isControlled.value).toBe(false)
  })

  it('addTags() adds, then fires onAddTag after onUpdate', () => {
    const calls: string[] = []
    const t = useTagsInput({
      onUpdate: () => calls.push('update'),
      onAddTag: value => calls.push(`add:${value}`),
    })
    expect(t.addTags(['a'])).toBe(true)
    expect(t.modelValue.value).toEqual(['a'])
    expect(calls).toEqual(['update', 'add:a'])
  })

  it('rejects duplicates (invalid + isInvalidInput) unless `duplicate`', () => {
    const onInvalid = vi.fn()
    const onUpdate = vi.fn()
    const t = useTagsInput({ defaultValue: ['a'], onInvalid, onUpdate })
    expect(t.addTags(['a'])).toBe(false)
    expect(onInvalid).toHaveBeenCalledWith('a')
    expect(t.isInvalidInput.value).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()

    const d = useTagsInput({ defaultValue: ['a'], duplicate: true })
    expect(d.addTags(['a'])).toBe(true)
    expect(d.modelValue.value).toEqual(['a', 'a'])
  })

  it('emits invalid once `max` is reached', () => {
    const onInvalid = vi.fn()
    const t = useTagsInput({ defaultValue: ['a'], max: 1, onInvalid })
    expect(t.addTags(['b'])).toBe(false)
    expect(onInvalid).toHaveBeenCalledWith('b')
    expect(t.modelValue.value).toEqual(['a'])
  })

  it('removeTag() and clear() fire onRemoveTag / clear the list', () => {
    const onRemoveTag = vi.fn()
    const t = useTagsInput({ defaultValue: ['a', 'b'], onRemoveTag })
    expect(t.removeTag(0)).toBe(true)
    expect(onRemoveTag).toHaveBeenCalledWith('a')
    expect(t.modelValue.value).toEqual(['b'])
    expect(t.removeTag(5)).toBe(false)
    expect(t.clear()).toBe(true)
    expect(t.modelValue.value).toEqual([])
  })

  it('does not emit when the value is unchanged', () => {
    const onUpdate = vi.fn()
    const t = useTagsInput({ onUpdate })
    expect(t.clear()).toBe(false)
    expect(t.setModelValue([])).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('cancel() in onBeforeUpdate vetoes the change and the addTag/removeTag events', () => {
    const onAddTag = vi.fn()
    const onRemoveTag = vi.fn()
    const onUpdate = vi.fn()
    const t = useTagsInput({
      defaultValue: ['a'],
      onBeforeUpdate: (_value, details) => details.cancel(),
      onAddTag,
      onRemoveTag,
      onUpdate,
    })
    expect(t.addTags(['b'])).toBe(false)
    expect(t.removeTag(0)).toBe(false)
    expect(t.modelValue.value).toEqual(['a'])
    expect(t.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onAddTag).not.toHaveBeenCalled()
    expect(onRemoveTag).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('controlled with onUpdate: reports the change without writing', () => {
    const model = ref(['a'])
    const onUpdate = vi.fn()
    const t = useTagsInput({ modelValue: model, onUpdate })
    t.addTags(['b'])
    expect(t.isControlled.value).toBe(true)
    expect(model.value).toEqual(['a'])
    expect(onUpdate.mock.calls[0][0]).toEqual(['a', 'b'])
  })

  it('ref-owned: writes a new array through the passed ref', () => {
    const model = ref(['a'])
    const before = model.value
    const t = useTagsInput({ modelValue: model })
    t.addTags(['b'])
    expect(model.value).toEqual(['a', 'b'])
    expect(model.value).not.toBe(before)
  })

  it('imperative calls report reason "imperative-action"', () => {
    const onUpdate = vi.fn()
    const t = useTagsInput({ onUpdate })
    t.addTags(['a'])
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
  })
})

describe('useTagsInput — reasons from the part surfaces', () => {
  function setup(props: Parameters<typeof useTagsInput<string>>[0] = {}) {
    const reasons: (TagsInputChangeReason | string)[] = []
    const t = useTagsInput({ ...props, onUpdate: (_v, details: ChangeEventDetails<TagsInputChangeReason>) => reasons.push(details.reason) })
    const el = document.createElement('input')
    return { t, el, reasons }
  }

  it('enter-key / tab-key', async () => {
    const { t, el, reasons } = setup({ addOnTab: true })
    el.value = 'a'
    t.input.props.value.onKeydown(keydown(el, 'Enter'))
    await nextTick()
    el.value = 'b'
    t.input.props.value.onKeydown(keydown(el, 'Tab'))
    await nextTick()
    expect(reasons).toEqual(['enter-key', 'tab-key'])
    expect(t.modelValue.value).toEqual(['a', 'b'])
    expect(el.value).toBe('')
  })

  it('delimiter', () => {
    const { t, el, reasons } = setup()
    el.value = 'a,'
    t.input.props.value.onInput(inputEvent(el, ','))
    expect(reasons).toEqual(['delimiter'])
    expect(t.modelValue.value).toEqual(['a'])
  })

  it('blur (addOnBlur)', () => {
    const { t, el, reasons } = setup({ addOnBlur: true })
    el.value = 'a'
    const event = new FocusEvent('blur')
    Object.defineProperty(event, 'target', { value: el })
    t.input.props.value.onBlur(event)
    expect(reasons).toEqual(['blur'])
  })

  it('paste commits every pasted tag as ONE change', () => {
    const onAddTag = vi.fn()
    const { t, el, reasons } = setup({ addOnPaste: true, onAddTag })
    const event = new Event('paste', { cancelable: true }) as ClipboardEvent
    Object.defineProperty(event, 'target', { value: el })
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'a,b,c' } })
    t.input.props.value.onPaste(event)
    expect(reasons).toEqual(['paste'])
    expect(t.modelValue.value).toEqual(['a', 'b', 'c'])
    expect(onAddTag).toHaveBeenCalledTimes(3)
  })

  it('backspace-key / delete-key remove the selected tag', () => {
    const items = ['a', 'b'].map((value) => {
      const ref = document.createElement('span')
      return { ref, value }
    })
    const { t, el, reasons } = setup({ defaultValue: ['a', 'b'], getItems: () => items })
    t.input.props.value.onKeydown(keydown(el, 'Backspace')) // selects the last tag
    expect(t.selectedElement.value).toBe(items[1].ref)
    t.input.props.value.onKeydown(keydown(el, 'Backspace'))
    expect(t.modelValue.value).toEqual(['a'])
    t.selectedElement.value = items[0].ref
    t.input.props.value.onKeydown(keydown(el, 'Delete'))
    expect(reasons).toEqual(['backspace-key', 'delete-key'])
  })

  it('a cancelled backspace/delete removal keeps the current tag selected', () => {
    const items = ['a', 'b'].map((value) => {
      const ref = document.createElement('span')
      return { ref, value }
    })
    const el = document.createElement('input')
    const t = useTagsInput({
      defaultValue: ['a', 'b'],
      getItems: () => items,
      onBeforeUpdate: (_value, details) => details.cancel(),
    })
    const input = t.input
    input.props.value.onKeydown(keydown(el, 'Backspace')) // selects the last tag
    expect(t.selectedElement.value).toBe(items[1].ref)
    input.props.value.onKeydown(keydown(el, 'Backspace'))
    expect(t.modelValue.value).toEqual(['a', 'b'])
    expect(t.selectedElement.value).toBe(items[1].ref)
    t.selectedElement.value = items[0].ref
    input.props.value.onKeydown(keydown(el, 'Delete'))
    expect(t.selectedElement.value).toBe(items[0].ref)
  })

  it('invalid fires per rejected tag before beforeUpdate, and also when the change is cancelled', () => {
    const order: string[] = []
    const t = useTagsInput({
      defaultValue: ['a'],
      onInvalid: value => order.push(`invalid:${value}`),
      onBeforeUpdate: (_value, details) => {
        order.push('beforeUpdate')
        details.cancel()
      },
      onAddTag: value => order.push(`add:${value}`),
    })
    expect(t.addTags(['a', 'b'], 'paste')).toBe(false)
    expect(order).toEqual(['invalid:a', 'beforeUpdate'])
  })

  it('item-delete-press / clear-press', () => {
    const { t, reasons } = setup({ defaultValue: ['a', 'b'] })
    const { delete: itemDelete } = t.getItemSurfaces('a')
    itemDelete.props.value.onClick(new MouseEvent('click'))
    t.clearButton.props.value.onClick(new MouseEvent('click'))
    expect(reasons).toEqual(['item-delete-press', 'clear-press'])
  })

  it('disabled blocks item delete and clear', () => {
    const { t, reasons } = setup({ defaultValue: ['a'], disabled: true })
    t.getItemSurfaces('a').delete.props.value.onClick(new MouseEvent('click'))
    t.clearButton.props.value.onClick(new MouseEvent('click'))
    expect(reasons).toEqual([])
    expect(t.clearButton.attrs.value['data-disabled']).toBe('')
  })
})

describe('useTagsInput — surfaces', () => {
  it('root/input/item attrs carry data-* derived from state', () => {
    const element = document.createElement('span')
    const t = useTagsInput({ defaultValue: ['a'], focused: true })
    expect(t.root.attrs.value).toMatchObject({ 'dir': 'ltr', 'data-focused': '' })
    const { item, text } = t.getItemSurfaces('a', { element, textId: 'text-a' })
    expect(item.attrs.value).toMatchObject({ 'aria-labelledby': 'text-a', 'aria-current': false, 'data-state': 'unchecked' })
    expect(text.attrs.value).toEqual({ id: 'text-a' })
    t.selectedElement.value = element
    expect(item.attrs.value['data-state']).toBe('checked')
    t.addTags(['a'])
    expect(t.input.attrs.value['data-invalid']).toBe('')
    expect(Object.keys(t.input.props.value).some(k => k.startsWith('data-'))).toBe(false)
  })

  it('renders standalone on plain elements and passes axe', async () => {
    const Standalone = defineComponent({
      setup() {
        const t = useTagsInput({ defaultValue: ['one', 'two'] })
        return () => h('div', t.root.attrs.value, [
          ...t.modelValue.value.map((value) => {
            const parts = t.getItemSurfaces(value, { textId: `tag-${value}` })
            return h('span', { key: value, ...parts.item.attrs.value }, [
              h('span', parts.text.attrs.value, value),
              h('button', { 'type': 'button', 'aria-label': `Remove ${value}`, ...parts.delete.attrs.value }, 'x'),
            ])
          }),
          h('input', { 'aria-label': 'Add tag', ...t.input.attrs.value }),
          h('button', { type: 'button', ...t.clearButton.attrs.value }, 'Clear'),
        ])
      },
    })
    const wrapper = mount(Standalone, { attachTo: document.body })
    expect(await axe(wrapper.element)).toHaveNoViolations()

    const input = wrapper.get('input')
    input.element.value = 'three'
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.text()).toContain('three')

    await wrapper.findAll('button[aria-label^="Remove"]')[0].trigger('click')
    expect(wrapper.text()).not.toContain('one')
    wrapper.unmount()
  })
})

describe('tagsInputRoot — change details', () => {
  function mountRoot(rootProps: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup() {
        return () => h(TagsInputRoot, rootProps, {
          default: ({ modelValue }: { modelValue: string[] }) => [
            ...modelValue.map(item => h(TagsInputItem, { key: item, value: item }, () => [h(TagsInputItemText), h(TagsInputItemDelete, () => 'x')])),
            h(TagsInputInput, { 'aria-label': 'Add tag' }),
            h(TagsInputClear, () => 'Clear'),
          ],
        })
      },
    }), { attachTo: document.body })
  }

  it('emits update:modelValue(value, details) with the reason, after beforeUpdate', async () => {
    const wrapper = mountRoot({ defaultValue: ['a'] })
    const root = wrapper.getComponent(TagsInputRoot)
    await wrapper.get('button:not([tabindex])').trigger('click')
    expect(root.emitted('beforeUpdate:modelValue')?.[0][0]).toEqual([])
    const [value, details] = root.emitted('update:modelValue')![0] as [string[], ChangeEventDetails]
    expect(value).toEqual([])
    expect(details.reason).toBe('clear-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
    wrapper.unmount()
  })

  it('emits addTag after update:modelValue', async () => {
    const order: string[] = []
    const wrapper = mountRoot({
      'onUpdate:modelValue': () => order.push('update'),
      'onAddTag': () => order.push('addTag'),
    })
    const input = wrapper.get('input')
    input.element.value = 'a'
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(order).toEqual(['update', 'addTag'])
    wrapper.unmount()
  })

  it('beforeUpdate:modelValue can cancel a tag add; the draft stays in the input', async () => {
    const onAddTag = vi.fn()
    const wrapper = mountRoot({
      'onBeforeUpdate:modelValue': (_value: string[], details: ChangeEventDetails) => details.cancel(),
      onAddTag,
    })
    const root = wrapper.getComponent(TagsInputRoot)
    const input = wrapper.get('input')
    input.element.value = 'a'
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(root.emitted('update:modelValue')).toBeUndefined()
    expect(onAddTag).not.toHaveBeenCalled()
    expect(input.element.value).toBe('a')
    expect(wrapper.findAll('[data-reka-collection-item]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('does not emit when Clear is pressed on an empty list', async () => {
    const wrapper = mountRoot()
    await wrapper.get('button').trigger('click')
    expect(wrapper.getComponent(TagsInputRoot).emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('controlled without an update handler keeps the parent value', async () => {
    const wrapper = mountRoot({ modelValue: ['a'] })
    const root = wrapper.getComponent(TagsInputRoot)
    await wrapper.get('button[tabindex="-1"]').trigger('click')
    expect(root.emitted('update:modelValue')?.[0][0]).toEqual([])
    expect(root.emitted('removeTag')?.[0][0]).toBe('a')
    expect(wrapper.findAll('[data-reka-collection-item]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('controlled with an update handler that ignores the change keeps the typed text', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountRoot({ 'modelValue': ['a'], 'onUpdate:modelValue': onUpdate })
    const input = wrapper.get('input')
    input.element.value = 'b'
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(input.element.value).toBe('b')
    expect(wrapper.findAll('[data-reka-collection-item]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('v-model clears the typed text once the tag is added', async () => {
    const model = ref<string[]>(['a'])
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(TagsInputRoot<string>, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: string[]) => { model.value = value },
        }, {
          default: ({ modelValue }: { modelValue: string[] }) => [
            ...modelValue.map(item => h(TagsInputItem, { key: item, value: item }, () => h(TagsInputItemText))),
            h(TagsInputInput, { 'aria-label': 'Add tag' }),
          ],
        })
      },
    }), { attachTo: document.body })
    const input = wrapper.get('input')
    input.element.value = 'b'
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(model.value).toEqual(['a', 'b'])
    expect(input.element.value).toBe('')
    wrapper.unmount()
  })

  it('labels each tag with its text id', async () => {
    const wrapper = mountRoot({ defaultValue: ['a'] })
    await nextTick()
    const item = wrapper.get('[data-reka-collection-item]')
    const text = item.get('span')
    expect(text.attributes('id')).toBeTruthy()
    expect(item.attributes('aria-labelledby')).toBe(text.attributes('id'))
    wrapper.unmount()
  })
})

describe('useTagsInput — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useTagsInput).toBe('function')
    expect((Reka as Record<string, unknown>).createTagsInputInputSurface).toBeUndefined()
  })
})
