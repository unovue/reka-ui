import type { RenderResult } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { FocusScope } from '.'
import { DialogContent, DialogRoot, DialogTitle, DialogTrigger } from '../Dialog'
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '../Select'

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
})
