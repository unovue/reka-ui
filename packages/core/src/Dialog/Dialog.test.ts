import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { Mock, MockInstance } from 'vitest'
import { createEvent, findByText, fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { sleep } from '@/test'
import { DialogClose, DialogContent, DialogOverlay, DialogRoot, DialogTitle, DialogTrigger } from '.'

const OPEN_TEXT = 'Open'
const CLOSE_TEXT = 'Close'
const TITLE_TEXT = 'Title'

const NoLabelDialogTest = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose },
  template: `<DialogRoot>
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogOverlay />
  <DialogContent>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
})

const UndefinedDescribedByDialog = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
  template: `<DialogRoot>
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogOverlay />
  <DialogContent :aria-describedby="undefined">
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
})

function renderAndClickDialogTrigger(Dialog: any) {
  fireEvent.click(render(Dialog).getByText(OPEN_TEXT))
}

const DialogTest = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
  template: `<DialogRoot >
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogOverlay />
  <DialogContent>
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
})

const UnmountOnHideDialogTest = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
  template: `<DialogRoot :unmount-on-hide="false">
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogOverlay />
  <DialogContent>
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
})

const NonModalUnmountOnHideDialogTest = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
  template: `<DialogRoot :modal="false" :unmount-on-hide="false">
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogContent>
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
})

// Reproduces https://github.com/unovue/reka-ui/issues/2660 — the content is
// nested *inside* the overlay (a common centering pattern), so pointerdown
// events from controls in the content bubble up to the overlay.
const NestedContentDialogTest = defineComponent({
  components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
  template: `<DialogRoot>
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogOverlay>
    <DialogContent>
      <DialogTitle>${TITLE_TEXT}</DialogTitle>
      <input data-testid="text-input" type="text">
      <DialogClose>${CLOSE_TEXT}</DialogClose>
    </DialogContent>
  </DialogOverlay>
</DialogRoot>`,
})

describe('given a Dialog with unmountOnHide=false', () => {
  let wrapper: VueWrapper<InstanceType<typeof UnmountOnHideDialogTest>>
  let trigger: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(UnmountOnHideDialogTest, { attachTo: document.body })
    trigger = wrapper.find('button')
  })

  // The content is force-mounted, so unmount explicitly to avoid leaking the
  // layer into `DismissableLayer`'s module-level tracking set across tests.
  afterEach(() => {
    wrapper?.unmount()
  })

  it('should keep content in DOM when closed after being opened', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await nextTick()

    const contentEl = document.querySelector('[role="dialog"]')
    expect(contentEl).not.toBeNull()
    expect((contentEl as HTMLElement).style.display).toBe('none')
  })

  it('should not pull focus into the content while closed on mount', async () => {
    // Content is force-mounted but hidden; auto-focus must not fire yet.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.activeElement).toBe(document.body)
  })

  it('should focus the close button on open', async () => {
    await fireEvent.click(trigger.element)
    const closeButton = await findByText(document.body, CLOSE_TEXT)
    await vi.waitFor(() => expect(closeButton).toBe(document.activeElement))
  })

  it('should re-focus the content when reopened', async () => {
    // The content stays mounted, so focus must be re-applied on each open via
    // the `present` false -> true transition (not just on physical mount).
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))

    await fireEvent.click(trigger.element)
    const closeButton = await findByText(document.body, CLOSE_TEXT)
    await vi.waitFor(() => expect(closeButton).toBe(document.activeElement))
  })

  it('should restore focus to trigger on close', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
  })

  it('should not apply aria-hidden to body after open then close', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await nextTick()

    // Content stays mounted, but the rest of the page must stay accessible.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.getAttribute('aria-hidden')).toBeNull()
  })

  it('should pass axe accessibility tests when open', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe('given a non-modal Dialog with unmountOnHide=false', () => {
  let wrapper: VueWrapper<InstanceType<typeof NonModalUnmountOnHideDialogTest>>
  let trigger: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(NonModalUnmountOnHideDialogTest, { attachTo: document.body })
    trigger = wrapper.find('button')
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('should keep content in DOM when closed after being opened', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await nextTick()

    const contentEl = document.querySelector('[role="dialog"]')
    expect(contentEl).not.toBeNull()
    expect((contentEl as HTMLElement).style.display).toBe('none')
  })

  it('should focus the close button on open', async () => {
    expect(document.activeElement).toBe(document.body)

    await fireEvent.click(trigger.element)
    const closeButton = await findByText(document.body, CLOSE_TEXT)
    await vi.waitFor(() => expect(closeButton).toBe(document.activeElement))
  })

  it('should restore focus to trigger on close', async () => {
    await fireEvent.click(trigger.element)
    await nextTick()

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
  })
})

describe('given a Dialog with unmountOnHide=false, openAutoFocus', () => {
  const OpenAutoFocusDialog = defineComponent({
    components: { DialogRoot, DialogTrigger, DialogContent, DialogClose, DialogTitle },
    props: ['onOpenAutoFocus'],
    template: `<DialogRoot :unmount-on-hide="false">
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogContent @open-auto-focus="onOpenAutoFocus">
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
  })

  it('should not emit openAutoFocus while closed and emit once per open', async () => {
    document.body.innerHTML = ''
    const onOpenAutoFocus = vi.fn()
    const wrapper = mount(OpenAutoFocusDialog, { attachTo: document.body, props: { onOpenAutoFocus } })
    const trigger = wrapper.find('button')

    // Force-mounted but hidden: the auto-focus must not fire on mount.
    await nextTick()
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(0)

    await fireEvent.click(trigger.element)
    await vi.waitFor(() => expect(onOpenAutoFocus).toHaveBeenCalledTimes(1))

    wrapper.unmount()
  })
})

// Two dialogs with `unmountOnHide: false` coexist on the page (e.g. a menu
// drawer and a cart slideover), so both contents are force-mounted from the
// start. Hidden layers/scopes must not participate in the global
// `DismissableLayer` and `FocusScope` stacks: the later-mounted hidden one
// would otherwise be treated as the topmost layer (swallowing Escape meant for
// the open dialog) and would pause the open dialog's focus trap.
describe('given two Dialogs with unmountOnHide=false', () => {
  const TwoDialogsTest = defineComponent({
    components: { DialogRoot, DialogTrigger, DialogOverlay, DialogContent, DialogClose, DialogTitle },
    props: ['onInteractOutside'],
    template: `<div>
  <DialogRoot :unmount-on-hide="false">
    <DialogTrigger data-testid="first-trigger">open first</DialogTrigger>
    <DialogOverlay />
    <DialogContent data-testid="first-content">
      <DialogTitle>first</DialogTitle>
      <DialogClose data-testid="first-close">close first</DialogClose>
    </DialogContent>
  </DialogRoot>
  <DialogRoot :modal="false" :unmount-on-hide="false">
    <DialogTrigger data-testid="second-trigger">open second</DialogTrigger>
    <DialogContent data-testid="second-content" @interact-outside="onInteractOutside">
      <DialogTitle>second</DialogTitle>
      <DialogClose data-testid="second-close">close second</DialogClose>
    </DialogContent>
  </DialogRoot>
</div>`,
  })

  let wrapper: VueWrapper<InstanceType<typeof TwoDialogsTest>>
  let onInteractOutside: Mock

  beforeEach(() => {
    document.body.innerHTML = ''
    onInteractOutside = vi.fn()
    wrapper = mount(TwoDialogsTest, { attachTo: document.body, props: { onInteractOutside } })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('should close the open dialog on Escape even though a hidden one mounted after it', async () => {
    const trigger = wrapper.find('[data-testid="first-trigger"]')
    await fireEvent.click(trigger.element)
    await nextTick()

    const content = document.querySelector('[data-testid="first-content"]') as HTMLElement
    expect(content.style.display).not.toBe('none')

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await nextTick()

    expect(content.style.display).toBe('none')
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
  })

  it('should keep the modal focus trap active despite the hidden later-mounted scope', async () => {
    await fireEvent.click(wrapper.find('[data-testid="first-trigger"]').element)
    await nextTick()
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('data-testid')).toBe('first-close'))

    // Move focus outside the open modal dialog: the trap must pull it back.
    const outside = document.querySelector('[data-testid="second-trigger"]') as HTMLElement
    outside.focus()
    await nextTick()

    const content = document.querySelector('[data-testid="first-content"]') as HTMLElement
    expect(content.contains(document.activeElement)).toBe(true)
  })

  it('should not emit interactOutside on a closed keep-mounted dialog', async () => {
    // Wait out the `setTimeout(0)` before outside-pointerdown listeners attach.
    await sleep(1)
    await fireEvent.pointerDown(document.body)
    await nextTick()
    expect(onInteractOutside).not.toHaveBeenCalled()
  })
})

// Reproduces https://github.com/unovue/reka-ui/issues/2677 — a modal Dialog
// hardcoded `disableOutsidePointerEvents` to `true`, so the prop passed to
// `DialogContent` was ignored. These are tested without a `DialogOverlay`,
// because the overlay's `useBodyScrollLock` locks `body` pointer-events through
// a separate mechanism unrelated to this prop.
function makeModalDialog(contentBinding: string) {
  return defineComponent({
    components: { DialogRoot, DialogTrigger, DialogContent, DialogClose, DialogTitle },
    template: `<DialogRoot>
  <DialogTrigger>${OPEN_TEXT}</DialogTrigger>
  <DialogContent ${contentBinding}>
    <DialogTitle>${TITLE_TEXT}</DialogTitle>
    <DialogClose>${CLOSE_TEXT}</DialogClose>
  </DialogContent>
</DialogRoot>`,
  })
}

describe('given a modal Dialog (#2677)', () => {
  let consoleWarnMock: MockInstance

  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnMock.mockRestore()
  })

  it('should lock body pointer-events by default', async () => {
    const wrapper = mount(makeModalDialog(''), { attachTo: document.body })
    fireEvent.click(wrapper.find('button').element)
    await findByText(document.body, CLOSE_TEXT)
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')
    wrapper.unmount()
  })

  it('should respect disableOutsidePointerEvents=false on the content', async () => {
    const wrapper = mount(makeModalDialog(':disable-outside-pointer-events="false"'), { attachTo: document.body })
    fireEvent.click(wrapper.find('button').element)
    await findByText(document.body, CLOSE_TEXT)
    await nextTick()

    expect(document.body.style.pointerEvents).not.toBe('none')
    wrapper.unmount()
  })

  it('should still lock body pointer-events when explicitly true', async () => {
    const wrapper = mount(makeModalDialog(':disable-outside-pointer-events="true"'), { attachTo: document.body })
    fireEvent.click(wrapper.find('button').element)
    await findByText(document.body, CLOSE_TEXT)
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')
    wrapper.unmount()
  })
})

describe('given a default Dialog', () => {
  let wrapper: VueWrapper<InstanceType<typeof DialogTest>>
  let trigger: DOMWrapper<HTMLElement>
  let closeButton: HTMLElement
  let consoleWarnMock: MockInstance
  let consoleWarnMockFunction: Mock

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DialogTest, { attachTo: document.body })
    trigger = wrapper.find('button')
    consoleWarnMockFunction = vi.fn()
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(consoleWarnMockFunction)
  })

  afterEach(() => {
    consoleWarnMock.mockRestore()
    consoleWarnMockFunction.mockClear
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(document.body)).toHaveNoViolations()

    // open modal
    wrapper.find('button').element.click()
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  describe('after clicking the trigger', () => {
    beforeEach(async () => {
      fireEvent.click(trigger.element)
      closeButton = await findByText(document.body, CLOSE_TEXT)
    })

    describe('when no description has been provided', () => {
      it('should warn to the console', () => {
        expect(consoleWarnMockFunction).toHaveBeenCalledTimes(1)
      })
    })

    describe('when no title has been provided', () => {
      beforeEach(() => {
        document.body.innerHTML = ''
      })
      it('should warn to the console', () => {
        renderAndClickDialogTrigger(NoLabelDialogTest)
        expect(consoleWarnMockFunction).toHaveBeenCalledTimes(1)
      })
    })

    describe('when aria-describedby is set to undefined', () => {
      beforeEach(() => {
        document.body.innerHTML = ''
      })
      it('should not warn to the console', () => {
        consoleWarnMockFunction.mockClear()

        renderAndClickDialogTrigger(UndefinedDescribedByDialog)
        expect(consoleWarnMockFunction).not.toHaveBeenCalled()
      })
    })

    it('should open the content', () => {
      expect(document.body.innerHTML).toContain(closeButton.innerHTML)
    })

    it('should focus the close button', () => {
      expect(closeButton).toBe(document.activeElement)
    })

    describe('when pressing escape', () => {
      beforeEach(() => {
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      })

      it('should close the content', () => {
        expect(document.body.innerHTML).not.toContain(closeButton.innerHTML)
      })

      it('should focus trigger', async () => {
        expect(document.activeElement).toBe(trigger.element)
      })
    })

    describe('when clicking the overlay', () => {
      beforeEach(async () => {
        // Wait for the document-level pointerdown listener to be registered
        // (registered via setTimeout(0) inside DismissableLayer).
        await new Promise(resolve => setTimeout(resolve, 0))
        // Find the overlay: the only element with data-state="open" that
        // isn't the trigger button or the dialog content.
        const overlayEl = Array.from(
          document.querySelectorAll('[data-state="open"]'),
        ).find(el => el.tagName === 'DIV' && !el.getAttribute('role')) as HTMLElement
        await fireEvent.pointerDown(overlayEl)
        await nextTick()
        await nextTick()
        // setTimeout(0) inside FocusScope cleanup
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      it('should close the content', () => {
        expect(document.body.innerHTML).not.toContain(closeButton.innerHTML)
      })

      it('should focus trigger', () => {
        expect(document.activeElement).toBe(trigger.element)
      })
    })
  })
})

// Regression test for https://github.com/unovue/reka-ui/issues/2660
// The overlay calls `preventDefault()` on its own `pointerdown` to keep focus
// on the trigger after the dialog closes (#2655). When the content is nested
// inside the overlay, that handler must NOT prevent the default action of
// pointerdown events bubbling up from controls inside the content — otherwise
// native `<select>`/`<input>` interactions break.
describe('given a Dialog with content nested inside the overlay', () => {
  let wrapper: VueWrapper<InstanceType<typeof NestedContentDialogTest>>
  let consoleWarnMock: MockInstance

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(NestedContentDialogTest, { attachTo: document.body })
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fireEvent.click(wrapper.find('button').element)
    await findByText(document.body, CLOSE_TEXT)
  })

  afterEach(() => {
    consoleWarnMock.mockRestore()
  })

  describe('when pressing down on a control inside the content', () => {
    it('should not prevent the default pointerdown action', async () => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="text-input"]')!
      const event = createEvent.pointerDown(input, { button: 0 })
      input.dispatchEvent(event)
      await nextTick()

      expect(event.defaultPrevented).toBe(false)
    })

    it('should keep the dialog open', async () => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="text-input"]')!
      await fireEvent.pointerDown(input, { button: 0 })
      await nextTick()

      expect(document.body.innerHTML).toContain(CLOSE_TEXT)
    })
  })
})
