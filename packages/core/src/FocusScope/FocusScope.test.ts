import type { RenderResult } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { FocusScope } from '.'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '../Combobox'
import { DialogContent, DialogRoot, DialogTitle, DialogTrigger } from '../Dialog'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '../Select'

const INNER_NAME_INPUT_LABEL = 'Name'
const INNER_EMAIL_INPUT_LABEL = 'Email'
const INNER_SUBMIT_LABEL = 'Submit'

const TestField = ({
  props: {
    label: String,
  },
  template: `
    <label>
      <span>{{ label }}</span>
      <input type="text" :name="label.toLowerCase()" v-bind="$attrs" />
    </label>
  `,
})

describe('focusScope', () => {
  describe('given a default FocusScope', () => {
    let rendered: RenderResult
    let focusContainer: HTMLElement
    let tabbableFirst: HTMLInputElement
    let tabbableSecond: HTMLInputElement
    let tabbableLast: HTMLButtonElement

    beforeEach(() => {
      rendered = render(defineComponent({
        components: { TestField, FocusScope },
        template: `<div>
        <FocusScope asChild loop trapped>
          <form data-testid="focus-scope">
            <TestField label=${INNER_NAME_INPUT_LABEL} />
            <TestField label=${INNER_EMAIL_INPUT_LABEL} />
            <button>${INNER_SUBMIT_LABEL}</button>
          </form>
        </FocusScope>
        <TestField label="other" />
        <button>some outer button</button>
      </div>`,
      }))
      focusContainer = rendered.getByTestId('focus-scope') as HTMLElement
      tabbableFirst = rendered.getByLabelText(INNER_NAME_INPUT_LABEL) as HTMLInputElement
      tabbableSecond = rendered.getByLabelText(INNER_EMAIL_INPUT_LABEL) as HTMLInputElement
      tabbableLast = rendered.getByText(INNER_SUBMIT_LABEL) as HTMLButtonElement
    })

    it('should focus the next element in the scope on tab', async () => {
      tabbableFirst.focus()
      await userEvent.tab()
      expect(tabbableSecond).toBe(document.activeElement)
    })

    it('should focus the last element in the scope on shift+tab from the first element in scope', async () => {
      tabbableFirst.focus()
      await userEvent.tab({ shift: true })
      expect(tabbableLast).toHaveFocus()
    })

    it('should focus the first element in scope on tab from the last element in scope', async () => {
      tabbableLast.focus()
      await userEvent.tab()
      expect(tabbableFirst).toHaveFocus()
    })

    it('should focus container when focused element is removed from the DOM', async () => {
      tabbableFirst.focus()
      tabbableFirst.remove()
      await nextTick()
      expect(focusContainer).toHaveFocus()
    })
  })

  describe('given a FocusScope where the first focusable has a negative tabindex', () => {
    let rendered: RenderResult
    let tabbableSecond: HTMLInputElement
    let tabbableLast: HTMLButtonElement

    beforeEach(() => {
      rendered = render(defineComponent({
        components: { TestField, FocusScope },
        template: `   <div>
        <FocusScope asChild loop trapped>
          <form>
            <TestField label=${INNER_NAME_INPUT_LABEL} tabIndex="-1" />
            <TestField label=${INNER_EMAIL_INPUT_LABEL} />
            <button>${INNER_SUBMIT_LABEL}</button>
          </form>
        </FocusScope>
        <TestField label="other" />
        <button>some outer button</button>
      </div>`,
      }))
      tabbableSecond = rendered.getByLabelText(INNER_EMAIL_INPUT_LABEL) as HTMLInputElement
      tabbableLast = rendered.getByText(INNER_SUBMIT_LABEL) as HTMLButtonElement
    })

    it('should skip the element with a negative tabindex on tab', async () => {
      tabbableLast.focus()
      await userEvent.tab()
      expect(tabbableSecond).toHaveFocus()
    })

    it('should skip the element with a negative tabindex on shift+tab', async () => {
      tabbableSecond.focus()
      await userEvent.tab({ shift: true })
      expect(tabbableLast).toHaveFocus()
    })
  })

  describe('given a FocusScope with internal focus handlers', () => {
    const handleLastFocusableElementBlur = vi.fn()
    let rendered: RenderResult
    let tabbableFirst: HTMLInputElement
    beforeEach(() => {
      rendered = render(defineComponent({
        components: { TestField, FocusScope },
        setup() {
          return { handleLastFocusableElementBlur }
        },
        template: `<div>
        <FocusScope asChild loop trapped>
          <form>
            <TestField label=${INNER_NAME_INPUT_LABEL} />
            <button @blur="handleLastFocusableElementBlur" >${INNER_SUBMIT_LABEL}</button>
          </form>
        </FocusScope>
      </div>`,
      }))

      tabbableFirst = rendered.getByLabelText(INNER_NAME_INPUT_LABEL) as HTMLInputElement
    })

    it('should properly blur the last element in the scope before cycling back', async () => {
      // Tab back and then tab forward to cycle through the scope
      tabbableFirst.focus()
      await userEvent.tab({ shift: true })
      await userEvent.tab()
      expect(handleLastFocusableElementBlur).toHaveBeenCalledTimes(1)
    })
  })

  // https://github.com/unovue/reka-ui/issues/2550
  describe('given a FocusScope with SelectTrigger inside Dialog (#2550)', () => {
    const DialogWithSelect = defineComponent({
      components: { DialogRoot, DialogTrigger, DialogContent, DialogTitle, SelectRoot, SelectTrigger, SelectValue, SelectContent, SelectItem },
      template: `
        <DialogRoot>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <input data-testid="email-input" type="text" placeholder="you@example.com" />
            <SelectRoot>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </SelectRoot>
          </DialogContent>
        </DialogRoot>
      `,
    })

    it('should auto-focus the first tabbable element when SelectTrigger is present', async () => {
      const rendered = render(DialogWithSelect)

      const trigger = rendered.getByRole('button', { name: 'Open' })
      await userEvent.click(trigger)

      const input1 = rendered.getByTestId('email-input')
      expect(input1).toHaveFocus()

      // close and reopen, and ensure the input is focused again, not the SelectTrigger
      await userEvent.keyboard('{Escape}')
      await userEvent.click(trigger)
      const inputReopen = rendered.getByTestId('email-input')
      expect(inputReopen).toHaveFocus()
    })
  })

  describe('given a FocusScope with Combobox input inside Dialog (#2749)', () => {
    const DialogWithCombobox = defineComponent({
      components: { DialogRoot, DialogTrigger, DialogContent, DialogTitle, ComboboxRoot, ComboboxAnchor, ComboboxTrigger, ComboboxPortal, ComboboxContent, ComboboxViewport, ComboboxInput, ComboboxItem },
      template: `
        <DialogRoot>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <ComboboxRoot>
              <ComboboxAnchor as-child>
                <ComboboxTrigger>Open combobox</ComboboxTrigger>
              </ComboboxAnchor>
              <ComboboxPortal>
                <ComboboxContent position="popper">
                  <ComboboxViewport>
                    <ComboboxInput data-testid="combobox-input" />
                    <ComboboxItem value="a">Option A</ComboboxItem>
                    <ComboboxItem value="b">Option B</ComboboxItem>
                  </ComboboxViewport>
                </ComboboxContent>
              </ComboboxPortal>
            </ComboboxRoot>
          </DialogContent>
        </DialogRoot>
      `,
    })

    // The Combobox content wraps its slot in a FocusScope (added in #2393) whose
    // job is to pause the Dialog's trapped FocusScope so the Dialog stops yanking
    // focus back to itself. That scope is registered without a `present` prop, so
    // it only pauses the Dialog when `present` defaults to `true`. If it doesn't,
    // the Dialog re-grabs focus and the input can never be focused/typed (#2749).
    it('should let the Combobox input keep focus inside a Dialog', async () => {
      const rendered = render(DialogWithCombobox)

      await userEvent.click(rendered.getByRole('button', { name: 'Open' }))
      await userEvent.click(rendered.getByText('Open combobox'))
      await nextTick()

      const input = rendered.getByTestId('combobox-input') as HTMLInputElement

      // The content focuses the input on mount; it must not be trapped back to
      // the Dialog (which would leave focus on the Dialog/ComboboxTrigger).
      expect(input).toHaveFocus()

      // And focusing it explicitly must stick.
      input.focus()
      await nextTick()
      expect(input).toHaveFocus()
    })
  })

  // The Combobox case above is one instance of a general contract: every scope
  // that omits `present` (Combobox/Select/Popover/Menu/Drawer content all do)
  // must still register in the focus-scope stack and pause an active ancestor
  // trap. A Select with its content portaled out of the Dialog exercises the
  // same path through a different consumer.
  describe('given a FocusScope with portaled Select content inside Dialog (#2749)', () => {
    const DialogWithSelect = defineComponent({
      components: { DialogRoot, DialogTrigger, DialogContent, DialogTitle, SelectRoot, SelectPortal, SelectTrigger, SelectValue, SelectContent, SelectViewport, SelectItem },
      template: `
        <DialogRoot>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <SelectRoot>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent data-testid="select-content" position="popper">
                  <SelectViewport>
                    <SelectItem value="a">Option A</SelectItem>
                    <SelectItem value="b">Option B</SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </DialogContent>
        </DialogRoot>
      `,
    })

    beforeAll(() => {
      // Select's trigger uses pointer capture and items scroll into view — both
      // unimplemented in jsdom.
      window.HTMLElement.prototype.hasPointerCapture = vi.fn()
      window.HTMLElement.prototype.releasePointerCapture = vi.fn()
      window.HTMLElement.prototype.scrollIntoView = vi.fn()
    })

    it('should move focus into the Select content, not trap it back to the Dialog', async () => {
      const rendered = render(DialogWithSelect)

      await userEvent.click(rendered.getByRole('button', { name: 'Open' }))
      await userEvent.click(rendered.getByRole('combobox'))
      await nextTick()

      const content = rendered.getByTestId('select-content')
      // The Select content traps focus; its FocusScope must pause the Dialog's
      // trap so focus lands inside the Select rather than being yanked back.
      expect(content.contains(document.activeElement)).toBe(true)
    })
  })
})
