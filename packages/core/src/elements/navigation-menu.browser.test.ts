import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, navigationMenuElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([navigationMenuElements])
})
afterEach(cleanup)

const NAV = `
  <style>
    reka-navigation-menu-list { display: flex; gap: 16px; list-style: none; margin: 0; padding: 0 }
    reka-navigation-menu-item, reka-navigation-menu-content, reka-navigation-menu-viewport { display: block }
    reka-navigation-menu-viewport { position: relative; height: var(--reka-navigation-menu-viewport-height) }
    reka-navigation-menu-indicator { display: block; height: 4px; background: black }
  </style>
  <button id="before">Before</button>
  <reka-navigation-menu-root delay-duration="0">
    <reka-navigation-menu-list>
      <reka-navigation-menu-item value="learn">
        <reka-navigation-menu-trigger data-test="learn">Learn</reka-navigation-menu-trigger>
        <reka-navigation-menu-content>
          <a href="#stitches" id="stitches">Stitches</a>
          <a href="#colors" id="colors">Colors</a>
        </reka-navigation-menu-content>
      </reka-navigation-menu-item>
      <reka-navigation-menu-item value="overview">
        <reka-navigation-menu-trigger data-test="overview">Overview</reka-navigation-menu-trigger>
        <reka-navigation-menu-content>
          <a href="#intro" id="intro">Introduction</a>
        </reka-navigation-menu-content>
      </reka-navigation-menu-item>
      <reka-navigation-menu-item>
        <reka-navigation-menu-link href="#github" data-test="github">GitHub</reka-navigation-menu-link>
      </reka-navigation-menu-item>
      <reka-navigation-menu-indicator></reka-navigation-menu-indicator>
    </reka-navigation-menu-list>
    <reka-navigation-menu-viewport></reka-navigation-menu-viewport>
  </reka-navigation-menu-root>
  <button id="after">After</button>
`

async function ready() {
  render(NAV)
  const learn = query('[data-test=learn]')
  await vi.waitFor(() => expect(learn.getAttribute('aria-expanded')).toBe('false'))
  return { learn, overview: query('[data-test=overview]'), root: query('reka-navigation-menu-root') }
}

describe('navigation menu elements', () => {
  it('renders a navigation landmark with a list of items', async () => {
    const { root, learn } = await ready()
    expect(root.getAttribute('role')).toBe('navigation')
    expect(query('reka-navigation-menu-list').getAttribute('role')).toBe('list')
    expect(query('reka-navigation-menu-item').getAttribute('role')).toBe('listitem')
    expect(learn.getAttribute('role')).toBe('button')
    // A link part with an \`href\` stands in for an \`<a href>\`.
    expect(query('[data-test=github]').getAttribute('role')).toBe('link')
    expect(query('[data-test=github]').getAttribute('tabindex')).toBe('0')
    // Only while it has one.
    const link = query('[data-test=github]')
    link.removeAttribute('href')
    await vi.waitFor(() => expect(link.hasAttribute('role')).toBe(false))
    expect(link.hasAttribute('tabindex')).toBe(false)
    link.setAttribute('href', '#github')
    await vi.waitFor(() => expect(link.getAttribute('role')).toBe('link'))
    expect(link.getAttribute('tabindex')).toBe('0')
    // Contents are closed and not rendered.
    expect(query('reka-navigation-menu-content').hasAttribute('data-reka-unmounted')).toBe(true)
  })

  it('opens a content into the viewport on click, with its events and ARIA', async () => {
    const { root, learn, overview } = await ready()
    const values: unknown[] = []
    root.addEventListener('update-model-value', event => values.push((event as CustomEvent).detail.value))

    await userEvent.click(learn)
    const content = query('#stitches').closest<HTMLElement>('reka-navigation-menu-content')!
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(values).toEqual(['learn'])
    expect(learn.getAttribute('aria-expanded')).toBe('true')
    expect(learn.getAttribute('aria-controls')).toBe(content.id)
    expect(content.getAttribute('aria-labelledby')).toBe(learn.id)
    // The content moved into the viewport, which takes its size.
    const viewport = query('reka-navigation-menu-viewport')
    expect(viewport.contains(content)).toBe(true)
    expect(viewport.getAttribute('data-state')).toBe('open')
    await vi.waitFor(() => expect(viewport.getBoundingClientRect().height).toBeGreaterThan(0))
    // The indicator follows the active trigger.
    const indicator = query('reka-navigation-menu-indicator')
    await vi.waitFor(() => expect(indicator.getAttribute('data-state')).toBe('open'))

    // Another trigger switches the content.
    await userEvent.click(overview)
    await vi.waitFor(() => expect(values).toEqual(['learn', 'overview']))
    const second = query('#intro').closest<HTMLElement>('reka-navigation-menu-content')!
    await vi.waitFor(() => expect(second.getAttribute('data-state')).toBe('open'))
    expect(second.getAttribute('data-motion')).toBe('from-end')

    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(values).toEqual(['learn', 'overview', '']))
    await vi.waitFor(() => expect(viewport.hasAttribute('data-reka-unmounted')).toBe(true))
    // Closed contents are back in their items.
    await vi.waitFor(() => expect(overview.parentElement!.contains(second)).toBe(true))
    expect(learn.parentElement!.contains(content)).toBe(true)
  })

  it('opens on hover', async () => {
    const { learn } = await ready()
    await userEvent.hover(learn)
    await vi.waitFor(() => expect(learn.getAttribute('data-state')).toBe('open'))
    await userEvent.hover(query('#after'))
    await vi.waitFor(() => expect(learn.getAttribute('data-state')).toBe('closed'))
  })

  it('moves between triggers and links with the arrow keys, and tabs into an open content', async () => {
    const { learn, overview } = await ready()
    query('#before').focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(learn)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(overview)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(query('[data-test=github]'))
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(learn)

    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(learn.getAttribute('data-state')).toBe('open'))
    // ArrowDown moves into the open content.
    await userEvent.keyboard('{ArrowDown}')
    await vi.waitFor(() => expect(document.activeElement).toBe(query('#stitches')))
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(query('#colors'))

    // Escape closes and returns to the trigger.
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(learn.getAttribute('data-state')).toBe('closed'))
    expect(document.activeElement).toBe(learn)
  })

  it('tabs from an open trigger into its content in the viewport, through the focus proxy next to the trigger', async () => {
    const warn = vi.spyOn(console, 'warn')
    const { learn } = await ready()
    learn.focus()
    await userEvent.keyboard('{Enter}')
    const content = query('#stitches').closest<HTMLElement>('reka-navigation-menu-content')!
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    // Rendered right after the trigger, in the document.
    const owns = learn.parentElement!.querySelector('[aria-owns]')!
    expect(owns.getAttribute('aria-owns')).toBe(content.id)
    expect(learn.nextElementSibling!.nextElementSibling).toBe(owns)
    await userEvent.keyboard('{Tab}')
    await vi.waitFor(() => expect(document.activeElement).toBe(query('#stitches')))
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()

    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(learn.getAttribute('data-state')).toBe('closed'))
    // Gone with the open state.
    expect(learn.parentElement!.querySelector('[aria-owns]')).toBeNull()
    expect(learn.nextElementSibling).toBe(query('[data-test=learn] ~ reka-navigation-menu-content'))
  })

  it('dispatches `select` from a link, and follows its href unless the click is prevented', async () => {
    await ready()
    const link = query('[data-test=github]')
    const selected = vi.fn()
    link.addEventListener('select', selected)
    const blockClick = (event: Event) => event.preventDefault()
    link.addEventListener('click', blockClick)
    await userEvent.click(link)
    await settle()
    expect(selected).toHaveBeenCalledOnce()
    expect(location.hash).not.toBe('#github')

    link.removeEventListener('click', blockClick)
    link.focus()
    await userEvent.keyboard('{Enter}')
    await vi.waitFor(() => expect(location.hash).toBe('#github'))
    expect(selected).toHaveBeenCalledTimes(2)
    history.replaceState(null, '', location.pathname + location.search)
  })
})
