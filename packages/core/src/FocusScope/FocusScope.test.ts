import type { RenderResult } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { FocusScope } from '.'

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
    let tabbableFirst: HTMLInputElement
    let tabbableSecond: HTMLInputElement
    let tabbableLast: HTMLButtonElement

    beforeEach(() => {
      rendered = render(defineComponent({
        components: { TestField, FocusScope },
        template: `<div>
        <FocusScope asChild loop trapped>
          <form>
            <TestField label=${INNER_NAME_INPUT_LABEL} />
            <TestField label=${INNER_EMAIL_INPUT_LABEL} />
            <button>${INNER_SUBMIT_LABEL}</button>
          </form>
        </FocusScope>
        <TestField label="other" />
        <button>some outer button</button>
      </div>`,
      }))
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
      waitFor(() => expect(tabbableLast).toBe(document.activeElement))
    })

    it('should focus the first element in scope on tab from the last element in scope', async () => {
      tabbableLast.focus()
      await userEvent.tab()
      expect(tabbableFirst).toBe(document.activeElement)
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
      expect(tabbableSecond).toBe(document.activeElement)
    })

    it('should skip the element with a negative tabindex on shift+tab', async () => {
      tabbableSecond.focus()
      await userEvent.tab({ shift: true })
      waitFor(() => expect(tabbableLast).toBe(document.activeElement))
    })
  })

  describe('given a FocusScope with internal focus handlers', () => {
    const handleLastFocusableElementBlur = vi.fn()
    let rendered: RenderResult
    let tabbableFirst: HTMLInputElement
    beforeEach(() => {
      rendered = render(defineComponent({
        components: { TestField, FocusScope },
        props: { handleLastFocusableElementBlur },
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
      waitFor(() => expect(handleLastFocusableElementBlur).toHaveBeenCalledTimes(1))
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
})
