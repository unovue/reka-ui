import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { resetBodyScrollLock } from '@/shared/useBodyScrollLock'
import { sleep } from '@/test'
import { resetLayerStack } from './layerStack'

// Modality without body `pointer-events: none` (#2822): a modal layer renders
// an internal backdrop right below itself and locks page scroll through the
// shared, overflow-based lock. These cover real component stacks.

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
})

afterEach(() => {
  resetLayerStack()
  resetBodyScrollLock()
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

/** Waits for the deferred scroll lock and the outside-press arming macrotask. */
const settle = () => sleep(20)
const isScrollLocked = () => getComputedStyle(document.body).overflowY === 'hidden'
const backdrops = () => [...document.querySelectorAll<HTMLElement>('[data-reka-internal-backdrop]')]
const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

function renderDialog(open: ReturnType<typeof ref<boolean>>, options: { modal?: boolean, overlay?: boolean, testId?: string, children?: () => any } = {}) {
  const { modal = true, overlay = true, testId = 'dialog' } = options
  return h(DialogRoot, {
    'open': open.value,
    'modal': modal,
    'onUpdate:open': (value: boolean) => { open.value = value },
  }, () => h(DialogPortal, () => [
    overlay ? h(DialogOverlay, { 'data-testid': `${testId}-overlay` }) : null,
    h(DialogContent, { 'data-testid': testId, 'aria-describedby': undefined }, () => [
      h(DialogTitle, () => 'Title'),
      options.children?.(),
    ]),
  ]))
}

function renderPopover(open: ReturnType<typeof ref<boolean>>, options: { modal?: boolean, testId?: string, children?: () => any } = {}) {
  const { modal = false, testId = 'popover' } = options
  return h(PopoverRoot, {
    'open': open.value,
    'modal': modal,
    'onUpdate:open': (value: boolean) => { open.value = value },
  }, () => [
    h(PopoverTrigger, { 'data-testid': `${testId}-trigger` }, () => 'Toggle'),
    h(PopoverPortal, () => h(PopoverContent, { 'data-testid': testId }, () => [
      h('button', { 'data-testid': `${testId}-inside` }, 'Inside'),
      options.children?.(),
    ])),
  ])
}

describe('a modal Dialog over a non-modal Popover', () => {
  function setup() {
    const popoverOpen = ref<boolean>(true)
    const dialogOpen = ref<boolean>(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        renderPopover(popoverOpen),
        renderDialog(dialogOpen),
      ]),
    }), { attachTo: document.body })
    return { wrapper, popoverOpen, dialogOpen }
  }

  it('should block the popover with the dialog backdrop and lock scroll only while the dialog is open', async () => {
    const { wrapper, popoverOpen, dialogOpen } = setup()
    await settle()
    expect(backdrops()).toHaveLength(0)
    expect(isScrollLocked()).toBe(false)

    dialogOpen.value = true
    await settle()
    expect(backdrops()).toHaveLength(1)
    expect(byTestId('dialog')!.previousElementSibling).toBe(backdrops()[0])
    expect(isScrollLocked()).toBe(true)
    // The popover sits below the modal layer
    expect(byTestId('popover')!.closest('[data-reka-popper-content-wrapper]')).not.toBeNull()
    expect(byTestId('popover')!.style.pointerEvents).toBe('none')
    expect(document.body.style.pointerEvents).toBe('')

    // A press on the dialog's backdrop dismisses the dialog only
    await fireEvent.pointerDown(backdrops()[0])
    await settle()
    expect(dialogOpen.value).toBe(false)
    expect(popoverOpen.value).toBe(true)
    expect(backdrops()).toHaveLength(0)
    expect(isScrollLocked()).toBe(false)
    expect(byTestId('popover')!.style.pointerEvents).toBe('')

    wrapper.unmount()
  })

  it('should dismiss the dialog on a press on its DialogOverlay', async () => {
    const { wrapper, popoverOpen, dialogOpen } = setup()
    dialogOpen.value = true
    await settle()

    await fireEvent.pointerDown(byTestId('dialog-overlay')!)
    await settle()
    expect(dialogOpen.value).toBe(false)
    expect(popoverOpen.value).toBe(true)

    wrapper.unmount()
  })
})

describe('a non-modal Popover inside a modal Dialog', () => {
  function setup() {
    const popoverOpen = ref<boolean>(false)
    const dialogOpen = ref<boolean>(true)
    const wrapper = mount(defineComponent({
      setup: () => () => renderDialog(dialogOpen, {
        children: () => [
          h('button', { 'data-testid': 'dialog-inside' }, 'In dialog'),
          renderPopover(popoverOpen),
        ],
      }),
    }), { attachTo: document.body })
    return { wrapper, popoverOpen, dialogOpen }
  }

  it('should keep the popover interactive and close only the popover on a press inside the dialog', async () => {
    const { wrapper, popoverOpen, dialogOpen } = setup()
    await settle()
    popoverOpen.value = true
    await vi.waitFor(() => expect(byTestId('popover')).not.toBeNull())
    await settle()
    // The non-modal popover adds no backdrop of its own
    expect(backdrops()).toHaveLength(1)
    expect(byTestId('popover')!.style.pointerEvents).toBe('auto')

    await fireEvent.pointerDown(byTestId('dialog-inside')!)
    await vi.waitFor(() => expect(popoverOpen.value).toBe(false))
    expect(dialogOpen.value).toBe(true)
    expect(isScrollLocked()).toBe(true)

    wrapper.unmount()
  })
})

describe('a modal Dialog and an element stacked above its backdrop (#1540)', () => {
  function setup(modal: boolean) {
    const dialogOpen = ref<boolean>(true)
    // e.g. a chat launcher or cookie banner with a high z-index
    const widget = document.createElement('button')
    widget.dataset.testid = 'third-party'
    document.body.append(widget)
    const wrapper = mount(defineComponent({
      setup: () => () => renderDialog(dialogOpen, { modal, overlay: modal }),
    }), { attachTo: document.body })
    return { wrapper, dialogOpen }
  }

  it('should stay open on a press on the widget when modal', async () => {
    const { wrapper, dialogOpen } = setup(true)
    await settle()

    await fireEvent.pointerDown(byTestId('third-party')!)
    await settle()
    expect(dialogOpen.value).toBe(true)

    // Its own backdrop still dismisses it
    await fireEvent.pointerDown(backdrops()[0])
    await settle()
    expect(dialogOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('should close on a press on the widget when non-modal', async () => {
    const { wrapper, dialogOpen } = setup(false)
    await settle()
    expect(backdrops()).toHaveLength(0)
    expect(isScrollLocked()).toBe(false)

    await fireEvent.pointerDown(byTestId('third-party')!)
    await settle()
    expect(dialogOpen.value).toBe(false)

    wrapper.unmount()
  })
})

describe('stacked modal Dialogs', () => {
  it('should dismiss only the top dialog on a press on its backdrop, and keep the page locked until the last closes', async () => {
    const outerOpen = ref<boolean>(true)
    const innerOpen = ref<boolean>(false)
    const wrapper = mount(defineComponent({
      setup: () => () => renderDialog(outerOpen, {
        testId: 'outer',
        children: () => renderDialog(innerOpen, { testId: 'inner' }),
      }),
    }), { attachTo: document.body })
    await settle()
    innerOpen.value = true
    await settle()
    expect(backdrops()).toHaveLength(2)

    await fireEvent.pointerDown(byTestId('inner')!.previousElementSibling!)
    await settle()
    expect(innerOpen.value).toBe(false)
    expect(outerOpen.value).toBe(true)
    expect(backdrops()).toHaveLength(1)
    expect(isScrollLocked()).toBe(true)

    await fireEvent.pointerDown(backdrops()[0])
    await settle()
    expect(outerOpen.value).toBe(false)
    expect(isScrollLocked()).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })
})

describe('a modal Popover', () => {
  it('should cut its trigger out of the backdrop and close (not re-open) on a trigger press', async () => {
    const open = ref<boolean>(false)
    const wrapper = mount(defineComponent({
      setup: () => () => renderPopover(open, { modal: true }),
    }), { attachTo: document.body })

    byTestId('popover-trigger')!.click()
    await settle()
    expect(open.value).toBe(true)
    expect(isScrollLocked()).toBe(true)
    const [backdrop] = backdrops()
    expect(backdrop.style.clipPath).toContain('polygon(')

    // The trigger stays reachable: its pointerdown is not an outside dismissal…
    await fireEvent.pointerDown(byTestId('popover-trigger')!)
    await settle()
    expect(open.value).toBe(true)
    // …and its click toggles the popover closed
    byTestId('popover-trigger')!.click()
    await settle()
    expect(open.value).toBe(false)
    expect(backdrops()).toHaveLength(0)
    expect(isScrollLocked()).toBe(false)

    wrapper.unmount()
  })

  it('should close on a press on its backdrop', async () => {
    const open = ref<boolean>(true)
    const wrapper = mount(defineComponent({
      setup: () => () => renderPopover(open, { modal: true }),
    }), { attachTo: document.body })
    await settle()

    await fireEvent.pointerDown(backdrops()[0])
    await settle()
    expect(open.value).toBe(false)

    wrapper.unmount()
  })
})
