import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'

// Real hit testing, pointer events and page scrolling for the #2822 modality
// model: modal layers block the page with an internal backdrop instead of
// `pointer-events: none` on <body>, and lock scroll through overflow.

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const backdrops = () => [...document.querySelectorAll<HTMLElement>('[data-reka-internal-backdrop]')]
function center(el: Element) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** A real (trusted) mouse wheel over the given point. */
async function wheel(x: number, y: number, deltaY: number) {
  await cdp().send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY })
  // Let the compositor apply the scroll
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  window.scrollTo(0, 0)
})

function mountFixture(render: () => any) {
  const wrapper = mount(defineComponent({ setup: () => render }), { attachTo: document.body })
  unmount = () => wrapper.unmount()
}

const dialogContentStyle = 'position: fixed; top: 100px; left: 100px; width: 200px; background: white; z-index: 10;'

function renderDialog(open: ReturnType<typeof ref<boolean>>, options: { overlay?: boolean, modal?: boolean } = {}) {
  return h(DialogRoot, {
    'open': open.value,
    'modal': options.modal ?? true,
    'onUpdate:open': (value: boolean) => { open.value = value },
  }, () => h(DialogPortal, () => [
    options.overlay ? h(DialogOverlay, { 'data-testid': 'overlay', 'style': 'position: fixed; inset: 0; z-index: 10;' }) : null,
    h(DialogContent, { 'data-testid': 'dialog', 'aria-describedby': undefined, 'style': dialogContentStyle }, () => h(DialogTitle, () => 'Dialog')),
  ]))
}

describe('given a modal Dialog without an overlay, in a real browser', () => {
  it('should cover the page with the internal backdrop, never pointer-events on body', async () => {
    const open = ref<boolean>(false)
    const onOutsideClick = vi.fn()
    mountFixture(() => h('div', [
      h('button', { 'data-testid': 'outside', 'style': 'position: absolute; top: 20px; left: 20px;', 'onClick': onOutsideClick }, 'Outside'),
      renderDialog(open),
    ]))

    open.value = true
    await expect.poll(() => backdrops().length).toBe(1)
    expect(getComputedStyle(document.body).pointerEvents).toBe('auto')

    const point = center(get('outside')!)
    expect(document.elementFromPoint(point.x, point.y)).toBe(backdrops()[0])

    // A real click on the outside button lands on the backdrop: the dialog
    // closes and the button does not get the click.
    await userEvent.click(get('outside')!, { force: true })
    await expect.poll(() => get('dialog')).toBeNull()
    expect(onOutsideClick).not.toHaveBeenCalled()
    expect(backdrops()).toHaveLength(0)

    await userEvent.click(get('outside')!)
    expect(onOutsideClick).toHaveBeenCalledTimes(1)
  })

  it('should keep an element stacked above the backdrop clickable without closing the dialog (#1540)', async () => {
    const open = ref<boolean>(true)
    const onWidgetClick = vi.fn()
    mountFixture(() => h('div', [
      h('button', {
        'data-testid': 'widget',
        'style': 'position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;',
        'onClick': onWidgetClick,
      }, 'Chat'),
      renderDialog(open),
    ]))
    await expect.poll(() => backdrops().length).toBe(1)

    await userEvent.click(get('widget')!)
    expect(onWidgetClick).toHaveBeenCalledTimes(1)
    // Give a would-be dismissal time to land
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(get('dialog')).not.toBeNull()
  })
})

describe('given a page that scrolls, in a real browser', () => {
  function mountScrollingPage(open: ReturnType<typeof ref<boolean>>) {
    mountFixture(() => h('div', [
      h('div', { 'data-testid': 'page', 'style': 'height: 4000px; background: linear-gradient(red, blue);' }),
      renderDialog(open, { overlay: true }),
    ]))
  }

  it('should block wheel scrolling while a modal dialog is open and restore it after', async () => {
    const open = ref<boolean>(false)
    mountScrollingPage(open)
    window.scrollTo(0, 300)
    await expect.poll(() => window.scrollY).toBe(300)

    open.value = true
    await expect.poll(() => getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden').toBe(true)
    // The lock keeps the current scroll position
    expect(window.scrollY).toBe(300)

    await wheel(50, 50, 400)
    expect(window.scrollY).toBe(300)

    open.value = false
    await expect.poll(() => getComputedStyle(document.body).overflowY).not.toBe('hidden')
    expect(window.scrollY).toBe(300)

    await wheel(50, 50, 400)
    await expect.poll(() => window.scrollY).toBeGreaterThan(300)
  })

  it('should not shift the layout when the scrollbar is hidden, and restore the original styles exactly', async () => {
    const open = ref<boolean>(false)
    document.documentElement.style.scrollBehavior = 'auto'
    document.body.style.margin = '8px'
    mountScrollingPage(open)

    const htmlStyle = document.documentElement.getAttribute('style')
    const bodyStyle = document.body.getAttribute('style')
    const pageWidth = get('page')!.getBoundingClientRect().width

    open.value = true
    await expect.poll(() => getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden').toBe(true)
    expect(get('page')!.getBoundingClientRect().width).toBe(pageWidth)
    expect(getComputedStyle(document.body).paddingRight).toBe('0px')

    open.value = false
    await expect.poll(() => document.body.getAttribute('style')).toBe(bodyStyle)
    expect(document.documentElement.getAttribute('style')).toBe(htmlStyle)
    expect(get('page')!.getBoundingClientRect().width).toBe(pageWidth)

    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
  })
})

describe('given a non-modal Popover under a modal Dialog, in a real browser', () => {
  it('should route a click over the popover to the dialog backdrop, closing only the dialog', async () => {
    const popoverOpen = ref<boolean>(true)
    const dialogOpen = ref<boolean>(false)
    const onPopoverButton = vi.fn()
    mountFixture(() => h('div', { style: 'padding: 300px' }, [
      h(PopoverRoot, {
        'open': popoverOpen.value,
        'onUpdate:open': (value: boolean) => { popoverOpen.value = value },
      }, () => [
        h(PopoverTrigger, () => 'Popover'),
        h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'popover', 'style': 'background: white; z-index: 5;' }, () => [
          h('button', { 'data-testid': 'popover-button', 'onClick': onPopoverButton }, 'In popover'),
        ])),
      ]),
      renderDialog(dialogOpen),
    ]))
    await expect.poll(() => get('popover')).not.toBeNull()

    dialogOpen.value = true
    await expect.poll(() => backdrops().length).toBe(1)

    await userEvent.click(get('popover-button')!, { force: true })
    await expect.poll(() => dialogOpen.value).toBe(false)
    expect(onPopoverButton).not.toHaveBeenCalled()
    expect(popoverOpen.value).toBe(true)

    // Back in front: the popover is interactive again
    await userEvent.click(get('popover-button')!)
    expect(onPopoverButton).toHaveBeenCalledTimes(1)
  })
})

describe('given a modal Popover, in a real browser', () => {
  it('should leave the trigger clickable through the backdrop and toggle closed on it', async () => {
    const open = ref<boolean>(false)
    mountFixture(() => h('div', { style: 'padding: 200px' }, [
      h('button', { 'data-testid': 'outside' }, 'Outside'),
      h(PopoverRoot, {
        'open': open.value,
        'modal': true,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(PopoverTrigger, { 'data-testid': 'trigger' }, () => 'Toggle'),
        h(PopoverPortal, () => h(PopoverContent, { 'data-testid': 'popover', 'style': 'background: white;' }, () => 'Content')),
      ]),
    ]))

    await userEvent.click(get('trigger')!)
    await expect.poll(() => backdrops().length).toBe(1)

    const triggerPoint = center(get('trigger')!)
    expect(document.elementFromPoint(triggerPoint.x, triggerPoint.y)).toBe(get('trigger'))
    const outsidePoint = center(get('outside')!)
    expect(document.elementFromPoint(outsidePoint.x, outsidePoint.y)).toBe(backdrops()[0])

    await userEvent.click(get('trigger')!)
    await expect.poll(() => open.value).toBe(false)
    // Not re-opened by the same press
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(open.value).toBe(false)
    expect(backdrops()).toHaveLength(0)
  })
})

describe('given page chrome with its own z-index, in a real browser', () => {
  function stickyHeader(onClick: () => void, zIndex: number) {
    return h('header', { style: `position: sticky; top: 0; z-index: ${zIndex}; height: 60px; background: #eee;` }, [
      h('button', { 'data-testid': 'header-button', 'style': 'margin: 10px;', onClick }, 'Header'),
    ])
  }

  it('should cover a sticky z-indexed header under a modal Dialog without an overlay', async () => {
    const open = ref<boolean>(true)
    const onHeaderClick = vi.fn()
    mountFixture(() => h('div', { style: 'height: 2000px' }, [
      stickyHeader(onHeaderClick, 5),
      renderDialog(open),
    ]))
    await expect.poll(() => backdrops().length).toBe(1)
    // The backdrop takes the dialog's z-index, so it sits above the header
    expect(backdrops()[0].style.zIndex).toBe('10')

    const point = center(get('header-button')!)
    expect(document.elementFromPoint(point.x, point.y)).toBe(backdrops()[0])

    await userEvent.click(get('header-button')!, { force: true })
    await expect.poll(() => get('dialog')).toBeNull()
    expect(onHeaderClick).not.toHaveBeenCalled()
  })

  it('should cover a sticky z-indexed header under a modal DropdownMenu, so one click only closes the menu', async () => {
    const onHeaderClick = vi.fn()
    mountFixture(() => h('div', { style: 'height: 2000px' }, [
      stickyHeader(onHeaderClick, 10),
      h('div', { style: 'padding: 100px' }, h(DropdownMenuRoot, () => [
        h(DropdownMenuTrigger, { 'data-testid': 'trigger' }, () => 'Menu'),
        h(DropdownMenuPortal, () => h(DropdownMenuContent, { 'data-testid': 'menu', 'style': 'z-index: 50; background: white;' }, () => [
          h(DropdownMenuItem, () => 'Item'),
        ])),
      ])),
    ]))

    await userEvent.click(get('trigger')!)
    await expect.poll(() => backdrops().length).toBe(1)
    expect(backdrops()[0].style.zIndex).toBe('50')

    const point = center(get('header-button')!)
    expect(document.elementFromPoint(point.x, point.y)).toBe(backdrops()[0])

    await userEvent.click(get('header-button')!, { force: true })
    await expect.poll(() => get('menu')).toBeNull()
    expect(onHeaderClick).not.toHaveBeenCalled()
  })

  it('should still leave content above the layer\'s z-index clickable (#1540)', async () => {
    const open = ref<boolean>(true)
    const onHeaderClick = vi.fn()
    mountFixture(() => h('div', [
      stickyHeader(onHeaderClick, 20),
      renderDialog(open),
    ]))
    await expect.poll(() => backdrops().length).toBe(1)

    await userEvent.click(get('header-button')!)
    expect(onHeaderClick).toHaveBeenCalledTimes(1)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(get('dialog')).not.toBeNull()
  })
})

describe.each([
  'transform: translateX(0)',
  'filter: blur(0)',
  'contain: paint',
  'will-change: transform',
  'backdrop-filter: blur(1px)',
])('given a non-portaled modal Dialog inside an ancestor with `%s`, in a real browser', (ancestorStyle) => {
  it('should cover the whole viewport, not just the ancestor', async () => {
    const open = ref<boolean>(true)
    const onOutsideClick = vi.fn()
    mountFixture(() => h('div', [
      h('button', { 'data-testid': 'outside', 'style': 'position: fixed; right: 10px; bottom: 10px;', 'onClick': onOutsideClick }, 'Outside'),
      h('div', { 'data-testid': 'ancestor', 'style': `${ancestorStyle}; width: 150px; height: 150px; margin: 20px;` }, [
        h(DialogRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => { open.value = value },
        }, () => h(DialogContent, { 'data-testid': 'dialog', 'aria-describedby': undefined, 'style': 'position: fixed; top: 10px; left: 10px; width: 100px; background: white;' }, () => h(DialogTitle, () => 'Dialog'))),
      ]),
    ]))
    await expect.poll(() => backdrops().length).toBe(1)

    const [backdrop] = backdrops()
    const rect = backdrop.getBoundingClientRect()
    expect(rect.width).toBe(window.innerWidth)
    expect(rect.height).toBe(window.innerHeight)

    // Still below the dialog
    const dialogPoint = center(get('dialog')!)
    expect(get('dialog')!.contains(document.elementFromPoint(dialogPoint.x, dialogPoint.y))).toBe(true)
    // Covers the page outside the ancestor
    const outsidePoint = center(get('outside')!)
    expect(document.elementFromPoint(outsidePoint.x, outsidePoint.y)).toBe(backdrop)

    await userEvent.click(get('outside')!, { force: true })
    await expect.poll(() => get('dialog')).toBeNull()
    expect(onOutsideClick).not.toHaveBeenCalled()
  })
})
