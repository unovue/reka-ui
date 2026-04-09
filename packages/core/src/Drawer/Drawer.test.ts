import type { Mock, MockInstance } from 'vitest'
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
    },
    template: `
      <DrawerRoot @update:open="onOpenChange">
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
})
