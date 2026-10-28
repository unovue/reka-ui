import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, hoverCardElements, popoverElements, tooltipElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([tooltipElements, hoverCardElements, popoverElements])
})
afterEach(cleanup)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const CONTENT_STYLE = 'display: block; padding: 4px 8px; background: white; border: 1px solid'

function tooltip(name: string) {
  return `
    <reka-tooltip-root>
      <reka-tooltip-trigger data-test="${name}" style="display: inline-block; margin: 40px">${name}</reka-tooltip-trigger>
      <reka-tooltip-portal>
        <reka-tooltip-content data-test="${name}-content" side-offset="6" style="${CONTENT_STYLE}">
          ${name} tooltip
          <reka-tooltip-arrow data-test="${name}-arrow"></reka-tooltip-arrow>
        </reka-tooltip-content>
      </reka-tooltip-portal>
    </reka-tooltip-root>`
}

const TOOLTIPS = `
  <button id="outside">Outside</button>
  <reka-tooltip-provider delay-duration="200" skip-delay-duration="300">
    ${tooltip('bold')}
    ${tooltip('italic')}
  </reka-tooltip-provider>
`

describe('tooltip elements', () => {
  it('opens on hover after the delay, describes the trigger, and closes on leave', async () => {
    render(TOOLTIPS)
    const trigger = query('[data-test=bold]')
    const content = query('[data-test=bold-content]')
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    const root = trigger.closest('reka-tooltip-root')!
    const opens: unknown[] = []
    root.addEventListener('update-open', event => opens.push((event as CustomEvent).detail.value))

    await userEvent.hover(trigger)
    await wait(100)
    // Still within the provider's `delay-duration`.
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    // Opened by the delay timer.
    expect(content.hasAttribute('data-delayed')).toBe(true)
    expect(opens).toEqual([true])
    expect(trigger.getAttribute('data-state')).toBe('open')

    // The trigger is described by the (visually hidden) tooltip.
    const tip = document.getElementById(trigger.getAttribute('aria-describedby')!)!
    expect(tip.getAttribute('role')).toBe('tooltip')
    expect(tip.textContent!.trim()).toBe('bold tooltip')
    expect(query('reka-tooltip-portal').contains(tip)).toBe(true)
    await vi.waitFor(() => {
      expect(Math.round(trigger.getBoundingClientRect().top - content.getBoundingClientRect().bottom)).toBe(6 + 5)
    })

    await userEvent.hover(query('#outside'))
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(opens).toEqual([true, false])
    expect(trigger.hasAttribute('aria-describedby')).toBe(false)
  })

  it('groups delays through the provider: a neighbour opens at once, then the delay comes back', async () => {
    render(TOOLTIPS)
    const bold = query('[data-test=bold]')
    const italic = query('[data-test=italic]')
    const italicContent = query('[data-test=italic-content]')
    await vi.waitFor(() => expect(italic.getAttribute('data-state')).toBe('closed'))

    await userEvent.hover(bold)
    await vi.waitFor(() => expect(query('[data-test=bold-content]').hasAttribute('data-delayed')).toBe(true))
    // Leaving, then hovering the next trigger within `skip-delay-duration`: no delay.
    await userEvent.hover(query('#outside'))
    await userEvent.hover(italic)
    await vi.waitFor(() => expect(italicContent.getAttribute('data-state')).toBe('open'))
    expect(italicContent.hasAttribute('data-delayed')).toBe(false)
    await vi.waitFor(() => expect(query('[data-test=bold-content]').hasAttribute('data-reka-unmounted')).toBe(true))

    // Away for longer than `skip-delay-duration`: the delay applies again.
    await userEvent.hover(query('#outside'))
    await vi.waitFor(() => expect(italicContent.hasAttribute('data-reka-unmounted')).toBe(true))
    await wait(400)
    await userEvent.hover(bold)
    await wait(100)
    expect(query('[data-test=bold-content]').hasAttribute('data-reka-unmounted')).toBe(true)
    await vi.waitFor(() => expect(query('[data-test=bold-content]').hasAttribute('data-delayed')).toBe(true))
  })

  it('opens instantly on keyboard focus and closes on Escape', async () => {
    render(TOOLTIPS)
    const trigger = query('[data-test=bold]')
    const content = query('[data-test=bold-content]')
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    query('#outside').focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(trigger)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(content.hasAttribute('data-delayed')).toBe(false)
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(document.activeElement).toBe(trigger)
  })

  it('renders its arrow as an SVG, pointing at the trigger', async () => {
    render(TOOLTIPS)
    const trigger = query('[data-test=bold]')
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    trigger.focus()
    const arrow = query('[data-test=bold-arrow]')
    await vi.waitFor(() => expect(arrow.querySelector('svg')).not.toBeNull())
    const svg = arrow.querySelector('svg')!
    await vi.waitFor(() => {
      const box = svg.getBoundingClientRect()
      const triggerBox = trigger.getBoundingClientRect()
      // Centred over the trigger, just above it.
      expect(Math.abs(box.left + box.width / 2 - (triggerBox.left + triggerBox.width / 2))).toBeLessThan(1)
      expect(Math.round(triggerBox.top - box.bottom)).toBe(6)
    })
  })
})

const HOVER_CARD = `
  <button id="outside">Outside</button>
  <reka-hover-card-root open-delay="100" close-delay="100">
    <reka-hover-card-trigger href="#profile" style="display: inline-block; margin: 40px">@reka</reka-hover-card-trigger>
    <reka-hover-card-portal>
      <reka-hover-card-content side-offset="4" style="${CONTENT_STYLE}">
        <a id="link" href="#follow">Follow</a>
        <reka-hover-card-arrow></reka-hover-card-arrow>
      </reka-hover-card-content>
    </reka-hover-card-portal>
  </reka-hover-card-root>
`

describe('hover card elements', () => {
  it('opens on hover after its delay, stays open over the content, and closes after leaving', async () => {
    render(HOVER_CARD)
    const trigger = query('reka-hover-card-trigger')
    const content = query('reka-hover-card-content')
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    const opens: unknown[] = []
    query('reka-hover-card-root').addEventListener('update-open', event => opens.push((event as CustomEvent).detail.value))

    await userEvent.hover(trigger)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(opens).toEqual([true])
    await vi.waitFor(() => expect(content.getBoundingClientRect().top).toBeGreaterThan(trigger.getBoundingClientRect().bottom))
    expect(query('reka-hover-card-arrow').querySelector('svg')).not.toBeNull()

    // Moving onto the content keeps it open.
    await userEvent.hover(query('#link'))
    await wait(250)
    expect(content.getAttribute('data-state')).toBe('open')

    await userEvent.hover(query('#outside'))
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(opens).toEqual([true, false])
  })

  it('opens on keyboard focus of the trigger', async () => {
    render(HOVER_CARD)
    const trigger = query('reka-hover-card-trigger')
    const content = query('reka-hover-card-content')
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    // The trigger renders as a link by default: give it a tab stop, as an `<a href>` has.
    trigger.tabIndex = 0
    query('#outside').focus()
    await userEvent.keyboard('{Tab}')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(content.getAttribute('data-state')).toBe('open')
  })
})

describe('popover arrow element', () => {
  const POPOVER = `
    <reka-popover-root>
      <reka-popover-trigger style="display: inline-block; margin: 40px">Settings</reka-popover-trigger>
      <reka-popover-portal>
        <reka-popover-content side="right" side-offset="8" style="${CONTENT_STYLE}; width: 120px; height: 80px">
          <reka-popover-arrow class="arrow" width="20" height="10" rounded style="fill: rgb(255, 0, 0)"></reka-popover-arrow>
        </reka-popover-content>
      </reka-popover-portal>
    </reka-popover-root>
  `

  it('renders the SVG inside the element, sized by its props and styled through it', async () => {
    render(POPOVER)
    const trigger = query('reka-popover-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    await userEvent.click(trigger)
    const arrow = query('reka-popover-arrow')
    await vi.waitFor(() => expect(arrow.querySelector('svg')).not.toBeNull())
    const svg = arrow.querySelector('svg')!
    // An SVG element, not an HTML one with an `svg` tag name.
    expect(svg).toBeInstanceOf(SVGSVGElement)
    expect(svg.getAttribute('width')).toBe('20')
    expect(svg.getAttribute('height')).toBe('10')
    expect(svg.getAttribute('viewBox')).toBe('0 0 12 6')
    // `rounded`: the curved path.
    expect(svg.querySelector('path')!.getAttribute('d')).toContain('C')
    // `fill` inherits from the element; the consumer's class and style stay on it.
    expect(getComputedStyle(svg.querySelector('path')!).fill).toBe('rgb(255, 0, 0)')
    expect(arrow.className).toBe('arrow')
    // Pointing left, at the trigger (rotated for the `right` side).
    const content = query('reka-popover-content')
    await vi.waitFor(() => {
      const box = svg.getBoundingClientRect()
      expect(Math.round(box.right)).toBe(Math.round(content.getBoundingClientRect().left))
    })

    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    // The rendered SVG goes with the part.
    expect(arrow.children.length).toBe(0)
  })

  it('keeps the consumer\'s own children, and re-renders when its props change', async () => {
    render(POPOVER.replace('rounded ', '').replace('></reka-popover-arrow>', '><span id="mine"></span></reka-popover-arrow>'))
    const trigger = query('reka-popover-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    await userEvent.click(trigger)
    const arrow = query<HTMLElement & { width: number }>('reka-popover-arrow')
    await vi.waitFor(() => expect(arrow.querySelector('svg')).not.toBeNull())
    expect(arrow.querySelector('#mine')).not.toBeNull()
    arrow.width = 30
    await vi.waitFor(() => expect(arrow.querySelector('svg')!.getAttribute('width')).toBe('30'))
    expect(arrow.querySelectorAll('svg').length).toBe(1)
  })
})
