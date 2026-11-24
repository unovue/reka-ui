import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

let wrapper: VueWrapper | undefined

function mountCombobox(unmountOnHide: boolean) {
  document.body.innerHTML = ''
  const Fixture = defineComponent({
    setup: () => () => h(ComboboxRoot, { unmountOnHide }, () => [
      h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
      h(ComboboxPortal, null, () => h(ComboboxContent, null, () => [
        h(ComboboxInput, { 'data-testid': 'input' }),
        h(ComboboxViewport, null, () => h(ComboboxItem, { value: 'Apple' }, () => 'Apple')),
      ])),
    ]),
  })
  wrapper = mount(Fixture, { attachTo: document.body })
}

const trigger = () => document.querySelector<HTMLElement>('[data-testid="trigger"]')!
const activeTestId = () => document.activeElement?.getAttribute('data-testid')

describe('given a Combobox with its input inside content', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it.each([true, false])('focuses the input on open and the trigger on close (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox(unmountOnHide)

    await userEvent.click(trigger())
    await expect.poll(activeTestId).toBe('input')

    await userEvent.keyboard('{Escape}')
    await expect.poll(activeTestId).toBe('trigger')

    // Reopening a kept-mounted content must focus its input again.
    await userEvent.click(trigger())
    await expect.poll(activeTestId).toBe('input')
  })
})
