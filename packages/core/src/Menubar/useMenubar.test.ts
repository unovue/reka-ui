import type { MenubarRootContext } from './MenubarRoot.vue'
import type { UseMenubarMenuOptions, UseMenubarMenuReturn } from './useMenubar'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import * as Reka from '../index'
import { useMenubar, useMenubarMenu } from './useMenubar'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

// `useMenubarMenu` composes `useMenuRoot` (mount-bound): mount harness.
function menuHarness(rootContext: MenubarRootContext, options: UseMenubarMenuOptions) {
  let api!: UseMenubarMenuReturn
  mount(defineComponent({
    setup() {
      api = useMenubarMenu(rootContext, options)
      return () => null
    },
  }))
  return api
}

function triggerItem(value: string, disabled = false) {
  const el = document.createElement('button')
  el.dataset.value = value
  if (disabled)
    el.dataset.disabled = ''
  return { ref: el }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useMenubar — model', () => {
  it('defaults to no open menu; open/toggle/close drive the model and the tab stop', () => {
    const m = useMenubar()
    expect(m.modelValue.value).toBe('')
    expect(m.isControlled.value).toBe(false)
    expect(m.lastChangeDetails.value.reason).toBe('none')

    expect(m.onMenuOpen('file', 'trigger-press')).toBe(true)
    expect(m.modelValue.value).toBe('file')
    expect(m.currentTabStopId.value).toBe('file')
    expect(m.lastChangeDetails.value.reason).toBe('trigger-press')

    // Toggling while any menu is open closes the bar.
    expect(m.onMenuToggle('edit', 'trigger-press')).toBe(true)
    expect(m.modelValue.value).toBe('')
    expect(m.currentTabStopId.value).toBe('edit')

    m.onMenuOpen('edit')
    expect(m.onMenuClose('escape-key')).toBe(true)
    expect(m.modelValue.value).toBe('')
    expect(m.lastChangeDetails.value.reason).toBe('escape-key')
    // Unchanged → false.
    expect(m.onMenuClose()).toBe(false)
  })

  it('honours defaultValue, dir and loop', () => {
    const m = useMenubar({ defaultValue: 'view', dir: () => 'rtl', loop: true })
    expect(m.modelValue.value).toBe('view')
    expect(m.context.dir.value).toBe('rtl')
    expect(m.context.loop.value).toBe(true)
  })

  it('root surface is role="menubar" with no data-*', () => {
    const m = useMenubar()
    expect(m.root.attrs.value).toEqual({ role: 'menubar' })
  })

  it('emits beforeUpdate:modelValue then update:modelValue with shared details', () => {
    const emit = vi.fn()
    const m = useMenubar({ emit })
    const event = new PointerEvent('pointerdown')
    m.onMenuOpen('file', 'trigger-press', event)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'file', expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'file', expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit.mock.calls[0][2]).toBe(emit.mock.calls[1][2])
  })

  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const m = useMenubar({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    expect(m.onMenuOpen('file', 'trigger-press')).toBe(false)
    expect(m.modelValue.value).toBe('')
    expect(m.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('controlled: requests the change but does not write it', () => {
    const emit = vi.fn()
    const m = useMenubar({ modelValue: () => 'file', emit })
    m.onMenuClose('outside-press')
    expect(emit).toHaveBeenCalledWith('update:modelValue', '', expect.objectContaining({ reason: 'outside-press' }))
    expect(m.modelValue.value).toBe('file')
  })
})

describe('useMenubarMenu — composes useMenuRoot', () => {
  it('derives open from the menubar model; a Menu close becomes onMenuClose with its reason', () => {
    const bar = useMenubar({ defaultValue: 'file' })
    const menu = menuHarness(bar.context, { value: 'file', contentId: 'file-content' })
    expect(menu.open.value).toBe(true)
    expect(menu.menuContext.open.value).toBe(true)
    expect(menu.menuRootContext.modal.value).toBe(false)

    menu.menuRootContext.onClose('item-press')
    expect(bar.modelValue.value).toBe('')
    expect(bar.lastChangeDetails.value.reason).toBe('item-press')
    expect(menu.open.value).toBe(false)
  })

  it('a cancelled menubar close keeps the menu open', () => {
    const bar = useMenubar({ defaultValue: 'file', onBeforeUpdate: (_v, d) => d.cancel() })
    const menu = menuHarness(bar.context, { value: 'file' })
    menu.menuContext.onOpenChange(false, 'escape-key')
    expect(menu.open.value).toBe(true)
    expect(bar.lastChangeDetails.value).toMatchObject({ reason: 'escape-key', isCanceled: true })
  })

  it('ids: the trigger id is the value; the content id defaults to <value>-content', () => {
    const bar = useMenubar()
    const menu = menuHarness(bar.context, { value: 'file' })
    expect(menu.context.triggerId).toBe('file')
    expect(menu.context.contentId).toBe('file-content')
    expect(menu.content.attrs.value).toEqual({
      'id': 'file-content',
      'aria-labelledby': 'file',
      'data-reka-menubar-content': '',
    })
  })
})

describe('useMenubarMenu — trigger surface', () => {
  it('role/aria in props, highlighted/state/disabled as data-*', async () => {
    const bar = useMenubar()
    const menu = menuHarness(bar.context, { value: 'file', contentId: 'c' })
    const t = menu.trigger
    expect(t.props.value).toMatchObject({
      'id': 'file',
      'role': 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': false,
      'aria-controls': undefined,
    })
    // `data-value` is the functional selector the arrow navigation reads.
    expect(Object.keys(t.props.value).filter(k => k.startsWith('data-'))).toEqual(['data-value'])
    expect(t.attrs.value['data-state']).toBe('closed')
    t.props.value.onFocus()
    expect(t.attrs.value['data-highlighted']).toBe('')
    t.props.value.onBlur()
    expect(t.attrs.value['data-highlighted']).toBeUndefined()
  })

  it('pointerdown opens with trigger-press; hovering another trigger while open switches with trigger-hover', () => {
    const bar = useMenubar()
    const file = menuHarness(bar.context, { value: 'file' })
    const edit = menuHarness(bar.context, { value: 'edit' })
    file.trigger.props.value.onPointerdown(new PointerEvent('pointerdown', { button: 0 }))
    expect(bar.modelValue.value).toBe('file')
    expect(bar.lastChangeDetails.value.reason).toBe('trigger-press')
    expect(file.trigger.props.value['aria-controls']).toBe('file-content')

    edit.trigger.props.value.onPointerenter(new PointerEvent('pointerenter'))
    expect(bar.modelValue.value).toBe('edit')
    expect(bar.lastChangeDetails.value.reason).toBe('trigger-hover')
  })

  it('hover does nothing while the bar is closed', () => {
    const bar = useMenubar()
    const file = menuHarness(bar.context, { value: 'file' })
    file.trigger.props.value.onPointerenter(new PointerEvent('pointerenter'))
    expect(bar.modelValue.value).toBe('')
  })

  it('enter toggles, ArrowDown opens, and both mark a keyboard open', () => {
    const bar = useMenubar()
    const file = menuHarness(bar.context, { value: 'file' })
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    file.trigger.props.value.onKeydown(down)
    expect(bar.modelValue.value).toBe('file')
    expect(down.defaultPrevented).toBe(true)
    expect(file.context.wasKeyboardTriggerOpenRef.value).toBe(true)
    file.trigger.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
    expect(bar.modelValue.value).toBe('')
  })

  it('disabled ignores pointer and keys', () => {
    const bar = useMenubar()
    const file = menuHarness(bar.context, { value: 'file', disabled: true })
    file.trigger.props.value.onPointerdown(new PointerEvent('pointerdown', { button: 0 }))
    file.trigger.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(bar.modelValue.value).toBe('')
    expect(file.trigger.attrs.value['data-disabled']).toBe('')
  })
})

describe('useMenubarMenu — content surface', () => {
  it('arrowRight/Left switch menus with list-navigation, skipping disabled and honouring loop', () => {
    const items = [triggerItem('file'), triggerItem('edit', true), triggerItem('view')]
    const bar = useMenubar({ defaultValue: 'file', loop: true })
    const file = menuHarness(bar.context, { value: 'file', getItems: () => items })
    const view = menuHarness(bar.context, { value: 'view', getItems: () => items })

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    Object.defineProperty(right, 'target', { value: document.createElement('div') })
    file.content.onKeydown(right)
    expect(bar.modelValue.value).toBe('view')
    expect(bar.lastChangeDetails.value.reason).toBe('list-navigation')

    // Looping from the last menu wraps to the first.
    const next = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    Object.defineProperty(next, 'target', { value: document.createElement('div') })
    view.content.onKeydown(next)
    expect(bar.modelValue.value).toBe('file')
  })

  it('arrowRight on a sub-trigger opens the submenu instead of switching', () => {
    const bar = useMenubar({ defaultValue: 'file' })
    const file = menuHarness(bar.context, { value: 'file', getItems: () => [triggerItem('file'), triggerItem('view')] })
    const target = document.createElement('div')
    target.setAttribute('data-reka-menubar-subtrigger', '')
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    Object.defineProperty(event, 'target', { value: target })
    file.content.onKeydown(event)
    expect(bar.modelValue.value).toBe('file')
  })

  it('entryFocus only focuses the first item after a keyboard open', () => {
    const bar = useMenubar()
    const file = menuHarness(bar.context, { value: 'file' })
    const pointerOpen = new Event('entry', { cancelable: true })
    file.content.onEntryFocus(pointerOpen)
    expect(pointerOpen.defaultPrevented).toBe(true)
    file.context.wasKeyboardTriggerOpenRef.value = true
    const keyboardOpen = new Event('entry', { cancelable: true })
    file.content.onEntryFocus(keyboardOpen)
    expect(keyboardOpen.defaultPrevented).toBe(false)
  })
})

describe('useMenubar — through MenubarRoot', () => {
  function mountMenubar(rootProps: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup: () => () => h(Reka.MenubarRoot, rootProps, () => [
        h(Reka.MenubarMenu, { value: 'file' }, () => [
          h(Reka.MenubarTrigger, () => 'File'),
          h(Reka.MenubarPortal, () => h(Reka.MenubarContent, () => h(Reka.MenubarItem, () => 'New'))),
        ]),
      ]),
    }), { attachTo: document.body })
  }

  it('update:modelValue carries (value, details) and an Escape close reports escape-key', async () => {
    const wrapper = mountMenubar()
    const root = wrapper.findComponent(Reka.MenubarRoot)
    await fireEvent.pointerDown(wrapper.find('button').element, { button: 0 })
    expect(root.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    const [value, details] = root.emitted('update:modelValue')![0] as [string, { reason: string, event?: Event }]
    expect(value).toBe('file')
    expect(details.reason).toBe('trigger-press')
    expect(details.event).toBeInstanceOf(Event)

    await nextTick()
    await fireEvent.keyDown(document.querySelector('[role=menu]')!, { key: 'Escape' })
    const [closed, closeDetails] = root.emitted('update:modelValue')!.at(-1) as [string, { reason: string }]
    expect(closed).toBe('')
    expect(closeDetails.reason).toBe('escape-key')
    wrapper.unmount()
  })

  it('cancelling beforeUpdate:modelValue keeps the menu closed', async () => {
    const wrapper = mountMenubar({
      'onBeforeUpdate:modelValue': (_v: string, details: { cancel: () => void }) => details.cancel(),
    })
    const root = wrapper.findComponent(Reka.MenubarRoot)
    await fireEvent.pointerDown(wrapper.find('button').element, { button: 0 })
    expect(root.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('button').attributes('data-state')).toBe('closed')
    wrapper.unmount()
  })
})

describe('useMenubar — rendered surfaces', () => {
  const Fixture = defineComponent({
    setup() {
      const bar = useMenubar()
      const file = useMenubarMenu(bar.context, { value: 'file' })
      const edit = useMenubarMenu(bar.context, { value: 'edit' })
      return { bar, file, edit }
    },
    template: `
      <div v-bind="bar.root.attrs.value" aria-label="App">
        <button v-bind="file.trigger.attrs.value">File</button>
        <button v-bind="edit.trigger.attrs.value">Edit</button>
      </div>
      <div v-if="file.open.value" role="menu" v-bind="file.content.attrs.value">
        <div role="menuitem" tabindex="-1">New</div>
      </div>
    `,
  })

  it('wires triggers and content and passes axe, closed and open', async () => {
    const { container, getByText, getByRole } = render(Fixture)
    expect(noDataAttrs(getByRole('menubar').dataset)).toBe(true)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.pointerDown(getByText('File'), { button: 0 })
    const menu = getByRole('menu')
    expect(menu.getAttribute('aria-labelledby')).toBe(getByText('File').id)
    expect(getByText('File').getAttribute('aria-controls')).toBe(menu.id)
    expect(getByText('File').getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useMenubar — public export', () => {
  it('is exported from the package barrel; the builders are internal', () => {
    expect(typeof Reka.useMenubar).toBe('function')
    expect(typeof Reka.useMenubarMenu).toBe('function')
    expect('createMenubarTriggerSurface' in Reka).toBe(false)
    expect('createMenubarContentSurface' in Reka).toBe(false)
  })
})
