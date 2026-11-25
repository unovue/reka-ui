import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import Fixture from './fixtures/Adoption.vue'
import { byId, exposed, mount, text, until } from './utils'

declare const __VAPOR__: boolean

interface State {
  withListener: boolean
  checked: boolean
  parentClass: string
  color: string
  swapped: boolean
  rowSwapped: boolean
  radioSwapped: boolean
  popoverOpen: boolean
  popoverSwapped: boolean
  collapsibleOpen: boolean
  contentTag: string
  nav: string
}

const state = () => exposed<State>()

// `asChild` in the template form: the parent's props are patched onto the slotted element
describe('asChild adoption (Vapor)', () => {
  it('removes a listener whose prop goes away', async () => {
    await mount(Fixture)
    await userEvent.click(byId('listener'))
    expect(text('clicks')).toBe('1')
    state().withListener = false
    await nextTick()
    await userEvent.click(byId('listener'))
    expect(text('clicks')).toBe('1')
  })

  it('resets a live boolean property, not only its attribute', async () => {
    await mount(Fixture)
    const input = byId<HTMLInputElement>('checkbox')
    expect(input.checked).toBe(true)
    state().checked = false
    await until(() => expect(input.checked).toBe(false))
  })

  it('keeps a class the child already had when the adopted class changes', async () => {
    await mount(Fixture)
    const el = byId('classes')
    expect([...el.classList].sort()).toEqual(['parent', 'shared'])
    state().parentClass = 'parent'
    await nextTick()
    expect([...el.classList].sort()).toEqual(['parent', 'shared'])
  })

  it('applies a string style', async () => {
    await mount(Fixture)
    expect(byId('string-style').style.display).toBe('none')
  })

  it('keeps a style the child owns, also after the adopted style changes', async () => {
    await mount(Fixture)
    const el = byId('child-style')
    expect(el.style.color).toBe('red')
    state().color = 'green'
    await nextTick()
    expect(el.style.color).toBe('red')
  })

  it('listens for kebab-case custom events under their DOM name', async () => {
    await mount(Fixture)
    byId('root-a').dispatchEvent(new CustomEvent('after-leave'))
    await until(() => expect(text('after-leaves')).toBe('1'))
  })

  it('moves the adopted props to a new root element when the slot swaps it', async () => {
    await mount(Fixture)
    expect(byId('root-a').dataset.adopted).toBe('yes')
    state().swapped = true
    await until(() => expect(document.getElementById('root-b')).not.toBeNull())
    expect(byId('root-b').dataset.adopted).toBe('yes')
    await userEvent.click(byId('root-b'))
    expect(text('swap-clicks')).toBe('1')
  })
})

describe('slot root swaps (Vapor)', () => {
  it('virtualizer rows keep their index and position when the row root changes', async () => {
    await mount(Fixture)
    await until(() => expect(document.querySelector('.row-a')).not.toBeNull())
    state().rowSwapped = true
    await until(() => expect(document.querySelector('.row-b')).not.toBeNull())
    const row = document.querySelector<HTMLElement>('.row-b')!
    expect(row.dataset.index).toBe('0')
    expect(row.style.position).toBe('absolute')
  })

  // v2's VDOM CollectionItem and Presence keep the first element too (their ref is on the slot
  // component, which a new child doesn't re-run), so these two are Vapor-only
  it.runIf(__VAPOR__)('a collection item re-registers its new root element', async () => {
    await mount(Fixture)
    await userEvent.click(byId('radio-a'))
    state().radioSwapped = true
    await until(() => expect(document.getElementById('radio-b2')).not.toBeNull())
    expect(byId('radio-b2').hasAttribute('data-reka-collection-item')).toBe(true)
    byId('radio-a').focus()
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(document.activeElement).toBe(byId('radio-b2')))
  })

  it('a trigger keeps aria-controls when an asChild content swaps its root', async () => {
    await mount(Fixture)
    await userEvent.click(byId('popover-trigger'))
    await until(() => expect(document.getElementById('popover-a')).not.toBeNull())
    const controls = byId('popover-trigger').getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    state().popoverSwapped = true
    await until(() => expect(document.getElementById('popover-b')).not.toBeNull())
    await new Promise(r => setTimeout(r, 50))
    expect(byId('popover-trigger').getAttribute('aria-controls')).toBe(byId('popover-b').id)
  })

  it.runIf(__VAPOR__)('presence follows a content element replaced while open, and plays its exit animation', async () => {
    const style = document.createElement('style')
    style.textContent = '@keyframes rk-out { to { opacity: 0 } } #collapsible-content[data-state=closed] { animation: rk-out 300ms }'
    document.head.append(style)
    try {
      await mount(Fixture)
      expect(byId('collapsible-content').tagName).toBe('DIV')
      // past the mount, where Collapsible blocks its animation
      await new Promise(r => setTimeout(r, 100))
      state().contentTag = 'section'
      await until(() => expect(byId('collapsible-content').tagName).toBe('SECTION'))
      state().collapsibleOpen = false
      await new Promise(r => setTimeout(r, 50))
      // still animating out: shown, with its content
      expect(byId('collapsible-content').hidden).toBe(false)
      expect(byId('collapsible-content').textContent).toContain('Content')
      await until(() => expect(byId('collapsible-content').hidden).toBe(true))
    }
    finally {
      style.remove()
    }
  })

  it.runIf(__VAPOR__)('presence runs its @after-leave listener (navigation menu viewport resets its size)', async () => {
    await mount(Fixture)
    await userEvent.click(byId('nav-trigger'))
    await until(() => expect(byId('nav-viewport').style.getPropertyValue('--reka-navigation-menu-viewport-width')).not.toBe(''))
    await userEvent.keyboard('{Escape}')
    await until(() => expect(byId('nav-viewport').style.getPropertyValue('--reka-navigation-menu-viewport-width')).toBe(''))
  })
})
