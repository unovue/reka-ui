import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '@/Select'

type Kind = 'select' | 'menu' | 'modal popover' | 'popover'

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const isFocusWithin = (id: string) => !!get(id)?.contains(document.activeElement)

// A layer listens for outside pointerdowns from a 0 ms timer set when it mounts, and a
// DropdownMenu returns focus to its trigger from one set when it unmounts. A timer queued
// after those runs after them.
const afterTimers = () => new Promise(resolve => setTimeout(resolve))
const afterFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

/** `pointer-events: auto` keeps a trigger clickable while a modal layer disables the rest of the page (#2583). */
function triggerProps(id: string, index: number, clickableUnderModal: boolean, extra: Record<string, unknown> = {}) {
  return {
    'data-testid': `${id}-trigger`,
    'aria-label': id,
    'style': `position: fixed; top: 10px; left: ${index * 300}px;${clickableUnderModal ? ' pointer-events: auto' : ''}`,
    ...extra,
  }
}

function select(id: string, trigger: Record<string, unknown>, root: Record<string, unknown> = {}, content: Record<string, unknown> = {}) {
  return h(SelectRoot, root, () => [
    h(SelectTrigger, trigger, () => h(SelectValue, { placeholder: 'none' })),
    h(SelectPortal, () => h(SelectContent, { 'data-testid': `${id}-content`, 'position': 'popper', ...content }, () =>
      h(SelectViewport, () => ['one', 'two'].map(value =>
        h(SelectItem, { value, 'data-testid': `${id}-${value}` }, () => h(SelectItemText, () => value)),
      )))),
  ])
}

function layer(kind: Kind, id: string, trigger: Record<string, unknown>, content: Record<string, unknown> = {}, children: () => VNode[] = () => []): VNode {
  if (kind === 'select')
    return select(id, trigger, {}, content)
  if (kind === 'menu') {
    return h(DropdownMenuRoot, () => [
      h(DropdownMenuTrigger, trigger, () => id),
      h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-testid': `${id}-content`, ...content }, () =>
        h(DropdownMenuItem, { 'data-testid': `${id}-one` }, () => 'one'))),
    ])
  }
  return h(PopoverRoot, { modal: kind === 'modal popover' }, () => [
    h(PopoverTrigger, trigger, () => id),
    h(PopoverPortal, () => h(PopoverContent, { 'data-testid': `${id}-content`, ...content }, () => [
      h(PopoverClose, { 'data-testid': `${id}-one` }, () => 'one'),
      ...children(),
    ])),
  ])
}

async function open(id: string) {
  await userEvent.click(get(`${id}-trigger`)!)
  await expect.poll(() => isFocusWithin(`${id}-content`)).toBe(true)
  await afterTimers()
}

describe('opening a layer during a native pointerdown', () => {
  function mountLayers(first: Kind, clickableUnderModal: boolean) {
    const onClosedSelectOpenChange = vi.fn()
    const onFirstCloseAutoFocus = vi.fn((event: Event) => event.defaultPrevented)
    const secondValue = ref<string>()
    mount(defineComponent({
      setup: () => () => h('div', [
        layer(first, 'first', triggerProps('first', 0, clickableUnderModal), { onCloseAutoFocus: onFirstCloseAutoFocus }),
        select('second', triggerProps('second', 1, clickableUnderModal), {
          'modelValue': secondValue.value,
          'onUpdate:modelValue': (value: string) => secondValue.value = value,
        }),
        select('closed', triggerProps('closed', 2, clickableUnderModal), { 'open': false, 'onUpdate:open': onClosedSelectOpenChange }),
      ]),
    }), { attachTo: document.body })
    return { onClosedSelectOpenChange, onFirstCloseAutoFocus, secondValue }
  }

  /** The first layer is gone, `closeAutoFocus` and all, and the Select that replaced it kept the focus. */
  async function expectSecondToHaveReplacedFirst({ onFirstCloseAutoFocus }: ReturnType<typeof mountLayers>, focused = 'second-content') {
    await expect.poll(() => get('second-content')).not.toBeNull()
    await expect.poll(() => get('first-content')).toBeNull()
    expect(get('second-trigger')?.getAttribute('aria-expanded')).toBe('true')

    // The event is still emitted, unprevented; only its default action leaves the focus alone.
    await expect.poll(() => onFirstCloseAutoFocus.mock.results[0]?.value).toBe(false)
    await afterTimers()
    await expect.poll(() => isFocusWithin(focused)).toBe(true)
  }

  it.each<[string, Kind, boolean]>([
    ['Select', 'select', true],
    ['modal DropdownMenu', 'menu', true],
    ['modal Popover', 'modal popover', true],
    ['non-modal Popover, with no CSS override,', 'popover', false],
  ])('closes an open %s and hands the keyboard to the Select that opens', async (_label, first, clickableUnderModal) => {
    const layers = mountLayers(first, clickableUnderModal)
    await open('first')
    expect(layers.onClosedSelectOpenChange).not.toHaveBeenCalled()

    await userEvent.click(get('second-trigger')!)
    await expectSecondToHaveReplacedFirst(layers)

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => document.activeElement).toBe(get('second-two'))
    await userEvent.keyboard('{Enter}')

    await expect.poll(() => layers.secondValue.value).toBe('two')
    await expect.poll(() => get('second-content')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(get('second-trigger'))
    // The keys never reached the first layer's trigger, which would have opened it again
    expect(get('first-content')).toBeNull()
    expect(get('first-trigger')?.textContent).toBe(first === 'select' ? 'none' : 'first')
    expect(layers.onClosedSelectOpenChange).not.toHaveBeenCalled()
  })

  it('closes an open Select when another one is opened by touch', async () => {
    const layers = mountLayers('select', true)
    await open('first')

    // CDP input uses top-level viewport coordinates; the test runs inside an iframe.
    const rect = get('second-trigger')!.getBoundingClientRect()
    const frame = window.frameElement as HTMLElement
    const frameRect = frame.getBoundingClientRect()
    const scale = frameRect.width / frame.offsetWidth
    const point = {
      x: Math.round(frameRect.left + (rect.left + rect.width / 2) * scale),
      y: Math.round(frameRect.top + (rect.top + rect.height / 2) * scale),
    }
    const send = (method: string, params: Record<string, unknown>) => (cdp() as any).send(method, params)
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

    // A tap leaves focus on the trigger it opened, as it does for a Select opened on its own
    await expectSecondToHaveReplacedFirst(layers, 'second-trigger')
    expect(layers.onClosedSelectOpenChange).not.toHaveBeenCalled()
  })
})

describe('closing a layer on its own', () => {
  function mountLayer(kind: Kind) {
    const onCloseAutoFocus = vi.fn()
    const onTriggerFocus = vi.fn()
    mount(defineComponent({
      setup: () => () => h('div', [
        layer(kind, 'first', triggerProps('first', 0, false, { onFocus: onTriggerFocus }), { onCloseAutoFocus }),
        h('button', { 'data-testid': 'outside', 'style': 'position: fixed; top: 300px; left: 300px' }, 'outside'),
      ]),
    }), { attachTo: document.body })
    return { onCloseAutoFocus, onTriggerFocus }
  }

  describe.each<[string, Kind]>([
    ['Select', 'select'],
    ['modal DropdownMenu', 'menu'],
    ['modal Popover', 'modal popover'],
  ])('given a %s', (_label, kind) => {
    it('returns focus to the trigger on Escape', async () => {
      const { onCloseAutoFocus } = mountLayer(kind)
      await open('first')

      await userEvent.keyboard('{Escape}')

      await expect.poll(() => get('first-content')).toBeNull()
      await expect.poll(() => document.activeElement).toBe(get('first-trigger'))
      expect(onCloseAutoFocus).toHaveBeenCalled()
    })

    it('returns focus to the trigger when something inside closes it', async () => {
      const { onCloseAutoFocus } = mountLayer(kind)
      await open('first')

      await userEvent.click(get('first-one')!)

      await expect.poll(() => get('first-content')).toBeNull()
      await expect.poll(() => document.activeElement).toBe(get('first-trigger'))
      expect(onCloseAutoFocus).toHaveBeenCalled()
    })

    // The page under a modal layer takes no pointer events, so the button is never the target.
    it('returns focus to the trigger, not to a button clicked outside', async () => {
      const { onCloseAutoFocus, onTriggerFocus } = mountLayer(kind)
      await open('first')
      onTriggerFocus.mockClear()

      // `force` skips the actionability check, which would wait for the button to take pointer events
      await userEvent.click(get('outside')!, { force: true })

      await expect.poll(() => get('first-content')).toBeNull()
      await expect.poll(() => onTriggerFocus.mock.calls.length).toBe(1)
      expect(onCloseAutoFocus).toHaveBeenCalled()
      await afterTimers()
      expect(document.activeElement).not.toBe(get('outside'))
    })
  })
})

describe('closing a layer together with one nested in it', () => {
  it('returns focus to the trigger of a modal Popover closed from a DropdownMenu inside it', async () => {
    const isOpen = ref(false)
    mount(defineComponent({
      setup: () => () => h(PopoverRoot, { 'modal': true, 'open': isOpen.value, 'onUpdate:open': (value: boolean) => isOpen.value = value }, () => [
        h(PopoverTrigger, { 'data-testid': 'first-trigger' }, () => 'first'),
        h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'first-content' }, () =>
          h(DropdownMenuRoot, { modal: false }, () => [
            h(DropdownMenuTrigger, { 'data-testid': 'second-trigger' }, () => 'second'),
            h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-testid': 'second-content' }, () =>
              h(DropdownMenuItem, { 'data-testid': 'second-one', 'onSelect': () => isOpen.value = false }, () => 'one'))),
          ]))),
      ]),
    }), { attachTo: document.body })
    await open('first')
    await open('second')

    await userEvent.click(get('second-one')!)

    await expect.poll(() => get('first-content')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(get('first-trigger'))
  })

  // Focus that stayed on the Popover's trigger would let the Enter that selected open it again.
  it('keeps a Popover closed that was closed by selecting in a Select inside it', async () => {
    const isOpen = ref(false)
    mount(defineComponent({
      setup: () => () => h(PopoverRoot, { 'open': isOpen.value, 'onUpdate:open': (value: boolean) => isOpen.value = value }, () => [
        h(PopoverTrigger, { 'data-testid': 'first-trigger' }, () => 'first'),
        h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'first-content' }, () =>
          select('second', { 'data-testid': 'second-trigger', 'aria-label': 'second' }, { 'onUpdate:modelValue': () => isOpen.value = false }))),
      ]),
    }), { attachTo: document.body })
    await open('first')
    await open('second')

    await userEvent.keyboard('{Enter}')

    await expect.poll(() => get('second-content')).toBeNull()
    await afterFrames()
    expect(isOpen.value).toBe(false)
    expect(get('first-content')).toBeNull()
  })

  // The outer layer and the Select open inside it unmount in one pass, after another layer has
  // taken focus. Neither may take it back: the Select's trigger is on its way out with the
  // outer layer, so focus would be dropped on `body` with the other layer still open.
  it.each<[string, 'popover' | 'dialog', boolean]>([
    ['non-modal Popover', 'popover', false],
    ['modal Popover', 'popover', true],
    ['non-modal Dialog', 'dialog', false],
    ['modal Dialog', 'dialog', true],
  ])('leaves focus in another layer when a %s closes with a Select open inside it', async (_label, outer, modal) => {
    const isOuterOpen = ref(false)
    const isOtherOpen = ref(false)
    const otherValue = ref<string>()
    const onOuterCloseAutoFocus = vi.fn()
    const outerRoot = () => ({ modal, 'open': isOuterOpen.value, 'onUpdate:open': (value: boolean) => isOuterOpen.value = value })
    const outerContent = { 'data-testid': 'first-content', 'onCloseAutoFocus': onOuterCloseAutoFocus }
    const nested = () => select('second', { 'data-testid': 'second-trigger', 'aria-label': 'second' })
    mount(defineComponent({
      setup: () => () => h('div', [
        outer === 'popover'
          ? h(PopoverRoot, outerRoot(), () => [
              h(PopoverTrigger, triggerProps('first', 0, false), () => 'first'),
              h(PopoverPortal, () => h(PopoverContent, outerContent, () => nested())),
            ])
          : h(DialogRoot, outerRoot(), () => [
              h(DialogTrigger, triggerProps('first', 0, false), () => 'first'),
              h(DialogPortal, () => h(DialogContent, { ...outerContent, 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'first'), nested()])),
            ]),
        select('third', triggerProps('third', 1, false), {
          'open': isOtherOpen.value,
          'onUpdate:open': (value: boolean) => isOtherOpen.value = value,
          'modelValue': otherValue.value,
          'onUpdate:modelValue': (value: string) => otherValue.value = value,
        }),
      ]),
    }), { attachTo: document.body })
    await open('first')
    await open('second')
    isOtherOpen.value = true
    await expect.poll(() => isFocusWithin('third-content')).toBe(true)

    isOuterOpen.value = false

    await expect.poll(() => get('first-content')).toBeNull()
    expect(get('second-content')).toBeNull()
    await expect.poll(() => onOuterCloseAutoFocus.mock.calls.length).toBeGreaterThan(0)
    await afterTimers()
    expect(isFocusWithin('third-content')).toBe(true)

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => document.activeElement).toBe(get('third-two'))
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => otherValue.value).toBe('two')
    await expect.poll(() => document.activeElement).toBe(get('third-trigger'))
    expect(get('first-content')).toBeNull()
  })
})
