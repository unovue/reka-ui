import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { accordionElements, collapsibleElements, defineRekaElements, tabsElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([tabsElements, accordionElements, collapsibleElements])
})
afterEach(cleanup)

const TABS = `
  <reka-tabs-root default-value="one">
    <reka-tabs-list aria-label="Settings">
      <reka-tabs-trigger value="one">One</reka-tabs-trigger>
      <reka-tabs-trigger value="two">Two</reka-tabs-trigger>
      <reka-tabs-trigger value="three" disabled>Three</reka-tabs-trigger>
    </reka-tabs-list>
    <reka-tabs-content value="one">Panel one</reka-tabs-content>
    <reka-tabs-content value="two">Panel two</reka-tabs-content>
    <reka-tabs-content value="three">Panel three</reka-tabs-content>
  </reka-tabs-root>
`

describe('tabs elements', () => {
  it('moves focus with the arrow keys and activates the focused tab', async () => {
    render(TABS)
    const [one, two] = document.querySelectorAll<HTMLElement>('reka-tabs-trigger')
    const [panelOne, panelTwo] = document.querySelectorAll<HTMLElement>('reka-tabs-content')
    await vi.waitFor(() => expect(one.getAttribute('aria-selected')).toBe('true'))
    expect(panelOne.getAttribute('role')).toBe('tabpanel')
    expect(panelOne.getAttribute('aria-labelledby')).toBe(one.id)
    expect(one.getAttribute('aria-controls')).toBe(panelOne.id)
    expect(panelTwo.hasAttribute('data-reka-unmounted')).toBe(true)

    await userEvent.click(one)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(two)
    await vi.waitFor(() => expect(two.getAttribute('aria-selected')).toBe('true'))
    expect(panelTwo.getAttribute('data-state')).toBe('checked')
    expect(panelOne.hasAttribute('data-reka-unmounted')).toBe(true)

    // The disabled tab is skipped and focus loops back to the first.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(one)
  })

  it('in manual mode, activates on Enter only', async () => {
    render(TABS.replace('default-value="one"', 'default-value="one" activation-mode="manual"'))
    const [one, two] = document.querySelectorAll<HTMLElement>('reka-tabs-trigger')
    await vi.waitFor(() => expect(one.getAttribute('aria-selected')).toBe('true'))
    const onUpdate = vi.fn()
    query('reka-tabs-root').addEventListener('update-model-value', event => onUpdate((event as RekaElementEvent).detail.value))

    await userEvent.click(one)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('aria-selected')).toBe('false')
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(two.getAttribute('aria-selected')).toBe('true'))
    expect(onUpdate).toHaveBeenCalledWith('two')
  })
})

describe('accordion elements', () => {
  const ACCORDION = `
    <reka-accordion-root type="single" collapsible>
      <reka-accordion-item value="a">
        <reka-accordion-header><reka-accordion-trigger>First</reka-accordion-trigger></reka-accordion-header>
        <reka-accordion-content>First panel</reka-accordion-content>
      </reka-accordion-item>
      <reka-accordion-item value="b">
        <reka-accordion-header><reka-accordion-trigger>Second</reka-accordion-trigger></reka-accordion-header>
        <reka-accordion-content>Second panel</reka-accordion-content>
      </reka-accordion-item>
    </reka-accordion-root>
  `

  it('exposes headings and buttons, and opens one item at a time', async () => {
    render(ACCORDION)
    const [first, second] = document.querySelectorAll<HTMLElement>('reka-accordion-trigger')
    const [firstPanel, secondPanel] = document.querySelectorAll<HTMLElement>('reka-accordion-content')
    await vi.waitFor(() => expect(first.getAttribute('aria-expanded')).toBe('false'))
    const header = query('reka-accordion-header')
    expect(header.getAttribute('role')).toBe('heading')
    expect(header.getAttribute('aria-level')).toBe('3')
    expect(first.getAttribute('role')).toBe('button')

    await userEvent.click(first)
    await vi.waitFor(() => expect(firstPanel.getAttribute('data-state')).toBe('open'))
    expect(firstPanel.getAttribute('role')).toBe('region')
    expect(firstPanel.getAttribute('aria-labelledby')).toBe(first.id)

    await userEvent.click(second)
    await vi.waitFor(() => expect(secondPanel.getAttribute('data-state')).toBe('open'))
    expect(firstPanel.hasAttribute('data-reka-unmounted')).toBe(true)
  })

  it('moves focus between triggers with the arrow keys and toggles with Enter / Space', async () => {
    render(ACCORDION)
    const [first, second] = document.querySelectorAll<HTMLElement>('reka-accordion-trigger')
    await vi.waitFor(() => expect(first.getAttribute('aria-expanded')).toBe('false'))
    first.focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(second)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(second.getAttribute('aria-expanded')).toBe('true'))
    await userEvent.keyboard(' ')
    await vi.waitFor(() => expect(second.getAttribute('aria-expanded')).toBe('false'))
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(first)
  })

  it('takes an array model as a property in `multiple` mode', async () => {
    render(ACCORDION.replace('type="single" collapsible', 'type="multiple"'))
    const root = query<HTMLElement & { modelValue?: string[] }>('reka-accordion-root')
    const [first, second] = document.querySelectorAll<HTMLElement>('reka-accordion-trigger')
    await vi.waitFor(() => expect(first.getAttribute('aria-expanded')).toBe('false'))

    root.modelValue = ['a', 'b']
    await vi.waitFor(() => expect(second.getAttribute('aria-expanded')).toBe('true'))
    expect(first.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('collapsible elements', () => {
  it('dispatches `update-open` and can be controlled with the `open` property', async () => {
    render(`
      <reka-collapsible-root>
        <reka-collapsible-trigger>Details</reka-collapsible-trigger>
        <reka-collapsible-content>Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    const root = query<HTMLElement & { open?: boolean }>('reka-collapsible-root')
    const trigger = query('reka-collapsible-trigger')
    const content = query('reka-collapsible-content')
    // `open` is an HTML boolean attribute (present means open): a controlled
    // closed state is set as a property.
    root.open = false
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    const onUpdate = vi.fn()
    root.addEventListener('update-open', onUpdate)
    await userEvent.click(trigger)
    // Controlled: nothing changes until the consumer applies the value.
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)

    root.addEventListener('update-open', (event) => {
      root.open = (event as RekaElementEvent<boolean>).detail.value
    })

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(root.getAttribute('data-state')).toBe('open')

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps the content closed when `before-update-open` is prevented', async () => {
    render(`
      <reka-collapsible-root>
        <reka-collapsible-trigger>Details</reka-collapsible-trigger>
        <reka-collapsible-content>Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    const root = query('reka-collapsible-root')
    const trigger = query('reka-collapsible-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    root.addEventListener('before-update-open', event => event.preventDefault())

    await userEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(query('reka-collapsible-content').hasAttribute('data-reka-unmounted')).toBe(true)
  })
})
