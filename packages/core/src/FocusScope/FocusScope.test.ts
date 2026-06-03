import type { RenderResult } from '@testing-library/vue'
import type { VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { sleep } from '@/test'
import { FocusScope } from '.'
import { DialogContent, DialogRoot, DialogTitle, DialogTrigger } from '../Dialog'
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '../Select'
import Dialog from './story/shadowDom/_Dialog.vue'
import ShadowRootContainer from './story/shadowDom/ShadowRootContainer.vue'

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

describe('focusScope (light DOM)', () => {
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

describe('focusScope (shadow root)', () => {
  function renderInShadowRoot(component: unknown) {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const container = document.createElement('div')
    shadow.appendChild(container)
    const rendered = render(component, { container, baseElement: container })
    return { rendered, host }
  }

  function getActiveElement(container: Element): Element | null {
    const root = container.getRootNode()
    if ((root as ShadowRoot).host)
      return (root as ShadowRoot).activeElement
    return null
  }

  it('keeps focus on input while adding or removing shadow elements during typing', async () => {
    const { rendered, host } = renderInShadowRoot(defineComponent({
      components: { FocusScope },
      data: () => ({ value: '' }),
      template: `
        <FocusScope asChild loop trapped>
          <div>
            <label>
              <span>${INNER_NAME_INPUT_LABEL}</span>
              <input type="text" aria-label="${INNER_NAME_INPUT_LABEL}" v-model="value" />
            </label>
            <span v-if="value" data-testid="shadow-extra">extra</span>
          </div>
        </FocusScope>
      `,
    }))

    try {
      await nextTick()
      const input = rendered.getByLabelText(INNER_NAME_INPUT_LABEL)
      input.focus()
      expect(getActiveElement(rendered.container)).toBe(input)
      await userEvent.type(input, 'Foo')

      await waitFor(() => expect(rendered.queryByTestId('shadow-extra')).not.toBeNull())
      expect(getActiveElement(rendered.container)).toBe(input)
      expect((getActiveElement(rendered.container) as HTMLInputElement).value).toBe('Foo')

      await userEvent.keyboard('{Backspace>5}')
      await waitFor(() => expect(rendered.queryByTestId('shadow-extra')).toBeNull())
      expect(getActiveElement(rendered.container)).toBe(input)
    }
    finally {
      rendered.unmount()
      host?.remove()
    }
  })

  type ShadowRootTestCase = {
    description: string
    testCase: 'shadowDomOnly' | 'mixedBodyAndShadowDom' | 'bodyOnly'
  }

  describe('shadow DOM focus loop test', () => {
    const testSuite: ShadowRootTestCase[] = [
      {
        description: 'given a Dialog in the document body, with nested dismissable layers also in the document body',
        testCase: 'bodyOnly',
      },
      {
        description: 'given a Dialog inside a ShadowRoot, with nested dismissable layers also inside the ShadowRoot',
        testCase: 'shadowDomOnly',
      },
      {
        description: 'given a Dialog in the document body, with nested dismissable layers inside a ShadowRoot',
        testCase: 'mixedBodyAndShadowDom',
      },
    ]

    testSuite.forEach(({ description, testCase }) => {
      describe(description, () => {
        let wrapper: VueWrapper<InstanceType<typeof ShadowRootContainer>>
        let shadowHost: HTMLElement
        let shadowRoot: ShadowRoot

        function getDialogOverlay(): HTMLElement | null {
          if (testCase === 'shadowDomOnly') {
            return shadowRoot.querySelector('[data-testid="dialog-overlay"]')
          }
          else {
            return document.body.querySelector('[data-testid="dialog-overlay"]')
          }
        }

        function getDialogTrigger(): HTMLElement | null {
          if (testCase === 'shadowDomOnly') {
            return shadowRoot.querySelector('[data-testid="dialog-trigger"]')
          }
          else {
            return document.body.querySelector('[data-testid="dialog-trigger"]')
          }
        }

        function getDialogContent(): HTMLElement | null {
          if (testCase === 'shadowDomOnly') {
            return shadowRoot.querySelector('[data-testid="dialog-content"]')
          }
          else {
            return document.body.querySelector('[data-testid="dialog-content"]')
          }
        }

        function getQueryRoot(): Document | ShadowRoot {
          if (testCase === 'bodyOnly') {
            return document
          }
          else {
            return shadowRoot
          }
        }

        beforeEach(async () => {
          document.body.innerHTML = ''
          if (testCase === 'shadowDomOnly') {
            wrapper = mount(ShadowRootContainer, { attachTo: document.body, props: { withDialog: true } })
            await nextTick()
            shadowHost = wrapper.find('#shadow-root-container').element as HTMLElement
            shadowRoot = (shadowHost as unknown as { shadowRoot: ShadowRoot }).shadowRoot!
            // Open the dialog
            const trigger = getDialogTrigger() as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogOverlay = getDialogOverlay()
            expect(dialogOverlay).toBeTruthy()
            const dialogContent = getDialogContent()
            expect(dialogContent).toBeTruthy()
          }
          else if (testCase === 'mixedBodyAndShadowDom') {
            wrapper = mount(Dialog, { attachTo: document.body, props: { hasShadowRootInside: true } })
            await nextTick()

            // Open the dialog
            const trigger = getDialogTrigger() as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogOverlay = getDialogOverlay()
            expect(dialogOverlay).toBeTruthy()
            const dialogContent = getDialogContent()
            expect(dialogContent).toBeTruthy()

            shadowHost = dialogContent?.querySelector('#shadow-root-container') as HTMLElement
            shadowRoot = (shadowHost as unknown as { shadowRoot: ShadowRoot }).shadowRoot!
          }
          else {
            wrapper = mount(Dialog, { attachTo: document.body })
            await nextTick()

            // Open the dialog
            const trigger = getDialogTrigger() as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogOverlay = getDialogOverlay()
            expect(dialogOverlay).toBeTruthy()
            const dialogContent = getDialogContent()
            expect(dialogContent).toBeTruthy()
          }
        })

        afterEach(async () => {
          await wrapper.unmount()
          await nextTick()
        })

        if (testCase !== 'bodyOnly') {
          it('shadowRoot should be defined', () => {
            expect(shadowRoot).toBeDefined()
          })
        }

        it('should loop focus within the FocusScope in the ShadowRoot', async () => {
          const queryRoot = getQueryRoot()
          const nameInput = queryRoot.querySelector(`input[name="name"]`) as HTMLElement
          const emailInput = queryRoot.querySelector(`input[name="email"]`) as HTMLElement
          const submitButton = queryRoot.querySelector('button[type="submit"]') as HTMLElement
          const closeDialogButton = testCase === 'shadowDomOnly'
            ? shadowRoot.querySelector('[data-testid="dialog-close"]') as HTMLElement
            : document.querySelector('[data-testid="dialog-close"]') as HTMLElement

          // Focus the first input
          nameInput.focus()
          await waitFor(() => expect(queryRoot.activeElement).toBe(nameInput))

          await userEvent.tab()
          await waitFor(() => expect(queryRoot.activeElement).toBe(emailInput))
          await userEvent.tab()
          await waitFor(() => expect(queryRoot.activeElement).toBe(submitButton))
          await userEvent.tab()
          await waitFor(() => expect(testCase === 'shadowDomOnly' ? shadowRoot.activeElement : document.activeElement).toBe(closeDialogButton))
          // Tab again should loop back to the first focusable element
          await userEvent.tab()
          await waitFor(() => expect(queryRoot.activeElement).toBe(nameInput))

          // Reverse tab should go to the last focusable element
          await userEvent.tab({ shift: true })
          await waitFor(() => expect(testCase === 'shadowDomOnly' ? shadowRoot.activeElement : document.activeElement).toBe(closeDialogButton))
        })

        it('should navigate backward with shift+tab mid-list in the FocusScope', async () => {
          const queryRoot = getQueryRoot()
          const nameInput = queryRoot.querySelector(`input[name="name"]`) as HTMLElement
          const emailInput = queryRoot.querySelector(`input[name="email"]`) as HTMLElement
          const submitButton = queryRoot.querySelector('button[type="submit"]') as HTMLElement

          // Shift+Tab from email → name
          emailInput.focus()
          await waitFor(() => expect(queryRoot.activeElement).toBe(emailInput))
          await userEvent.tab({ shift: true })
          await waitFor(() => expect(queryRoot.activeElement).toBe(nameInput))

          // Shift+Tab from submit → email
          submitButton.focus()
          await waitFor(() => expect(queryRoot.activeElement).toBe(submitButton))
          await userEvent.tab({ shift: true })
          await waitFor(() => expect(queryRoot.activeElement).toBe(emailInput))
        })
      })
    })
  })

  it('should trap focus without looping in shadow DOM when loop=false', async () => {
    function renderInShadowRoot(component: unknown) {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const container = document.createElement('div')
      shadow.appendChild(container)
      const rendered = render(component, { container, baseElement: container })
      return { rendered, host }
    }

    const { rendered, host } = renderInShadowRoot(defineComponent({
      components: { FocusScope },
      template: `
        <FocusScope asChild trapped>
          <div>
            <input name="first" />
            <input name="second" />
            <input name="last" />
          </div>
        </FocusScope>
      `,
    }))

    try {
      await nextTick()
      const shadow = (host as any).shadowRoot as ShadowRoot
      const first = shadow.querySelector('input[name="first"]') as HTMLElement
      const last = shadow.querySelector('input[name="last"]') as HTMLElement

      // Tab from last should not wrap to first
      last.focus()
      await waitFor(() => expect(shadow.activeElement).toBe(last))
      await userEvent.tab()
      await waitFor(() => expect(shadow.activeElement).toBe(last))

      // Shift+Tab from first should not wrap to last
      first.focus()
      await waitFor(() => expect(shadow.activeElement).toBe(first))
      await userEvent.tab({ shift: true })
      await waitFor(() => expect(shadow.activeElement).toBe(first))
    }
    finally {
      rendered.unmount()
      host?.remove()
    }
  })
})
