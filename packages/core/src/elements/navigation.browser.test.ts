import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, paginationElements, stepperElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([paginationElements, stepperElements])
})
afterEach(cleanup)

function events(el: Element, type: string) {
  const seen: { value: unknown, reason: unknown }[] = []
  el.addEventListener(type, (event) => {
    const { value, details } = (event as RekaElementEvent<unknown, { reason?: unknown }>).detail
    seen.push({ value, reason: details?.reason })
  })
  return seen
}

describe('pagination elements', () => {
  // No scoped slot: the page items are written out (or rendered from `update-page`).
  const PAGINATION = `
    <reka-pagination-root total="50" items-per-page="10" default-page="2">
      <reka-pagination-list>
        <reka-pagination-first>«</reka-pagination-first>
        <reka-pagination-prev>‹</reka-pagination-prev>
        <reka-pagination-list-item value="1">1</reka-pagination-list-item>
        <reka-pagination-list-item value="2">2</reka-pagination-list-item>
        <reka-pagination-list-item value="3">3</reka-pagination-list-item>
        <reka-pagination-ellipsis>…</reka-pagination-ellipsis>
        <reka-pagination-list-item value="5">5</reka-pagination-list-item>
        <reka-pagination-next>›</reka-pagination-next>
        <reka-pagination-last>»</reka-pagination-last>
      </reka-pagination-list>
    </reka-pagination-root>
  `

  it('is a navigation landmark with button pages, and moves between pages', async () => {
    render(PAGINATION)
    const root = query('reka-pagination-root')
    const [one, two, three] = document.querySelectorAll<HTMLElement>('reka-pagination-list-item')
    const next = query('reka-pagination-next')
    const last = query('reka-pagination-last')
    await vi.waitFor(() => expect(two.getAttribute('aria-current')).toBe('page'))
    expect(root.getAttribute('role')).toBe('navigation')
    expect(two.getAttribute('role')).toBe('button')
    expect(two.getAttribute('data-selected')).toBe('true')
    expect(one.hasAttribute('aria-current')).toBe(false)
    expect(query('reka-pagination-ellipsis').getAttribute('data-type')).toBe('ellipsis')
    const changes = events(root, 'update-page')

    await userEvent.click(three)
    await vi.waitFor(() => expect(three.getAttribute('aria-current')).toBe('page'))
    // Buttons activate with the keyboard, like native ones.
    next.focus()
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(query('reka-pagination-list-item[value="3"]').hasAttribute('aria-current')).toBe(false))
    await userEvent.click(last)
    await vi.waitFor(() => expect(query('reka-pagination-list-item[value="5"]').getAttribute('aria-current')).toBe('page'))
    // On the last page, next and last are disabled.
    expect(next.getAttribute('aria-disabled')).toBe('true')
    expect(last.getAttribute('aria-disabled')).toBe('true')
    expect(changes.map(change => change.value)).toEqual([3, 4, 5])
  })

  it('can be controlled with the `page` property, and cancelled through `before-update-page`', async () => {
    render(PAGINATION)
    const root = query<HTMLElement & { page?: number }>('reka-pagination-root')
    const [one, two] = document.querySelectorAll<HTMLElement>('reka-pagination-list-item')
    await vi.waitFor(() => expect(two.getAttribute('aria-current')).toBe('page'))

    root.page = 1
    await vi.waitFor(() => expect(one.getAttribute('aria-current')).toBe('page'))
    expect(query('reka-pagination-prev').getAttribute('aria-disabled')).toBe('true')

    root.page = undefined
    root.addEventListener('before-update-page', event => event.preventDefault())
    await userEvent.click(query('reka-pagination-list-item[value="3"]'))
    expect(query('reka-pagination-list-item[value="3"]').hasAttribute('aria-current')).toBe(false)
  })
})

describe('stepper elements', () => {
  const STEPPER = `
    <reka-stepper-root default-value="1" aria-label="Checkout">
      <reka-stepper-item step="1">
        <reka-stepper-trigger>
          <reka-stepper-indicator>1</reka-stepper-indicator>
          <reka-stepper-title>Address</reka-stepper-title>
        </reka-stepper-trigger>
        <reka-stepper-description>Where to ship</reka-stepper-description>
        <reka-stepper-separator></reka-stepper-separator>
      </reka-stepper-item>
      <reka-stepper-item step="2">
        <reka-stepper-trigger>
          <reka-stepper-indicator>2</reka-stepper-indicator>
          <reka-stepper-title>Payment</reka-stepper-title>
        </reka-stepper-trigger>
        <reka-stepper-description>How to pay</reka-stepper-description>
        <reka-stepper-separator></reka-stepper-separator>
      </reka-stepper-item>
      <reka-stepper-item step="3">
        <reka-stepper-trigger>
          <reka-stepper-indicator>3</reka-stepper-indicator>
          <reka-stepper-title>Review</reka-stepper-title>
        </reka-stepper-trigger>
      </reka-stepper-item>
    </reka-stepper-root>
  `

  it('wires titles and descriptions to the triggers, and announces the step', async () => {
    render(STEPPER)
    const root = query('reka-stepper-root')
    const [first, second] = document.querySelectorAll<HTMLElement>('reka-stepper-trigger')
    const [firstItem, secondItem, thirdItem] = document.querySelectorAll<HTMLElement>('reka-stepper-item')
    const [title] = document.querySelectorAll<HTMLElement>('reka-stepper-title')
    const [description] = document.querySelectorAll<HTMLElement>('reka-stepper-description')
    await vi.waitFor(() => expect(firstItem.getAttribute('aria-current')).toBe('true'))
    expect(root.getAttribute('role')).toBe('group')
    expect(first.getAttribute('role')).toBe('button')
    expect(first.getAttribute('aria-labelledby')).toBe(title.id)
    expect(first.getAttribute('aria-describedby')).toBe(description.id)
    expect(title.getAttribute('role')).toBe('heading')
    expect(title.getAttribute('aria-level')).toBe('4')
    expect(firstItem.getAttribute('data-state')).toBe('current')
    // Linear: only the next step can be reached.
    expect(query('reka-stepper-item[step="3"] reka-stepper-trigger').getAttribute('aria-disabled')).toBe('true')
    expect(thirdItem.hasAttribute('data-disabled')).toBe(true)
    expect(query('reka-stepper-separator').getAttribute('role')).toBe('none')
    // The live region the Vue component renders next to its content.
    const status = root.querySelector(':scope > [role="status"]')!
    expect(status.textContent!.trim()).toBe('Step 1 of 3')
    expect(second.getAttribute('data-state')).toBe('upcoming')

    const changes = events(root, 'update-model-value')
    await userEvent.click(second)
    await vi.waitFor(() => expect(secondItem.getAttribute('aria-current')).toBe('true'))
    expect(first.getAttribute('data-state')).toBe('completed')
    await vi.waitFor(() => expect(status.textContent!.trim()).toBe('Step 2 of 3'))
    expect(changes).toEqual([{ value: 2, reason: 'trigger-press' }])

    // It goes away with the part.
    root.remove()
    await vi.waitFor(() => expect(root.querySelector('[role="status"]')).toBeNull())
  })

  it('moves focus between triggers with the arrow keys', async () => {
    render(STEPPER.replace('default-value="1"', 'default-value="2"'))
    const [first, second, third] = document.querySelectorAll<HTMLElement>('reka-stepper-trigger')
    const items = document.querySelectorAll<HTMLElement>('reka-stepper-item')
    await vi.waitFor(() => expect(items[1].getAttribute('aria-current')).toBe('true'))
    second.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(third)
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(items[2].getAttribute('aria-current')).toBe('true'))
    await userEvent.keyboard('{ArrowLeft}')
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(first)
  })

  it('a `cloneNode()` copy has one live region', async () => {
    const container = render(`
      <reka-stepper-root default-value="1">
        <reka-stepper-item step="1"><reka-stepper-trigger>1</reka-stepper-trigger></reka-stepper-item>
        <reka-stepper-item step="2"><reka-stepper-trigger>2</reka-stepper-trigger></reka-stepper-item>
      </reka-stepper-root>`)
    const root = query('reka-stepper-root')
    await vi.waitFor(() => expect(root.querySelector(':scope > [role=status]')).not.toBeNull())
    const clone = root.cloneNode(true) as HTMLElement
    container.append(clone)
    await vi.waitFor(() => expect(clone.hasAttribute('data-reka-unmounted')).toBe(false))
    await settle()
    expect(clone.querySelectorAll(':scope > [role=status]')).toHaveLength(1)
  })
})
