import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'

// #3360: a trigger inside a focusable container (e.g. a `DialogContent`) must close
// its own layer when tapped again. The engines' tap sequences are replayed event by
// event, because an automated tap dispatches them all in one task and hides the gap
// iOS WebKit leaves between a touch's pointer events and its compatibility mouse events.

type Kind = 'popover' | 'modal popover' | 'menu' | 'non-modal menu' | 'menubar' | 'combobox' | 'navigation menu' | 'select'
type Order = 'webkit touch' | 'chromium touch' | 'mouse'

const kinds: Kind[] = ['popover', 'modal popover', 'menu', 'non-modal menu', 'menubar', 'combobox', 'navigation menu', 'select']

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const nextTask = () => new Promise(resolve => setTimeout(resolve))
async function drainMicrotasks() {
  for (let i = 0; i < 20; i++)
    await Promise.resolve()
}

function layer(kind: Kind): VNode {
  const trigger = { 'data-testid': 'trigger' }
  const content = { 'data-testid': 'content' }
  switch (kind) {
    case 'popover':
    case 'modal popover':
      return h(PopoverRoot, { modal: kind === 'modal popover' }, () => [
        h(PopoverTrigger, trigger, () => 'Open'),
        h(PopoverPortal, () => h(PopoverContent, content, () => h('button', 'inside'))),
      ])
    case 'menu':
    case 'non-modal menu':
      return h(DropdownMenuRoot, { modal: kind === 'menu' }, () => [
        h(DropdownMenuTrigger, trigger, () => 'Open'),
        h(DropdownMenuPortal, () => h(DropdownMenuContent, content, () => h(DropdownMenuItem, () => 'one'))),
      ])
    case 'menubar':
      return h(MenubarRoot, () => h(MenubarMenu, () => [
        h(MenubarTrigger, trigger, () => 'Open'),
        h(MenubarPortal, () => h(MenubarContent, content, () => h(MenubarItem, () => 'one'))),
      ]))
    case 'combobox':
      return h(ComboboxRoot, () => [
        h(ComboboxAnchor, () => [
          h(ComboboxInput, { 'aria-label': 'fruit' }),
          h(ComboboxTrigger, trigger, () => 'Open'),
        ]),
        h(ComboboxPortal, () => h(ComboboxContent, content, () =>
          h(ComboboxViewport, () => h(ComboboxItem, { value: 'one' }, () => 'one')))),
      ])
    case 'navigation menu':
      return h(NavigationMenuRoot, () => h(NavigationMenuList, () => h(NavigationMenuItem, () => [
        h(NavigationMenuTrigger, trigger, () => 'Open'),
        h(NavigationMenuContent, content, () => h(NavigationMenuLink, { href: '#' }, () => 'one')),
      ])))
    case 'select':
      return h(SelectRoot, () => [
        h(SelectTrigger, { ...trigger, 'aria-label': 'fruit' }, () => h(SelectValue, { placeholder: 'none' })),
        h(SelectPortal, () => h(SelectContent, { ...content, position: 'popper' }, () =>
          h(SelectViewport, () => h(SelectItem, { value: 'one' }, () => h(SelectItemText, () => 'one'))))),
      ])
  }
}

function mountInFocusableContainer(kind: Kind) {
  const Fixture = defineComponent({
    setup: () => () => h('div', { 'data-testid': 'container', 'tabindex': '-1', 'style': 'padding: 100px' }, [layer(kind)]),
  })
  mount(Fixture, { attachTo: document.body })
}

function pointer(type: string, pointerType: string) {
  return new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType, isPrimary: true, button: 0, buttons: type === 'pointerdown' ? 1 : 0 })
}

function mouse(type: string) {
  return new MouseEvent(type, { bubbles: true, cancelable: true, composed: true, button: 0, buttons: type === 'mousedown' ? 1 : 0, detail: 1 })
}

const focusable = 'button, input, a[href], [tabindex]'
const isOpen = () => get('trigger')!.getAttribute('data-state') === 'open'

/**
 * Replays one press on the trigger in the order each engine produces:
 * - iOS WebKit touch: the touch's pointer events, then, in a later task, the
 *   compatibility mouse events, with `mousedown` focusing the pressed button's
 *   focusable ancestor (WebKit does not focus a tapped button);
 * - Chromium touch: the same gap, but `mousedown` focuses the button itself;
 * - mouse: no gap, `mousedown` focusing the button.
 * The events go to whatever is under the trigger, as a modal layer can make the
 * trigger itself unhittable. Focus follows `mousedown` unless that is prevented,
 * like the browser default.
 */
async function press(order: Order) {
  const rect = get('trigger')!.getBoundingClientRect()
  const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)!
  const focusTarget = order === 'webkit touch' && target.matches('button')
    ? target.parentElement?.closest<HTMLElement>(focusable)
    : target.closest<HTMLElement>(focusable)
  const pointerType = order === 'mouse' ? 'mouse' : 'touch'

  // A browser dispatches each event on its own, running microtasks (and so the
  // ticks outside handlers wait for) in between.
  const dispatch = async (event: Event) => {
    const notPrevented = target.dispatchEvent(event)
    await drainMicrotasks()
    return notPrevented
  }

  // A prevented `pointerdown` suppresses the compatibility mouse events.
  const withMouseEvents = await dispatch(pointer('pointerdown', pointerType))
  if (order !== 'mouse') {
    await dispatch(pointer('pointerup', pointerType))
    await nextTask()
  }
  if (withMouseEvents && await dispatch(mouse('mousedown'))) {
    focusTarget?.focus()
    await drainMicrotasks()
  }
  if (order === 'mouse')
    await dispatch(pointer('pointerup', pointerType))
  if (withMouseEvents)
    await dispatch(mouse('mouseup'))
  await dispatch(mouse('click'))

  // Let the content mount or unmount, then let a mounted layer start listening for
  // outside presses (it does so from a 0 ms timer).
  for (let i = 0; i < 50 && isOpen() !== !!get('content'); i++)
    await nextTask()
  await nextTask()
  await nextTask()
}

describe('given a layer whose trigger sits inside a focusable container (#3360)', () => {
  describe.each(kinds)('%s', (kind) => {
    // Opened and reopened with a mouse press, so only the press under test closes it.
    it.each<Order>(['webkit touch', 'chromium touch', 'mouse'])('closes when the trigger is pressed again with %s', async (order) => {
      mountInFocusableContainer(kind)

      const states: boolean[] = []
      for (const each of ['mouse', order, 'mouse'] as const) {
        await press(each)
        states.push(isOpen())
      }
      expect(states).toEqual([true, false, true])
    })
  })
})
