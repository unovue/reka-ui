// The element/host contract: attribute ownership, `disabled`, moves, clones, forms
// and events. Started from the review repros of #3087 (R1–R10). Plain DOM only,
// no Vue app in the test.
import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { collapsibleElements, defineRekaElements, rekaElementFamilies, switchElements } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements(rekaElementFamilies)
})
afterEach(cleanup)

const SW = 'style="display:inline-block;width:40px;height:20px"'
type SwitchElement = HTMLElement & { disabled?: boolean, modelValue?: boolean }

describe('`disabled`', () => {
  // Native-named boolean attributes follow HTML: present means `true`, whatever
  // the value. The host's state (focus, `aria-disabled`, clicks) follows the prop.
  it('`disabled="false"` is disabled, consistently', async () => {
    render(`<reka-switch-root aria-label="x" disabled="false" ${SW}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.hasAttribute('data-disabled')).toBe(true)
    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.hasAttribute('tabindex')).toBe(false)
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-checked')).toBe('false')
  })

  it('is enabled again when the attribute is removed', async () => {
    render(`<reka-toggle aria-label="b" disabled>B</reka-toggle>`)
    const el = query('reka-toggle')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(true))
    el.removeAttribute('disabled')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))
    // The part let go of `disabled`, and the consumer's removal stands.
    expect(el.hasAttribute('disabled')).toBe(false)
    expect(el.getAttribute('aria-disabled')).toBeNull()
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-pressed')).toBe('true')
  })

  it('`el.disabled = false` re-enables an element that has the attribute', async () => {
    render(`<reka-switch-root aria-label="x" disabled ${SW}></reka-switch-root>`)
    const el = query<SwitchElement>('reka-switch-root')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(true))
    el.disabled = false
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))
    expect(el.getAttribute('aria-disabled')).toBeNull()
    // A form-associated host is `:disabled` while it has the attribute.
    expect(el.matches(':disabled')).toBe(false)
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-checked')).toBe('true')
  })

  it('follows a disabled `<fieldset>`', async () => {
    render(`<form><fieldset disabled><reka-switch-root aria-label="x" name="wifi" ${SW}></reka-switch-root></fieldset></form>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(true))
    await userEvent.click(el, { force: true })
    expect(el.getAttribute('aria-checked')).toBe('false')
    query('fieldset').removeAttribute('disabled')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
  })
})

describe('ids', () => {
  it('keeps the part\'s id while rendered, and gives back what the consumer set meanwhile', async () => {
    render(`
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger>T</reka-collapsible-trigger>
        <reka-collapsible-content id="mine">Body</reka-collapsible-content>
      </reka-collapsible-root>`)
    const trigger = query('reka-collapsible-trigger')
    const content = query('reka-collapsible-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    content.id = 'changed-by-consumer'
    await settle()
    // `aria-controls` keeps pointing at the element.
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(content.id).toBe('changed-by-consumer')
  })

  it('feeds the consumer\'s id to a part that takes an `id` prop', async () => {
    render(`<reka-switch-root aria-label="x" id="wifi" ${SW}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.id).toBe('wifi')
    el.id = 'other'
    await settle()
    expect(el.id).toBe('other')
  })
})

describe('moves and reconnects', () => {
  it('moving an element synchronously under another root rebinds its context', async () => {
    render(`
      <reka-collapsible-root id="A"><reka-collapsible-trigger id="tA">A</reka-collapsible-trigger><reka-collapsible-content>a</reka-collapsible-content></reka-collapsible-root>
      <reka-collapsible-root id="B"><reka-collapsible-content>b</reka-collapsible-content></reka-collapsible-root>`)
    const t = query('#tA')
    const [ca, cb] = document.querySelectorAll('reka-collapsible-content')
    await vi.waitFor(() => expect(t.getAttribute('aria-expanded')).toBe('false'))
    query('#B').prepend(t)
    await settle()
    await userEvent.click(t)
    await settle()
    expect(cb.getAttribute('data-state')).toBe('open')
    expect(ca.hasAttribute('data-reka-unmounted')).toBe(true)
  })

  it('keeps uncontrolled state when removed and re-added in a later task', async () => {
    const c = render(`<reka-switch-root aria-label="x" ${SW}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
    el.remove()
    await settle()
    c.append(el)
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.getAttribute('aria-checked')).toBe('true')
  })

  it('keeps uncontrolled state across its parent part re-rendering', async () => {
    render(`
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger>T</reka-collapsible-trigger>
        <reka-collapsible-content><reka-switch-root aria-label="x" ${SW}></reka-switch-root></reka-collapsible-content>
      </reka-collapsible-root>`)
    const trigger = query('reka-collapsible-trigger')
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(el.hasAttribute('data-reka-unmounted')).toBe(true))
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
  })
})

describe('forms', () => {
  it('moving a switch to another form moves its value with it', async () => {
    render(`<form id="f1"><reka-switch-root aria-label="x" name="wifi" default-value ${SW}></reka-switch-root></form><form id="f2"></form>`)
    const el = query('reka-switch-root')
    const f1 = query<HTMLFormElement>('#f1')
    const f2 = query<HTMLFormElement>('#f2')
    await vi.waitFor(() => expect(new FormData(f1).get('wifi')).toBe('on'))
    f2.append(el)
    await settle()
    expect(new FormData(f2).get('wifi')).toBe('on')
    expect(new FormData(f1).get('wifi')).toBeNull()
  })

  it('resets to its default with the form', async () => {
    const c = render(`<form><reka-switch-root aria-label="x" name="wifi" ${SW}></reka-switch-root></form>`)
    const form = c.querySelector('form')!
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    await vi.waitFor(() => expect(new FormData(form).get('wifi')).toBe('on'))
    form.reset()
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('false'))
    expect(new FormData(form).get('wifi')).toBeNull()
  })

  it('leaves out fields inside a part that is not rendered, like the Vue component', async () => {
    const c = render(`
      <form>
        <input name="secret" value="visible">
        <reka-collapsible-root>
          <reka-collapsible-trigger>T</reka-collapsible-trigger>
          <reka-collapsible-content><input name="secret" value="hidden"><input name="other" value="1"></reka-collapsible-content>
        </reka-collapsible-root>
      </form>`)
    const form = c.querySelector('form')!
    await vi.waitFor(() => expect(query('reka-collapsible-trigger').getAttribute('aria-expanded')).toBe('false'))
    expect(new FormData(form).getAll('secret')).toEqual(['visible'])
    expect(new FormData(form).get('other')).toBeNull()
    // Unrendered content is `inert`: nothing inside takes focus.
    expect(query('reka-collapsible-content').inert).toBe(true)

    await userEvent.click(query('reka-collapsible-trigger'))
    await vi.waitFor(() => expect(new FormData(form).getAll('secret')).toEqual(['visible', 'hidden']))
  })
})

describe('cloneNode', () => {
  it('cloning a form with a mounted switch does not duplicate its form value', async () => {
    const c = render(`<form><reka-switch-root aria-label="x" name="wifi" default-value ${SW}></reka-switch-root></form>`)
    const form = c.querySelector('form')!
    await vi.waitFor(() => expect(new FormData(form).get('wifi')).toBe('on'))
    const clone = form.cloneNode(true) as HTMLFormElement
    c.append(clone)
    await settle()
    expect(new FormData(clone).getAll('wifi')).toEqual(['on'])
  })

  it('a copy of a mounted element starts from the consumer\'s attributes', async () => {
    const c = render(`
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger class="trigger">T</reka-collapsible-trigger>
        <reka-collapsible-content id="mine">Body</reka-collapsible-content>
      </reka-collapsible-root>`)
    const root = query('reka-collapsible-root')
    const content = query('reka-collapsible-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    const generatedId = content.id
    expect(generatedId).not.toBe('mine')

    const clone = root.cloneNode(true) as HTMLElement
    c.append(clone)
    const ct = clone.querySelector('reka-collapsible-trigger') as HTMLElement
    const cc = clone.querySelector('reka-collapsible-content') as HTMLElement
    await vi.waitFor(() => expect(cc.getAttribute('data-state')).toBe('open'))
    expect(cc.id).not.toBe(generatedId)
    expect(ct.getAttribute('aria-controls')).toBe(cc.id)
    expect(ct.className).toBe('trigger')

    await userEvent.click(ct)
    await vi.waitFor(() => expect(cc.hasAttribute('data-reka-unmounted')).toBe(true))
    expect(cc.id).toBe('mine')
    expect(cc.getAttribute('data-state')).toBeNull()
  })
})

describe('no elements next to the host', () => {
  it('a closed collapsible/accordion leaves no extra nodes in the document', async () => {
    const c = render(`
      <reka-accordion-root type="single">
        <reka-accordion-item value="a"><reka-accordion-header><reka-accordion-trigger>A</reka-accordion-trigger></reka-accordion-header><reka-accordion-content>a</reka-accordion-content></reka-accordion-item>
      </reka-accordion-root>`)
    const item = query('reka-accordion-item')
    await vi.waitFor(() => expect(query('reka-accordion-trigger').getAttribute('aria-expanded')).toBe('false'))
    await settle()
    expect([...item.childNodes].filter(node => node.nodeType !== Node.TEXT_NODE).map(node => node.nodeName))
      .toEqual(['REKA-ACCORDION-HEADER', 'REKA-ACCORDION-CONTENT'])
    expect(c.querySelectorAll('[data-reka-fragment]').length).toBe(0)
  })

  it('a switch in a form keeps `:first-child`', async () => {
    const c = render(`<form><reka-switch-root aria-label="x" name="wifi" ${SW}></reka-switch-root></form>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await settle()
    expect(c.querySelector('form')!.firstElementChild).toBe(el)
    expect(el.matches(':first-child')).toBe(true)
  })
})

describe('events', () => {
  it('`update-*` reports a change that happened: not cancelable', async () => {
    render(`<reka-switch-root aria-label="x" ${SW}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    const seen: Record<string, boolean> = {}
    el.addEventListener('update-model-value', (event) => {
      seen.update = event.cancelable
    })
    el.addEventListener('before-update-model-value', (event) => {
      seen.before = event.cancelable
    })
    await userEvent.click(el)
    expect(seen).toEqual({ update: false, before: true })
  })

  it('bubble and cross shadow roots when asked to', async () => {
    defineRekaElements([switchElements], { prefix: 'loud', events: { bubbles: true, composed: true } })
    const c = render('<div id="host"></div>')
    const shadow = query('#host').attachShadow({ mode: 'open' })
    shadow.innerHTML = `<loud-switch-root aria-label="x" ${SW}></loud-switch-root>`
    const el = shadow.querySelector('loud-switch-root') as HTMLElement
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    const onUpdate = vi.fn()
    c.addEventListener('update-model-value', onUpdate)
    await userEvent.click(el)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect((onUpdate.mock.calls[0][0] as RekaElementEvent<boolean>).detail.value).toBe(true)
  })
})

describe('options', () => {
  it('only supports `mode` for `shadowRoot`', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    defineRekaElements([collapsibleElements], { prefix: 'focus', shadowRoot: { mode: 'open', delegatesFocus: true } as { mode: ShadowRootMode } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only supports `mode`'))
    warn.mockRestore()
    const el = document.createElement('focus-collapsible-root')
    expect(el.shadowRoot?.delegatesFocus).toBe(false)
  })

  it('shares one id counter between every copy of the library', async () => {
    const registry = (globalThis as Record<symbol, { appUid: number }>)[Symbol.for('reka-ui.elements.registry')]
    const before = registry.appUid
    render(`<reka-toggle aria-label="b">B</reka-toggle>`)
    await vi.waitFor(() => expect(query('reka-toggle').getAttribute('aria-pressed')).toBe('false'))
    expect(registry.appUid).toBe(before + 1)
  })
})
