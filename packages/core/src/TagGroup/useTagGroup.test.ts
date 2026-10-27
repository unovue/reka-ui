import type { TagGroupChangeReason } from '.'
import type { ChangeEventDetails } from '@/shared'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TagGroupItem, TagGroupItemDelete, TagGroupRoot, useTagGroup } from '.'
import * as Reka from '../index'

afterEach(() => {
  document.body.innerHTML = ''
})

function keydown(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true })
  if (target) {
    Object.defineProperty(event, 'target', { value: target })
    Object.defineProperty(event, 'currentTarget', { value: target })
  }
  return event
}

function standalone(options: Parameters<typeof useTagGroup<string>>[0] = {}) {
  const group = useTagGroup<string>({ selectionMode: 'multiple', ...options })
  const elements = new Map<string, HTMLElement>()
  const items = ['Vue', 'Nuxt', 'Reka UI'].map((value) => {
    const element = document.createElement('div')
    document.body.append(element)
    elements.set(value, element)
    return group.createItem({ value, element, textValue: value })
  })
  return { group, items, elements }
}

describe('useTagGroup — model', () => {
  it('is uncontrolled by default and selects on toggle', () => {
    const { group } = standalone()
    expect(group.isControlled.value).toBe(false)
    expect(group.modelValue.value).toEqual([])
    expect(group.toggleSelection('Vue')).toBe(true)
    expect(group.modelValue.value).toEqual(['Vue'])
    expect(group.isSelected('Vue')).toBe(true)
  })

  it('single mode replaces the selection and toggles it off', () => {
    const group = useTagGroup<string>({ selectionMode: 'single' })
    group.toggleSelection('Vue')
    group.toggleSelection('Nuxt')
    expect(group.modelValue.value).toBe('Nuxt')
    group.toggleSelection('Nuxt')
    expect(group.modelValue.value).toBeUndefined()
  })

  it('does nothing when selectionMode is "none"', () => {
    const onUpdate = vi.fn()
    const group = useTagGroup<string>({ onUpdate })
    expect(group.toggleSelection('Vue')).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('ref-owned mode writes through the passed ref', () => {
    const model = ref<string[] | undefined>(['Vue'])
    const group = useTagGroup<string>({ selectionMode: 'multiple', modelValue: model as any })
    group.toggleSelection('Nuxt')
    expect(model.value).toEqual(['Vue', 'Nuxt'])
  })

  it('controlled mode with onUpdate does not write and receives (value, details)', () => {
    const model = ref<string[]>(['Vue'])
    const onUpdate = vi.fn()
    const group = useTagGroup<string>({ selectionMode: 'multiple', modelValue: model as any, onUpdate })
    expect(group.isControlled.value).toBe(true)
    group.toggleSelection('Nuxt', 'item-press')
    expect(model.value).toEqual(['Vue'])
    expect(group.modelValue.value).toEqual(['Vue'])
    expect(onUpdate).toHaveBeenCalledWith(['Vue', 'Nuxt'], expect.objectContaining({ reason: 'item-press' }))
  })

  it('does not emit when the selection is unchanged', () => {
    const emit = vi.fn()
    const group = useTagGroup<{ id: number }>({ selectionMode: 'multiple', defaultValue: [{ id: 1 }], by: 'id', emit })
    expect(group.setSelection([{ id: 1 }])).toBe(false)
    expect(emit).not.toHaveBeenCalled()
    const single = useTagGroup<string>({ selectionMode: 'single', defaultValue: 'Vue', emit })
    expect(single.setSelection(['Vue'])).toBe(false)
    expect(emit).not.toHaveBeenCalled()
  })

  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const group = useTagGroup<string>({
      selectionMode: 'multiple',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    expect(group.toggleSelection('Vue')).toBe(false)
    expect(group.modelValue.value).toEqual([])
    expect(group.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('imperative changes report "imperative-action"', () => {
    const onUpdate = vi.fn()
    const group = useTagGroup<string>({ selectionMode: 'multiple', onUpdate })
    group.setSelection(['Vue'])
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
  })
})

describe('useTagGroup — reasons', () => {
  it('reports item-press, item-keydown and escape-key', () => {
    const reasons: string[] = []
    const { items, elements } = standalone({ onUpdate: (_v, d) => reasons.push(d.reason), onRemove: () => {} })
    items[0].row.props.value.onClick(new MouseEvent('click'))
    const el = elements.get('Nuxt')!
    const enter = keydown('Enter', el)
    items[1].row.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    const { group } = standalone({ onUpdate: (_v, d) => reasons.push(d.reason), defaultValue: ['Vue'] })
    group.root.props.value.onKeydown(keydown('Escape'))
    expect(reasons).toEqual(['item-press', 'item-keydown', 'escape-key'])
  })

  it('reports delete-press and delete-key, then calls onRemove', () => {
    const calls: string[] = []
    const { items, elements, group } = standalone({
      defaultValue: ['Vue', 'Nuxt'],
      onUpdate: (_v, d) => calls.push(`update:${d.reason}`),
      onRemove: values => calls.push(`remove:${values.join()}`),
    })
    group.getItemDeleteSurface(items[0]).props.value.onClick(new MouseEvent('click'))
    expect(calls).toEqual(['update:delete-press', 'remove:Vue'])
    items[1].row.props.value.onKeydown(keydown('Backspace', elements.get('Nuxt')))
    expect(calls).toEqual(['update:delete-press', 'remove:Vue', 'update:delete-key', 'remove:Nuxt'])
  })

  it('does not remove when the deselection is cancelled', () => {
    const onRemove = vi.fn()
    const onUpdate = vi.fn()
    const { items, elements, group } = standalone({
      defaultValue: ['Vue', 'Nuxt'],
      onBeforeUpdate: (_v, d) => d.cancel(),
      onUpdate,
      onRemove,
    })
    group.getItemDeleteSurface(items[0]).props.value.onClick(new MouseEvent('click'))
    items[1].row.props.value.onKeydown(keydown('Backspace', elements.get('Nuxt')))
    expect(group.modelValue.value).toEqual(['Vue', 'Nuxt'])
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('removes an unselected tag without a selection change', () => {
    const calls: string[] = []
    const { items, group } = standalone({
      defaultValue: ['Nuxt'],
      onBeforeUpdate: (_v, d) => calls.push(`before:${d.reason}`),
      onRemove: values => calls.push(`remove:${values.join()}`),
    })
    group.getItemDeleteSurface(items[0]).props.value.onClick(new MouseEvent('click'))
    expect(calls).toEqual(['remove:Vue'])
    expect(group.modelValue.value).toEqual(['Nuxt'])
  })
})

describe('useTagGroup — surfaces', () => {
  it('root is a grid with data-* from state, and a group while empty', () => {
    const empty = useTagGroup()
    expect(empty.root.attrs.value).toMatchObject({ 'role': 'group', 'tabindex': 0, 'data-empty': '' })
    const { group } = standalone({ disabled: true })
    expect(group.root.attrs.value).toMatchObject({ 'role': 'grid', 'aria-multiselectable': true, 'data-disabled': '' })
    expect(group.root.attrs.value).not.toHaveProperty('tabindex')
    expect(Object.keys(group.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
  })

  it('rows carry aria-selected and data-state only when selectable', () => {
    const { items } = standalone({ defaultValue: ['Vue'] })
    expect(items[0].row.attrs.value).toMatchObject({ 'role': 'row', 'aria-selected': true, 'data-state': 'checked' })
    expect(items[1].row.attrs.value).toMatchObject({ 'aria-selected': false, 'data-state': 'unchecked' })
    const none = useTagGroup<string>()
    const item = none.createItem({ value: 'Vue', element: undefined })
    expect(item.row.attrs.value).not.toHaveProperty('data-state')
    expect(item.row.attrs.value['aria-selected']).toBeUndefined()
  })

  it('baseId-derived item ids depend only on baseId and creation order (SSR-stable)', () => {
    const ids = () => {
      const group = useTagGroup<string>({ baseId: 'tags' })
      return ['Vue', 'React'].map(value => group.createItem({ value, element: undefined }).context.id)
    }
    // A second call (another request on the server, or the client hydrating) restarts the sequence.
    expect(ids()).toEqual(['tags-item-1', 'tags-item-2'])
    expect(ids()).toEqual(['tags-item-1', 'tags-item-2'])
  })

  it('the delete surface is labelled by itself and its row', () => {
    const { items, group } = standalone()
    const surface = group.getItemDeleteSurface(items[0], { id: 'del' })
    expect(surface.attrs.value).toMatchObject({ 'aria-label': 'Remove', 'aria-labelledby': `del ${items[0].context.id}`, 'tabindex': -1 })
  })

  it('renders standalone on plain elements and passes axe', async () => {
    const onRemove = vi.fn()
    const Demo = defineComponent({
      setup() {
        const tags = ['Vue', 'Nuxt']
        const rootEl = ref<HTMLElement>()
        const group = useTagGroup<string>({ selectionMode: 'multiple', rootElement: rootEl, onRemove })
        const rows = tags.map((value) => {
          const el = ref<HTMLElement>()
          const item = group.createItem({ value, element: el, textValue: value })
          return { value, el, item, del: group.getItemDeleteSurface(item) }
        })
        return () => h('div', { 'ref': rootEl, ...group.root.attrs.value, 'aria-label': 'Tags' }, rows.map(({ value, el, item, del }) =>
          h('div', { ref: el, ...item.row.attrs.value, tabindex: 0 }, [
            h('div', { role: 'gridcell' }, [
              h('span', value),
              h('button', { type: 'button', ...del.attrs.value }, 'x'),
            ]),
          ]),
        ))
      },
    })
    const wrapper = mount(Demo, { attachTo: document.body })
    const user = userEvent.setup()
    const row = wrapper.findAll('[role="row"]')[0]
    await user.click(row.element)
    expect(row.attributes('aria-selected')).toBe('true')
    await user.click(wrapper.findAll('button')[1].element)
    expect(onRemove).toHaveBeenCalledWith(['Nuxt'])
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})

describe('tagGroupRoot — change details', () => {
  function mountRoot(listeners: Record<string, (...args: any[]) => void>, props: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup: () => () => h(TagGroupRoot, { 'aria-label': 'Tags', 'selectionMode': 'multiple', ...props, ...listeners }, () => [
        h(TagGroupItem, { value: 'Vue' }, () => ['Vue', h(TagGroupItemDelete, () => 'x')]),
        h(TagGroupItem, { value: 'Nuxt' }, () => 'Nuxt'),
      ]),
    }), { attachTo: document.body })
  }

  it('emits beforeUpdate then update with details', async () => {
    const calls: [string, unknown, ChangeEventDetails<TagGroupChangeReason>][] = []
    const wrapper = mountRoot({
      'onBeforeUpdate:modelValue': (v: unknown, d: ChangeEventDetails<TagGroupChangeReason>) => calls.push(['before', v, d]),
      'onUpdate:modelValue': (v: unknown, d: ChangeEventDetails<TagGroupChangeReason>) => calls.push(['update', v, d]),
    })
    await userEvent.setup().click(wrapper.findAll('[role="row"]')[1].element)
    expect(calls.map(c => [c[0], c[1], c[2].reason])).toEqual([
      ['before', ['Nuxt'], 'item-press'],
      ['update', ['Nuxt'], 'item-press'],
    ])
    expect(calls[1][2].event).toBeInstanceOf(MouseEvent)
  })

  it('beforeUpdate:modelValue can cancel a press', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountRoot({
      'onBeforeUpdate:modelValue': (_v: unknown, d: ChangeEventDetails) => d.cancel(),
      'onUpdate:modelValue': onUpdate,
    })
    const row = wrapper.findAll('[role="row"]')[0]
    await userEvent.setup().click(row.element)
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(row.attributes('aria-selected')).toBe('false')
  })

  it('removing a selected tag emits remove after update:modelValue', async () => {
    const calls: string[] = []
    const wrapper = mountRoot({
      'onBeforeUpdate:modelValue': (_v: unknown, d: ChangeEventDetails<TagGroupChangeReason>) => calls.push(`before:${d.reason}`),
      'onUpdate:modelValue': (_v: unknown, d: ChangeEventDetails<TagGroupChangeReason>) => calls.push(`update:${d.reason}`),
      'onRemove': (values: string[]) => calls.push(`remove:${values.join()}`),
    }, { defaultValue: ['Vue'] })
    await userEvent.setup().click(wrapper.find('button').element)
    expect(calls).toEqual(['before:delete-press', 'update:delete-press', 'remove:Vue'])
  })

  it('a cancelled deselection emits no remove', async () => {
    const onRemove = vi.fn()
    const onUpdate = vi.fn()
    const wrapper = mountRoot({
      'onBeforeUpdate:modelValue': (_v: unknown, d: ChangeEventDetails) => d.cancel(),
      'onUpdate:modelValue': onUpdate,
      'onRemove': onRemove,
    }, { defaultValue: ['Vue'] })
    await userEvent.setup().click(wrapper.find('button').element)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onRemove).not.toHaveBeenCalled()
    expect(wrapper.findAll('[role="row"]')[0].attributes('aria-selected')).toBe('true')
  })

  it('a controlled root reflects the parent and does not emit for an unchanged Escape', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountRoot({ 'onUpdate:modelValue': onUpdate }, { modelValue: [] })
    const user = userEvent.setup()
    await user.tab()
    await user.keyboard('{Escape}')
    expect(onUpdate).not.toHaveBeenCalled()
    await user.click(wrapper.findAll('[role="row"]')[0].element)
    expect(onUpdate).toHaveBeenCalledWith(['Vue'], expect.objectContaining({ reason: 'item-press' }))
    // Controlled: the parent did not write the value back.
    expect(wrapper.findAll('[role="row"]')[0].attributes('aria-selected')).toBe('false')
  })
})

describe('useTagGroup — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useTagGroup).toBe('function')
    expect((Reka as Record<string, unknown>).createTagGroupItem).toBeUndefined()
    expect((Reka as Record<string, unknown>).getTagGroupItemDeleteSurface).toBeUndefined()
  })
})
