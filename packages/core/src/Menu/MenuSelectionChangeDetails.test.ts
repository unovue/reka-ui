import type { ChangeEventDetails } from '@/shared'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/ContextMenu'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarRoot,
  MenubarTrigger,
} from '@/Menubar'

type Details = ChangeEventDetails<'item-press'>

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  document.body.innerHTML = ''
})

// #2828: the checkbox item and radio group of the menu families report change
// details and can be cancelled from `beforeUpdate:modelValue`.
describe('dropdownMenu checkbox item and radio group change details', () => {
  function mountMenu(options: {
    checked?: boolean | 'indeterminate'
    radio?: string
    checkboxListeners?: Record<string, unknown>
    radioListeners?: Record<string, unknown>
  } = {}) {
    const checked = ref(options.checked ?? false)
    const radio = ref(options.radio ?? 'a')
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { defaultOpen: true }, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, () => [
          h(DropdownMenuCheckboxItem, {
            'modelValue': checked.value,
            'onUpdate:modelValue': (value: boolean) => { checked.value = value },
            ...options.checkboxListeners,
          }, () => 'Check'),
          h(DropdownMenuRadioGroup, {
            'modelValue': radio.value,
            'onUpdate:modelValue': (value: unknown) => { radio.value = value as string },
            ...options.radioListeners,
          }, () => [
            h(DropdownMenuRadioItem, { value: 'a' }, () => 'A'),
            h(DropdownMenuRadioItem, { value: 'b' }, () => 'B'),
          ]),
        ]),
      ]),
    }), { attachTo: document.body })
    const checkbox = () => document.querySelector('[role=menuitemcheckbox]') as HTMLElement
    const radioItem = (index: number) => document.querySelectorAll('[role=menuitemradio]')[index] as HTMLElement
    return { wrapper, checked, radio, checkbox, radioItem }
  }

  it('checkbox: emits beforeUpdate then update with `item-press` and the click', async () => {
    const order: string[] = []
    const onBefore = vi.fn((_v: boolean, _d: Details) => order.push('before'))
    const onUpdate = vi.fn((_v: boolean, _d: Details) => order.push('update'))
    const { wrapper, checked, checkbox } = mountMenu({
      checkboxListeners: { 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': [(v: boolean) => { checked.value = v }, onUpdate] },
    })
    await nextTick()
    checkbox().click()
    await nextTick()

    expect(order).toEqual(['before', 'update'])
    expect(onUpdate.mock.calls[0][0]).toBe(true)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'item-press', isCanceled: false })
    expect(onUpdate.mock.calls[0][1].event).toBeInstanceOf(MouseEvent)
    expect(onBefore.mock.calls[0][1]).toBe(onUpdate.mock.calls[0][1])
    expect(checked.value).toBe(true)
    wrapper.unmount()
  })

  it('checkbox: an indeterminate item becomes checked', async () => {
    const onUpdate = vi.fn()
    const { wrapper, checkbox } = mountMenu({ checked: 'indeterminate', checkboxListeners: { 'onUpdate:modelValue': onUpdate } })
    await nextTick()
    expect(checkbox().getAttribute('aria-checked')).toBe('mixed')
    checkbox().click()
    await nextTick()
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'item-press' }))
    wrapper.unmount()
  })

  it('checkbox: cancelling beforeUpdate keeps the state and skips update', async () => {
    const onUpdate = vi.fn()
    const { wrapper, checked, checkbox } = mountMenu({
      checkboxListeners: {
        'onBeforeUpdate:modelValue': (_v: boolean, details: Details) => details.cancel(),
        'onUpdate:modelValue': onUpdate,
      },
    })
    await nextTick()
    checkbox().click()
    await nextTick()

    expect(onUpdate).not.toHaveBeenCalled()
    expect(checked.value).toBe(false)
    wrapper.unmount()
  })

  it('checkbox: Enter reports `item-press`', async () => {
    const onUpdate = vi.fn()
    const { wrapper, checkbox } = mountMenu({ checkboxListeners: { 'onUpdate:modelValue': onUpdate } })
    await nextTick()
    await fireEvent.keyDown(checkbox(), { key: 'Enter' })
    await nextTick()
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'item-press' }))
    wrapper.unmount()
  })

  it('radio group: emits the new value with `item-press` and the click', async () => {
    const onBefore = vi.fn()
    const onUpdate = vi.fn()
    const { wrapper, radio, radioItem } = mountMenu({
      radioListeners: { 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': [(v: unknown) => { radio.value = v as string }, onUpdate] },
    })
    await nextTick()
    radioItem(1).click()
    await nextTick()

    expect(onBefore).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.calls[0] as [string, Details]
    expect(value).toBe('b')
    expect(details.reason).toBe('item-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(radio.value).toBe('b')
    wrapper.unmount()
  })

  it('radio group: re-pressing the checked item emits nothing', async () => {
    const onBefore = vi.fn()
    const onUpdate = vi.fn()
    const { wrapper, radioItem } = mountMenu({ radioListeners: { 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': onUpdate } })
    await nextTick()
    radioItem(0).click()
    await nextTick()
    expect(onBefore).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('radio group: cancelling beforeUpdate keeps the value and skips update', async () => {
    const onUpdate = vi.fn()
    const { wrapper, radio, radioItem } = mountMenu({
      radioListeners: {
        'onBeforeUpdate:modelValue': (_v: unknown, details: Details) => details.cancel(),
        'onUpdate:modelValue': onUpdate,
      },
    })
    await nextTick()
    radioItem(1).click()
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(radio.value).toBe('a')
    wrapper.unmount()
  })

  it('works with `v-model` and an explicit `@update:model-value` listener in a template', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      components: { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem },
      setup: () => ({ value: ref('a'), onUpdate }),
      template: `
        <DropdownMenuRoot default-open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup v-model="value" @update:model-value="onUpdate">
              <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      `,
    }), { attachTo: document.body })
    await nextTick()
    ;(document.querySelectorAll('[role=menuitemradio]')[1] as HTMLElement).click()
    await nextTick()
    expect((wrapper.vm as unknown as { value: string }).value).toBe('b')
    expect(onUpdate).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'item-press' }))
    wrapper.unmount()
  })
})

describe('contextMenu and Menubar forward the checkbox and radio change details', () => {
  it('contextMenu checkbox item', async () => {
    const onCheckbox = vi.fn()
    mount(defineComponent({
      setup: () => () => h(ContextMenuRoot, null, () => [
        h(ContextMenuTrigger, () => 'Area'),
        h(ContextMenuContent, () => h(ContextMenuCheckboxItem, { 'onUpdate:modelValue': onCheckbox }, () => 'Check')),
      ]),
    }), { attachTo: document.body })
    await fireEvent.contextMenu(document.querySelector('span') as HTMLElement, { clientX: 10, clientY: 10 })
    await nextTick()
    ;(document.querySelector('[role=menuitemcheckbox]') as HTMLElement).click()
    await nextTick()
    expect(onCheckbox).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'item-press' }))
  })

  it('contextMenu radio group, cancelled', async () => {
    const onRadioBefore = vi.fn((_v: unknown, details: Details) => details.cancel())
    const onRadio = vi.fn()
    mount(defineComponent({
      setup: () => () => h(ContextMenuRoot, null, () => [
        h(ContextMenuTrigger, () => 'Area'),
        h(ContextMenuContent, () => h(ContextMenuRadioGroup, { 'modelValue': 'a', 'onBeforeUpdate:modelValue': onRadioBefore, 'onUpdate:modelValue': onRadio }, () => [
          h(ContextMenuRadioItem, { value: 'a' }, () => 'A'),
          h(ContextMenuRadioItem, { value: 'b' }, () => 'B'),
        ])),
      ]),
    }), { attachTo: document.body })
    await fireEvent.contextMenu(document.querySelector('span') as HTMLElement, { clientX: 10, clientY: 10 })
    await nextTick()
    ;(document.querySelectorAll('[role=menuitemradio]')[1] as HTMLElement).click()
    await nextTick()
    expect(onRadioBefore).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'item-press' }))
    expect(onRadio).not.toHaveBeenCalled()
  })

  it.each(['checkbox', 'radio'])('menubar %s', async (kind) => {
    const onBefore = vi.fn()
    const onUpdate = vi.fn()
    const listeners = { 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': onUpdate }
    mount(defineComponent({
      setup: () => () => h(MenubarRoot, { defaultValue: 'file' }, () => h(MenubarMenu, { value: 'file' }, () => [
        h(MenubarTrigger, () => 'File'),
        h(MenubarContent, () => kind === 'checkbox'
          ? h(MenubarCheckboxItem, { modelValue: true, ...listeners }, () => 'Check')
          : h(MenubarRadioGroup, { modelValue: 'a', ...listeners }, () => [
              h(MenubarRadioItem, { value: 'a' }, () => 'A'),
              h(MenubarRadioItem, { value: 'b' }, () => 'B'),
            ])),
      ])),
    }), { attachTo: document.body })
    await nextTick()
    ;(document.querySelector(kind === 'checkbox' ? '[role=menuitemcheckbox]' : '[role=menuitemradio]:last-child') as HTMLElement).click()
    await nextTick()
    const expected = kind === 'checkbox' ? false : 'b'
    expect(onBefore).toHaveBeenCalledWith(expected, expect.objectContaining({ reason: 'item-press' }))
    expect(onUpdate).toHaveBeenCalledWith(expected, expect.objectContaining({ reason: 'item-press' }))
  })
})
