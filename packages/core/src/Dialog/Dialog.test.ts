import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { Mock, SpyInstance } from 'vitest'
import { createEvent, findByText, fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
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
  let consoleWarnMock: SpyInstance

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
  let consoleWarnMock: SpyInstance
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
  let consoleWarnMock: SpyInstance

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
