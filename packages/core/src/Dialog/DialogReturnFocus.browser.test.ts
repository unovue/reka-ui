import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '@/AlertDialog'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

// A dialog that opens while another one holds focus in its trap must still know where
// focus goes when it closes: the trigger that was pressed, or the element focused at the
// open, or its trigger when that element has left the DOM.

type Kind = 'Dialog' | 'AlertDialog'

const PARTS = {
  Dialog: { Root: DialogRoot, Trigger: DialogTrigger, Portal: DialogPortal, Overlay: DialogOverlay, Content: DialogContent, Title: DialogTitle, Close: DialogClose },
  AlertDialog: { Root: AlertDialogRoot, Trigger: AlertDialogTrigger, Portal: AlertDialogPortal, Overlay: AlertDialogOverlay, Content: AlertDialogContent, Title: AlertDialogTitle, Close: AlertDialogCancel },
}

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const focused = () => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName
const isFocusWithin = (id: string) => !!get(id)?.contains(document.activeElement)
async function settle() {
  await new Promise(resolve => setTimeout(resolve))
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await new Promise(resolve => setTimeout(resolve))
}

interface InnerOptions {
  kind: Kind
  modal?: boolean
  /** Rendered inside the outer content, rather than beside the outer root. */
  nested?: boolean
  keepMounted?: boolean
  onCloseAutoFocus?: (event: Event) => void
}

function mountDialogs(outerKind: Kind, inner: InnerOptions) {
  const outerOpen = ref(false)
  const innerOpen = ref(false)
  /** Where focus was when the inner trigger was pressed. */
  const focusedAtPress = ref<string>()
  const outer = PARTS[outerKind]
  const parts = PARTS[inner.kind]

  const innerDialog = () => h(parts.Root as typeof DialogRoot, {
    'open': innerOpen.value,
    'onUpdate:open': (value: boolean) => innerOpen.value = value,
    ...(inner.modal === false ? { modal: false } : {}),
    ...(inner.keepMounted ? { unmountOnHide: false } : {}),
  }, () => [
    // `pointer-events: auto` keeps it clickable while the outer modal disables the page.
    h(parts.Trigger, { 'data-testid': 'inner-trigger', 'style': 'pointer-events: auto;', 'onClickCapture': () => focusedAtPress.value = focused() }, () => 'inner'),
    h(parts.Portal, null, () => [
      inner.modal === false ? null : h(parts.Overlay, { 'data-testid': 'inner-overlay', 'style': 'position: fixed; inset: 0;' }),
      h(parts.Content as typeof DialogContent, {
        'aria-describedby': undefined,
        'data-testid': 'inner-content',
        'style': 'position: fixed; top: 200px; left: 200px;',
        'onCloseAutoFocus': inner.onCloseAutoFocus,
      }, () => [
        h(parts.Title, null, () => 'Inner'),
        h(parts.Close, { 'data-testid': 'inner-close' }, () => 'Close'),
      ]),
    ]),
  ])

  mount(defineComponent({
    setup: () => () => h('div', [
      h('button', { 'data-testid': 'elsewhere' }, 'elsewhere'),
      h(outer.Root as typeof DialogRoot, {
        'open': outerOpen.value,
        'onUpdate:open': (value: boolean) => outerOpen.value = value,
      }, () => [
        h(outer.Trigger, { 'data-testid': 'outer-trigger' }, () => 'outer'),
        h(outer.Portal, null, () => h(outer.Content as typeof DialogContent, {
          'aria-describedby': undefined,
          'data-testid': 'outer-content',
          // Keeps the outer dialog open when the inner trigger outside it is pressed.
          'onInteractOutside': (event: Event) => event.preventDefault(),
        }, () => [
          h(outer.Title, null, () => 'Outer'),
          h('input', { 'data-testid': 'outer-input' }),
          h(outer.Close, { 'data-testid': 'outer-close' }, () => 'Close'),
          inner.nested ? innerDialog() : null,
        ])),
      ]),
      inner.nested ? null : innerDialog(),
    ]),
  }), { attachTo: document.body })

  return { outerOpen, innerOpen, focusedAtPress }
}

/** Opens the outer dialog and leaves focus held by its trap on its input. */
async function holdFocusInOuter() {
  await userEvent.click(get('outer-trigger')!)
  await expect.poll(() => isFocusWithin('outer-content')).toBe(true)
  await settle()
  get('outer-input')!.focus()
}

async function openInner(open: () => Promise<unknown> | unknown) {
  await open()
  await expect.poll(() => isFocusWithin('inner-content')).toBe(true)
  await settle()
}

type Close = 'Escape' | 'close button' | 'overlay click'
const CLOSE: Record<Close, () => Promise<unknown>> = {
  'Escape': () => userEvent.keyboard('{Escape}'),
  'close button': () => userEvent.click(get('inner-close')!),
  'overlay click': () => userEvent.click(get('inner-overlay')!, { position: { x: 5, y: 5 } }),
}

async function closeInner(close: Close, innerOpen: { value: boolean }) {
  await CLOSE[close]()
  await expect.poll(() => innerOpen.value).toBe(false)
  await settle()
}

const INNER: { name: string, kind: Kind, modal?: boolean }[] = [
  { name: 'Dialog', kind: 'Dialog' },
  { name: 'non-modal Dialog', kind: 'Dialog', modal: false },
  { name: 'AlertDialog', kind: 'AlertDialog' },
]

const PRESS_CASES = (['Dialog', 'AlertDialog'] as Kind[]).flatMap(outer => INNER.flatMap(inner =>
  ([true, false]).flatMap(outerStaysOpen => (['Escape', 'close button', 'overlay click'] as Close[])
    // An AlertDialog does not close on an outside click, and a non-modal Dialog has no overlay.
    .filter(close => close !== 'overlay click' || (inner.kind === 'Dialog' && inner.modal !== false))
    .map(close => ({ outer, inner, outerStaysOpen, close })))))

describe('given a dialog that opens while another dialog holds focus, in a real browser', () => {
  it.each(PRESS_CASES)('$inner.name over a $outer: returns focus to the pressed trigger when closed by $close (outer stays open: $outerStaysOpen)', async ({ outer, inner, outerStaysOpen, close }) => {
    const { outerOpen, innerOpen, focusedAtPress } = mountDialogs(outer, inner)
    await holdFocusInOuter()

    await openInner(() => userEvent.click(get('inner-trigger')!))
    // The press did not move focus to the trigger: the outer trap took it back.
    expect(focusedAtPress.value).toBe('outer-input')

    if (!outerStaysOpen) {
      outerOpen.value = false
      await expect.poll(() => get('outer-content')).toBeNull()
    }
    await closeInner(close, innerOpen)
    expect(focused()).toBe('inner-trigger')
  })

  it.each(INNER.flatMap(inner => (['Dialog', 'AlertDialog'] as Kind[]).map(outer => ({ outer, inner }))))('$inner.name over a $outer: falls back to its trigger when the element focused at the open has left the DOM', async ({ outer, inner }) => {
    const { outerOpen, innerOpen } = mountDialogs(outer, inner)
    await holdFocusInOuter()

    await openInner(() => innerOpen.value = true)
    outerOpen.value = false
    await expect.poll(() => get('outer-content')).toBeNull()

    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('inner-trigger')
  })

  it.each(INNER.flatMap(inner => [false, true].map(nested => ({ inner, nested }))))('$inner.name (nested: $nested): returns focus to the element focused at the open while it is still there', async ({ inner, nested }) => {
    const { innerOpen } = mountDialogs('Dialog', { ...inner, nested })
    await holdFocusInOuter()

    await openInner(() => innerOpen.value = true)
    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('outer-input')
  })

  it.each(INNER)('$name nested and kept mounted: records the focus again on each open', async (inner) => {
    const { innerOpen } = mountDialogs('Dialog', { ...inner, nested: true, keepMounted: true })
    // The inner content mounts with the outer one, while the outer trigger has focus.
    await holdFocusInOuter()

    await openInner(() => userEvent.click(get('inner-trigger')!))
    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('inner-trigger')

    get('outer-input')!.focus()
    await openInner(() => innerOpen.value = true)
    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('outer-input')
    expect(isFocusWithin('outer-content')).toBe(true)
  })

  // WebKit does not focus a button on click, so a press inside the outer dialog leaves
  // focus where it was. A scripted `click()` reproduces that in Chromium.
  it.each(INNER)('$name nested: returns focus to its trigger when a press did not focus it', async (inner) => {
    const { innerOpen } = mountDialogs('Dialog', { ...inner, nested: true })
    await holdFocusInOuter()

    await openInner(() => get('inner-trigger')!.click())
    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('inner-trigger')
  })

  it.each(INNER)('$name: leaves focus where a prevented closeAutoFocus put it', async (inner) => {
    const { innerOpen } = mountDialogs('Dialog', {
      ...inner,
      onCloseAutoFocus: (event) => {
        event.preventDefault()
        get('outer-close')!.focus()
      },
    })
    await holdFocusInOuter()

    await openInner(() => userEvent.click(get('inner-trigger')!))
    await closeInner('Escape', innerOpen)
    expect(focused()).toBe('outer-close')
  })
})

describe('given a non-modal Dialog opened by a button of its own, in a real browser', () => {
  it('closes on the next click of that button instead of reopening', async () => {
    const open = ref(false)
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'toggle', 'onClick': () => open.value = !open.value }, 'toggle'),
        h(DialogRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, 'modal': false }, () =>
          h(DialogPortal, null, () => h(DialogContent, { 'aria-describedby': undefined, 'data-testid': 'content' }, () => [
            h(DialogTitle, null, () => 'Title'),
            h(DialogClose, { 'data-testid': 'close' }, () => 'Close'),
          ]))),
      ]),
    }), { attachTo: document.body })

    await userEvent.click(get('toggle')!)
    await expect.poll(() => isFocusWithin('content')).toBe(true)
    await settle()

    await userEvent.click(get('toggle')!)
    await expect.poll(() => get('content')).toBeNull()
    await settle()
    expect(open.value).toBe(false)
    expect(focused()).toBe('toggle')
  })
})

describe('given a dialog reopened during its exit animation, in a real browser', () => {
  // The exit is paused, so that the dialog stays in it until the test ends it.
  const STYLES = `
    @keyframes return-out { from { opacity: 1 } to { opacity: 0 } }
    .exit[data-state="closed"] { animation: return-out 1s linear paused; }
  `
  let sheet: HTMLStyleElement
  beforeEach(() => {
    sheet = document.createElement('style')
    sheet.textContent = STYLES
    document.head.append(sheet)
  })
  afterEach(() => sheet.remove())

  const exiting = () => get('content')!.getAnimations().some(animation => animation.playState === 'paused')

  it.each(INNER.flatMap(inner => [true, false].flatMap(trigger => [false, true].map(shadow => ({ inner, trigger, shadow })))))('$inner.name (with a trigger: $trigger, focus in a shadow root: $shadow): returns focus to the element focused at the first open', async ({ inner, trigger, shadow }) => {
    const open = ref(false)
    const parts = PARTS[inner.kind]
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'opener' }, 'opener'),
        h(parts.Root as typeof DialogRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => open.value = value,
          ...(inner.modal === false ? { modal: false } : {}),
        }, () => [
          trigger ? h(parts.Trigger, { 'data-testid': 'trigger' }, () => 'trigger') : null,
          h(parts.Portal, null, () => h(parts.Content as typeof DialogContent, {
            'aria-describedby': undefined,
            'data-testid': 'content',
            'class': 'exit',
          }, () => [
            h(parts.Title, null, () => 'Title'),
            // A custom element whose own input takes focus: `contains` does not see it.
            shadow
              ? h('div', { 'data-testid': 'host', 'onVnodeMounted': ({ el }: { el: HTMLElement }) => el.attachShadow({ mode: 'open' }).append(document.createElement('input')) })
              : null,
            h(parts.Close, { 'data-testid': 'close' }, () => 'Close'),
          ])),
        ]),
      ]),
    }), { attachTo: document.body })

    get('opener')!.focus()
    open.value = true
    await expect.poll(() => isFocusWithin('content')).toBe(true)
    await settle()
    if (shadow) {
      get('host')!.shadowRoot!.querySelector('input')!.focus()
      expect(focused()).toBe('host')
    }

    await userEvent.keyboard('{Escape}')
    await expect.poll(exiting).toBe(true)
    // Reopened while focus is still in the content that is animating out.
    expect(isFocusWithin('content')).toBe(true)
    open.value = true
    await expect.poll(() => get('content')!.dataset.state).toBe('open')
    await settle()

    await userEvent.keyboard('{Escape}')
    await expect.poll(exiting).toBe(true)
    get('content')!.getAnimations().forEach(animation => animation.finish())
    await expect.poll(() => get('content')).toBeNull()
    await settle()
    expect(focused()).toBe('opener')
  })
})

describe('given a kept-mounted dialog opened from an input in a shadow root outside it, in a real browser', () => {
  // The content is already in the DOM at the second open, so the open checks whether focus
  // is inside it: an input in another element's shadow root is not, and is recorded.
  it.each(INNER)('$name: returns focus to that input', async (inner) => {
    const open = ref(false)
    const parts = PARTS[inner.kind]
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'opener' }, 'opener'),
        h('div', { 'data-testid': 'host', 'onVnodeMounted': ({ el }: { el: HTMLElement }) => el.attachShadow({ mode: 'open' }).append(document.createElement('input')) }),
        h(parts.Root as typeof DialogRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => open.value = value,
          'unmountOnHide': false,
          ...(inner.modal === false ? { modal: false } : {}),
        }, () => h(parts.Portal, null, () => h(parts.Content as typeof DialogContent, {
          'aria-describedby': undefined,
          'data-testid': 'content',
        }, () => [
          h(parts.Title, null, () => 'Title'),
          h(parts.Close, { 'data-testid': 'close' }, () => 'Close'),
        ]))),
      ]),
    }), { attachTo: document.body })
    const input = () => get('host')!.shadowRoot!.querySelector('input')!

    // The first open records the opener.
    get('opener')!.focus()
    open.value = true
    await expect.poll(() => isFocusWithin('content')).toBe(true)
    await settle()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')!.dataset.state).toBe('closed')
    await settle()
    expect(focused()).toBe('opener')

    input().focus()
    open.value = true
    await expect.poll(() => isFocusWithin('content')).toBe(true)
    await settle()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')!.dataset.state).toBe('closed')
    await settle()
    expect(focused()).toBe('host')
    expect(get('host')!.shadowRoot!.activeElement).toBe(input())
  })
})
