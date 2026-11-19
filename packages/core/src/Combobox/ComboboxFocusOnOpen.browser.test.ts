import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, watch } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

let wrapper: VueWrapper | undefined
const open = ref(false)
const focusOnOpen = ref<boolean | undefined>()

function mountCombobox(options: { unmountOnHide: boolean, focusOnOpen?: boolean }) {
  document.body.innerHTML = ''
  open.value = false
  focusOnOpen.value = options.focusOnOpen
  // A child component reads `focusOnOpen`, so changing it re-renders the input after the content updates.
  const Input = defineComponent({
    setup: () => () => h(ComboboxInput, {
      'data-testid': 'input',
      ...(focusOnOpen.value === undefined ? {} : { focusOnOpen: focusOnOpen.value }),
    }),
  })
  const Fixture = defineComponent({
    setup: () => () => h('div', [
      h('button', { 'data-testid': 'outside', 'onClick': () => open.value = true }, 'Outside'),
      h(ComboboxRoot, {
        'unmountOnHide': options.unmountOnHide,
        'open': open.value,
        'onUpdate:open': (value: boolean) => open.value = value,
      }, () => [
        h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        h(ComboboxPortal, null, () => h(ComboboxContent, null, () => [
          h(Input),
          h(ComboboxViewport, null, () => ['Apple', 'Banana', 'Cherry'].map(value =>
            h(ComboboxItem, { 'value': value, 'data-testid': value }, () => value))),
        ])),
      ]),
    ]),
  })
  wrapper = mount(Fixture, { attachTo: document.body })
}

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
const activeTestId = () => document.activeElement?.getAttribute('data-testid')
const highlighted = () => document.querySelector('[role="option"][data-highlighted]')?.getAttribute('data-testid')
const isOpen = () => byTestId('trigger').getAttribute('aria-expanded') === 'true'

// Gives every focus path (root nextTick, content mount and the kept-mounted present watcher) time to run.
async function settle() {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)))
}

describe('given a Combobox with its input inside content and focusOnOpen', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it.each([true, false])('focuses the input on open by default (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox({ unmountOnHide })

    await userEvent.click(byTestId('trigger'))
    await expect.poll(activeTestId).toBe('input')

    await userEvent.keyboard('{Escape}')
    await expect.poll(activeTestId).toBe('trigger')

    await userEvent.click(byTestId('outside'))
    await expect.poll(activeTestId).toBe('input')
  })

  it.each([true, false])('keeps focus on the trigger when opened by it (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox({ unmountOnHide, focusOnOpen: false })

    await userEvent.click(byTestId('trigger'))
    await expect.poll(isOpen).toBe(true)
    await settle()
    expect(activeTestId()).toBe('trigger')

    await userEvent.keyboard('{Escape}')
    await expect.poll(isOpen).toBe(false)
    expect(activeTestId()).toBe('trigger')

    // Reopening kept-mounted content must not focus the input either.
    await userEvent.click(byTestId('trigger'))
    await expect.poll(isOpen).toBe(true)
    await settle()
    expect(activeTestId()).toBe('trigger')
  })

  it.each([true, false])('keeps focus on the opener when opened through the open prop (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox({ unmountOnHide, focusOnOpen: false })

    await userEvent.click(byTestId('outside'))
    await expect.poll(isOpen).toBe(true)
    await settle()
    expect(activeTestId()).toBe('outside')

    await userEvent.keyboard('{Escape}')
    await expect.poll(isOpen).toBe(false)
    expect(activeTestId()).toBe('outside')
  })

  it.each([true, false])('keeps focus on the trigger when opened from the keyboard (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox({ unmountOnHide, focusOnOpen: false })

    byTestId('trigger').focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(isOpen).toBe(true)
    await settle()
    expect(activeTestId()).toBe('trigger')
  })

  it.each([true, false])('lets the arrow keys reach the list and typing filter it (unmountOnHide: %s)', async (unmountOnHide) => {
    mountCombobox({ unmountOnHide, focusOnOpen: false })

    await userEvent.click(byTestId('trigger'))
    await expect.poll(isOpen).toBe(true)
    await settle()
    expect(activeTestId()).toBe('trigger')

    // ArrowDown on the trigger moves focus to the input, then the arrows navigate from there.
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('input')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(highlighted).toBe('Apple')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(highlighted).toBe('Banana')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(highlighted).toBe('Apple')

    await userEvent.keyboard('ch')
    await expect.poll(() => (byTestId('input') as HTMLInputElement).value).toBe('ch')
    await expect.poll(highlighted).toBe('Cherry')

    await userEvent.keyboard('{Escape}')
    await expect.poll(isOpen).toBe(false)
    await expect.poll(activeTestId).toBe('trigger')
  })

  it('does not focus kept-mounted content when focusOnOpen turns false in the same update as open', async () => {
    mountCombobox({ unmountOnHide: false, focusOnOpen: true })

    // Open and close once so the content is mounted and kept hidden.
    await userEvent.click(byTestId('trigger'))
    await expect.poll(activeTestId).toBe('input')
    await userEvent.keyboard('{Escape}')
    await expect.poll(isOpen).toBe(false)

    // Turn focusOnOpen off in the same update that shows the kept-mounted content: Presence shows
    // it a tick after `open` changes, so the input's new prop arrives after the content's watcher ran.
    const stop = watch(open, async (value) => {
      await nextTick()
      if (value)
        focusOnOpen.value = false
    })
    byTestId('outside').focus()
    open.value = true
    await expect.poll(isOpen).toBe(true)
    stop()
    await settle()
    expect(activeTestId()).toBe('outside')
  })

  it('navigates and selects once the user clicks the input', async () => {
    mountCombobox({ unmountOnHide: true, focusOnOpen: false })

    await userEvent.click(byTestId('trigger'))
    await expect.poll(isOpen).toBe(true)
    await settle()

    await userEvent.click(byTestId('input'))
    expect(activeTestId()).toBe('input')
    expect(isOpen()).toBe(true)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect.poll(highlighted).toBe('Banana')
    await userEvent.keyboard('{Enter}')
    await expect.poll(isOpen).toBe(false)
  })
})
