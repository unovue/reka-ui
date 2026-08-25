import type { Mock, MockInstance } from 'vitest'
import userEvent from '@testing-library/user-event'
import { findByText, fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  DrawerVirtualKeyboardProvider,
} from '.'

const OPEN_TEXT = 'Open Drawer'
const CLOSE_TEXT = 'Close Drawer'
const TITLE_TEXT = 'Drawer Title'

const DrawerTest = defineComponent({
  components: {
    DrawerRoot,
    DrawerTrigger,
    DrawerPortal,
    DrawerOverlay,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
  },
  template: `
    <DrawerRoot>
      <DrawerTrigger>${OPEN_TEXT}</DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerTitle>${TITLE_TEXT}</DrawerTitle>
          <DrawerDescription>Description text</DrawerDescription>
          <DrawerClose>${CLOSE_TEXT}</DrawerClose>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  `,
})

const NoTitleDrawerTest = defineComponent({
  components: { DrawerRoot, DrawerTrigger, DrawerPortal, DrawerContent, DrawerClose },
  template: `
    <DrawerRoot>
      <DrawerTrigger>${OPEN_TEXT}</DrawerTrigger>
      <DrawerPortal>
        <DrawerContent>
          <DrawerClose>${CLOSE_TEXT}</DrawerClose>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  `,
})

describe('given a default Drawer', () => {
  let consoleWarnMock: MockInstance
  let consoleWarnMockFunction: Mock

  beforeEach(() => {
    document.body.innerHTML = ''
    consoleWarnMockFunction = vi.fn()
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(consoleWarnMockFunction)
  })

  afterEach(() => {
    consoleWarnMock.mockRestore()
    consoleWarnMockFunction.mockClear()
  })

  it('should pass axe accessibility tests when closed', async () => {
    render(DrawerTest)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should pass axe accessibility tests when open', async () => {
    const { getByText } = render(DrawerTest)
    await fireEvent.click(getByText(OPEN_TEXT))
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  describe('after clicking the trigger', () => {
    it('should show drawer content', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      const title = await findByText(document.body, TITLE_TEXT)
      expect(document.body).toContainElement(title)
    })

    it('should close when close button is clicked', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      const closeBtn = await findByText(document.body, CLOSE_TEXT)
      await fireEvent.click(closeBtn)
      await nextTick()
      expect(document.body.innerHTML).not.toContain(CLOSE_TEXT)
    })

    it('should close on Escape key', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      await nextTick()
      expect(document.body.innerHTML).not.toContain(TITLE_TEXT)
    })

    it('should have role="dialog" on content', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).not.toBeNull()
    })

    it('should have aria-labelledby pointing to title', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      const dialog = document.querySelector('[role="dialog"]')
      const labelId = dialog?.getAttribute('aria-labelledby')
      expect(labelId).toBeTruthy()
      const titleEl = document.getElementById(labelId!)
      expect(titleEl?.textContent).toBe(TITLE_TEXT)
    })

    it('should have aria-describedby pointing to description', async () => {
      const { getByText } = render(DrawerTest)
      await fireEvent.click(getByText(OPEN_TEXT))
      await nextTick()
      const dialog = document.querySelector('[role="dialog"]')
      const descId = dialog?.getAttribute('aria-describedby')
      expect(descId).toBeTruthy()
      const descEl = document.getElementById(descId!)
      expect(descEl?.textContent).toBe('Description text')
    })
  })

  describe('when no title is provided', () => {
    it('should warn to the console', async () => {
      render(NoTitleDrawerTest)
      await fireEvent.click(document.querySelector('button')!)
      await nextTick()
      expect(consoleWarnMockFunction).toHaveBeenCalled()
    })
  })
})

describe('update:open change event details', () => {
  const DrawerWithReason = defineComponent({
    components: { DrawerRoot, DrawerTrigger, DrawerPortal, DrawerContent, DrawerTitle, DrawerClose },
    props: {
      onOpenChange: { type: Function, required: true },
      modal: { type: [Boolean, String], default: true },
    },
    template: `
      <DrawerRoot @update:open="onOpenChange" :modal="modal">
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerPortal>
          <DrawerContent>
            <DrawerTitle>T</DrawerTitle>
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    `,
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('emits trigger-press reason on trigger click', async () => {
    const onOpenChange = vi.fn()
    const { getByText } = render(DrawerWithReason, { props: { onOpenChange } })
    await fireEvent.click(getByText('Open'))
    await nextTick()
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'trigger-press' })
  })

  it('emits close-press reason on close click', async () => {
    const onOpenChange = vi.fn()
    const { getByText } = render(DrawerWithReason, { props: { onOpenChange } })
    await fireEvent.click(getByText('Open'))
    await nextTick()
    onOpenChange.mockClear()
    await fireEvent.click(getByText('Close'))
    await nextTick()
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'close-press' })
  })

  it('closes on a second trigger click (toggle)', async () => {
    const onOpenChange = vi.fn()
    const { getByText } = render(DrawerWithReason, { props: { onOpenChange } })
    await fireEvent.click(getByText('Open'))
    await nextTick()
    onOpenChange.mockClear()
    await fireEvent.click(getByText('Open'))
    await nextTick()
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'trigger-press' })
  })

  it('closes on a second trigger click in non-modal mode', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { getByText } = render(DrawerWithReason, { props: { onOpenChange, modal: false } })
    await user.click(getByText('Open'))
    await nextTick()
    onOpenChange.mockClear()
    await user.click(getByText('Open'))
    await nextTick()
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'trigger-press' })
  })
})

describe('drawer with DrawerVirtualKeyboardProvider', () => {
  const LAYOUT_HEIGHT = 800
  let listeners: Set<() => void>

  const KeyboardDrawer = defineComponent({
    components: {
      DrawerRoot,
      DrawerVirtualKeyboardProvider,
      DrawerTrigger,
      DrawerPortal,
      DrawerContent,
      DrawerViewport,
      DrawerTitle,
    },
    template: `
      <DrawerRoot>
        <DrawerVirtualKeyboardProvider>
          <DrawerTrigger>${OPEN_TEXT}</DrawerTrigger>
          <DrawerPortal>
            <DrawerContent>
              <DrawerViewport data-testid="viewport">
                <DrawerTitle>${TITLE_TEXT}</DrawerTitle>
                <input data-testid="field" type="text">
              </DrawerViewport>
            </DrawerContent>
          </DrawerPortal>
        </DrawerVirtualKeyboardProvider>
      </DrawerRoot>
    `,
  })

  beforeEach(() => {
    listeners = new Set()
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: {
        height: LAYOUT_HEIGHT,
        offsetTop: 0,
        scale: 1,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      },
    })
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: LAYOUT_HEIGHT })
  })

  afterEach(() => {
    // @ts-expect-error - restoring the jsdom default
    delete window.visualViewport
  })

  it('publishes the keyboard inset on the viewport', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { getByText, getByTestId } = render(KeyboardDrawer)

    await fireEvent.click(getByText(OPEN_TEXT))
    await nextTick()

    getByTestId('field').focus()
    await nextTick()
    ;(window.visualViewport as any).height = LAYOUT_HEIGHT - 300
    listeners.forEach(listener => listener())
    vi.advanceTimersByTime(100)

    expect(getByTestId('viewport').style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px')
    vi.useRealTimers()
  })
})
