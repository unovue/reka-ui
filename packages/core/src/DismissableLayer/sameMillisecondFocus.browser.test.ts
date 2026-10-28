import type { Component } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { DialogContent, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from '@/Editable'
import { FieldRoot } from '@/Field'
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRoot,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/Menubar'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'
import { ToolbarButton, ToolbarRoot } from '@/Toolbar'

function el(name: string) {
  return document.querySelector<HTMLElement>(`[data-t="${name}"]`)
}

function active() {
  return document.activeElement?.getAttribute('data-t')
}

function t(name: string, extra: object = {}) {
  return { 'data-t': name, ...extra }
}

function dropdown() {
  return h(DropdownMenuRoot, null, () => [
    h(DropdownMenuTrigger, t('trigger'), () => 'Open'),
    h(DropdownMenuContent, null, () => [
      h(DropdownMenuItem, t('first'), () => 'First'),
      h(DropdownMenuSub, () => [
        h(DropdownMenuSubTrigger, t('sub-trigger'), () => 'More'),
        h(DropdownMenuSubContent, null, () => h(DropdownMenuItem, t('sub-first'), () => 'Sub')),
      ]),
    ]),
  ])
}

function menubar() {
  return h(MenubarRoot, null, () => h(MenubarMenu, { value: 'm' }, () => [
    h(MenubarTrigger, t('trigger'), () => 'File'),
    h(MenubarContent, null, () => [
      h(MenubarItem, t('first'), () => 'First'),
      h(MenubarSub, () => [
        h(MenubarSubTrigger, t('sub-trigger'), () => 'More'),
        h(MenubarSubContent, null, () => h(MenubarItem, t('sub-first'), () => 'Sub')),
      ]),
    ]),
  ]))
}

function dialog(children: () => unknown[]) {
  return h(DialogRoot, null, () => [
    h(DialogTrigger, t('trigger'), () => 'Open'),
    h(DialogContent, null, () => [h(DialogTitle, () => 'Title'), ...children()]),
  ])
}

async function toSubTrigger(openKey: string) {
  el('trigger')!.focus()
  await userEvent.keyboard(openKey)
  await vi.waitFor(() => expect(active()).toBe('first'))
  await userEvent.keyboard('{ArrowDown}')
  await vi.waitFor(() => expect(active()).toBe('sub-trigger'))
}

// Vue skips an invoker attached in the millisecond of the event's first invoker, so
// an auto-focus right after a mount could lose the handlers that mount attached. A
// held clock makes every open land there; unheld, each of these is a rare failure.
describe('a focus in the millisecond the listeners attach', () => {
  let app: ReturnType<typeof createApp> | undefined

  afterEach(() => {
    vi.restoreAllMocks()
    app?.unmount()
    app = undefined
    document.body.innerHTML = ''
  })

  /** Mounts `render`, runs `before` on the real clock, then `action` on a held one. */
  async function openOnHeldClock(render: () => unknown, action: () => Promise<void>, before?: () => Promise<void>) {
    const host = document.createElement('div')
    document.body.append(host)
    app = createApp(defineComponent(() => () => render() as never))
    app.mount(host)
    await nextTick()
    await before?.()
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000)
    await action()
    await new Promise(resolve => setTimeout(resolve, 100))
    vi.restoreAllMocks()
  }

  async function pressOnTrigger(key: string) {
    el('trigger')!.focus()
    await userEvent.keyboard(key)
  }

  it('moves focus to the first item of a keyboard-opened DropdownMenu', async () => {
    await openOnHeldClock(dropdown, () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('first')
  })

  it('moves focus to the first item of a keyboard-opened DropdownMenu submenu', async () => {
    await openOnHeldClock(dropdown, () => userEvent.keyboard('{ArrowRight}'), () => toSubTrigger('{Enter}'))
    expect(active()).toBe('sub-first')
  })

  it('moves focus to the first item of a keyboard-opened Menubar menu', async () => {
    await openOnHeldClock(menubar, () => pressOnTrigger('{ArrowDown}'))
    expect(active()).toBe('first')
  })

  it('moves focus to the first item of a keyboard-opened Menubar submenu', async () => {
    await openOnHeldClock(menubar, () => userEvent.keyboard('{ArrowRight}'), () => toSubTrigger('{ArrowDown}'))
    expect(active()).toBe('sub-first')
  })

  it('highlights the item a keyboard-opened Select focuses, through the wrapper', async () => {
    await openOnHeldClock(() => h(SelectRoot, null, () => [
      h(SelectTrigger, t('trigger'), () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectContent, null, () => h(SelectViewport, () => h(SelectItem, { 'data-t': 'item', 'value': 'a' }, () => h(SelectItemText, () => 'A')))),
    ]), () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('item')
    expect(el('item')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('opens a Combobox with openOnFocus when a Dialog auto-focuses its input', async () => {
    await openOnHeldClock(() => dialog(() => [h(ComboboxRoot, { openOnFocus: true }, () => [
      h(ComboboxAnchor, () => h(ComboboxInput, t('input'))),
      h(ComboboxContent, () => h(ComboboxItem, { value: 'a' }, () => 'a')),
    ])]), () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('input')
    expect(el('input')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('enters a roving group a Dialog auto-focuses', async () => {
    await openOnHeldClock(() => dialog(() => [h(ToolbarRoot, null, () => h(ToolbarButton, t('button'), () => 'A'))]), () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('button')
  })

  it('runs a consumer\'s focus listener on the button a Dialog auto-focuses', async () => {
    const onFocus = vi.fn()
    await openOnHeldClock(() => dialog(() => [h('button', t('button', { onFocus }), 'A')]), () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('button')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('reports a DateField\'s focus to its Field when a Dialog auto-focuses a segment', async () => {
    await openOnHeldClock(() => dialog(() => [h(FieldRoot, t('field'), () => h(DateFieldRoot as Component, null, {
      default: ({ segments }: { segments: { part: 'month', value: string }[] }) =>
        segments.map(segment => h(DateFieldInput, { part: segment.part, key: segment.part }, () => segment.value)),
    }))]), () => pressOnTrigger('{Enter}'))
    expect(el('field')!.hasAttribute('data-focused')).toBe(true)
  })

  function segments() {
    return {
      default: ({ segments }: { segments: { part: 'month', value: string }[] }) =>
        segments.map(segment => h(DateFieldInput, { 'part': segment.part, 'key': segment.part, 'data-t': segment.part }, () => segment.value)),
    }
  }

  it('does not leave a DateField focused when focus lands on a segment and moves on', async () => {
    await openOnHeldClock(() => h(DialogRoot, null, () => [
      h(DialogTrigger, t('trigger'), () => 'Open'),
      h(DialogContent, { onOpenAutoFocus: (event: Event) => {
        event.preventDefault()
        el('month')!.focus()
        el('after')!.focus()
      } }, () => [
        h(DialogTitle, () => 'Title'),
        h(FieldRoot, t('field'), () => h(DateFieldRoot as Component, null, segments())),
        h('button', t('after'), 'After'),
      ]),
    ]), () => pressOnTrigger('{Enter}'))
    expect(active()).toBe('after')
    expect(el('field')!.hasAttribute('data-focused')).toBe(false)
    expect(el('field')!.hasAttribute('data-touched')).toBe(true)
  })

  it('reports a DateField\'s focus when a sibling focuses a segment on mount', async () => {
    const show = ref(false)
    const Kid = defineComponent(() => {
      onMounted(() => el('month')!.focus())
      return () => null
    })
    await openOnHeldClock(() => h(FieldRoot, t('field'), () => show.value
      ? [h(DateFieldRoot as Component, null, segments()), h(Kid)]
      : []), async () => {
      show.value = true
    })
    expect(active()).toBe('month')
    expect(el('field')!.hasAttribute('data-focused')).toBe(true)
  })

  function editable(props: object, children: () => unknown[]) {
    return h(EditableRoot, { defaultValue: 'x', ...props }, () => children() as never)
  }

  function editableArea(previewProps: object, inputProps: object) {
    return () => [h(EditableArea, () => [h(EditablePreview, previewProps), h(EditableInput, inputProps)])]
  }

  it('runs a consumer\'s focus listener on an Editable input starting in edit mode', async () => {
    const show = ref(false)
    const onFocus = vi.fn()
    await openOnHeldClock(
      () => show.value ? editable({ startWithEditMode: true }, editableArea({}, t('input', { onFocus }))) : null,
      async () => {
        show.value = true
      },
    )
    expect(active()).toBe('input')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('runs a consumer\'s focus listener on an Editable input starting in edit mode in a Dialog', async () => {
    const onFocus = vi.fn()
    await openOnHeldClock(
      () => dialog(() => [editable({ startWithEditMode: true }, editableArea({}, t('input', { onFocus })))]),
      () => pressOnTrigger('{Enter}'),
    )
    expect(active()).toBe('input')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('runs a consumer\'s focus listener on an Editable preview a Dialog auto-focuses', async () => {
    const onFocus = vi.fn()
    await openOnHeldClock(
      () => dialog(() => [editable({}, editableArea(t('preview', { onFocus }), t('input')))]),
      () => pressOnTrigger('{Enter}'),
    )
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('runs a consumer\'s focus listener on a button inside an Editable a Dialog auto-focuses', async () => {
    const onFocus = vi.fn()
    await openOnHeldClock(
      () => dialog(() => [editable({}, () => [h('button', t('button', { onFocus }), 'A')])]),
      () => pressOnTrigger('{Enter}'),
    )
    expect(active()).toBe('button')
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('dismisses an inner layer a consumer moves focus out of in the millisecond it opens', async () => {
    const innerOpen = ref(false)
    const onInnerFocusOutside = vi.fn()
    const onOuterFocusOutside = vi.fn((event: Event) => event.preventDefault())
    await openOnHeldClock(() => h(PopoverRoot, { defaultOpen: true }, () => [
      h(PopoverTrigger, () => 'Open'),
      h(PopoverContent, t('outer', { onFocusOutside: onOuterFocusOutside }), () => [
        h('input', t('outer-input')),
        h(PopoverRoot, { 'open': innerOpen.value, 'onUpdate:open': (value: boolean) => {
          innerOpen.value = value
        } }, () => [
          h(PopoverTrigger, () => 'Inner'),
          h(PopoverContent, t('inner', {
            onFocusOutside: onInnerFocusOutside,
            onCloseAutoFocus: (event: Event) => event.preventDefault(),
            onOpenAutoFocus: (event: Event) => {
              event.preventDefault()
              el('inner-input')!.focus()
              el('outer-input')!.focus()
            },
          }), () => h('input', t('inner-input'))),
        ]),
      ]),
    ]), async () => {
      innerOpen.value = true
    })
    expect(active()).toBe('outer-input')
    expect(onInnerFocusOutside).toHaveBeenCalledTimes(1)
    expect(el('inner')).toBeNull()
  })

  it('dismisses a layer a consumer moves focus out of in the millisecond it opens', async () => {
    const open = ref(false)
    const onFocusOutside = vi.fn()
    await openOnHeldClock(() => h('div', { onBlurCapture: () => {} }, [
      h('button', t('outside'), 'Outside'),
      h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => {
        open.value = value
      } }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, t('content', {
          onFocusOutside,
          onCloseAutoFocus: (event: Event) => event.preventDefault(),
          onOpenAutoFocus: (event: Event) => {
            event.preventDefault()
            el('a')!.focus()
            el('outside')!.focus()
          },
        }), () => h('input', t('a'))),
      ]),
    ]), async () => {
      open.value = true
    })
    expect(onFocusOutside).toHaveBeenCalledTimes(1)
    expect(open.value).toBe(false)
  })
})
