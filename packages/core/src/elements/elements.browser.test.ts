import type { RekaElementEvent } from '.'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  collapsibleElements,
  defineRekaElements,
  defineSwitchElements,
  rekaElementFamilies,
  switchElements,
  toggleElements,
} from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

// Every test drives the elements from plain DOM APIs: there is no Vue app here.
afterEach(cleanup)

type SwitchElement = HTMLElement & { modelValue?: unknown, disabled?: boolean }

const SWITCH_STYLE = 'style="display: inline-block; width: 40px; height: 20px"'

describe('registration', () => {
  it('registers nothing on import', () => {
    expect(customElements.get('reka-switch-root')).toBeUndefined()
  })

  it('defines one tag per part, and is idempotent', () => {
    expect(defineSwitchElements()).toEqual(['reka-switch-root', 'reka-switch-thumb'])
    const constructor = customElements.get('reka-switch-root')
    expect(constructor).toBeDefined()

    expect(() => defineRekaElements([switchElements])).not.toThrow()
    expect(customElements.get('reka-switch-root')).toBe(constructor)
  })

  it('accepts a custom tag prefix', () => {
    expect(defineRekaElements([toggleElements], { prefix: 'acme' })).toEqual(['acme-toggle'])
    expect(customElements.get('acme-toggle')).toBeDefined()
  })

  it('rejects an invalid prefix', () => {
    expect(() => defineRekaElements([toggleElements], { prefix: 'Bad Prefix' })).toThrow(/invalid tag prefix/)
  })

  it('rebinds to ancestors defined later, so registration order does not matter', async () => {
    render(`
      <order-collapsible-root>
        <order-collapsible-trigger>Details</order-collapsible-trigger>
        <order-collapsible-content>
          <order-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></order-switch-root>
        </order-collapsible-content>
      </order-collapsible-root>
    `)
    defineRekaElements([switchElements], { prefix: 'order' })
    const switchEl = query('order-switch-root')
    // Undefined ancestors are skipped, not waited for: the switch works on its own.
    await vi.waitFor(() => expect(switchEl.getAttribute('role')).toBe('switch'))
    await userEvent.click(switchEl)
    expect(switchEl.getAttribute('aria-checked')).toBe('true')

    // Defined later, the collapsible takes the switch in: closed content, so it unmounts…
    defineRekaElements([collapsibleElements], { prefix: 'order' })
    await vi.waitFor(() => expect(switchEl.hasAttribute('data-reka-unmounted')).toBe(true))
    // …and comes back, with its state, when the content opens.
    await userEvent.click(query('order-collapsible-trigger'))
    await vi.waitFor(() => expect(switchEl.getAttribute('aria-checked')).toBe('true'))
  })

  it('does not wait forever under an undefined element of a registered prefix', async () => {
    defineRekaElements([switchElements], { prefix: 'stray' })
    render(`<stray-unknown-part><stray-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></stray-switch-root></stray-unknown-part>`)
    await vi.waitFor(() => expect(query('stray-switch-root').getAttribute('role')).toBe('switch'))
  })

  it('waits, without throwing, when a part is placed outside its root', async () => {
    defineRekaElements([collapsibleElements], { prefix: 'lone' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(`<lone-collapsible-trigger>Details</lone-collapsible-trigger>`)
    const trigger = query('lone-collapsible-trigger')
    await settle()
    expect(trigger.hasAttribute('data-reka-unmounted')).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cannot render outside its family\'s root'))
    warn.mockRestore()

    // Moved under a root, it renders there.
    const root = document.createElement('lone-collapsible-root')
    trigger.before(root)
    root.append(trigger)
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  })

  it('rebinds a part inside a shadow root below an ancestor defined later', async () => {
    const container = render(`<lateb-collapsible-root><div class="host"></div><lateb-collapsible-content>c</lateb-collapsible-content></lateb-collapsible-root>`)
    const shadowRoot = container.querySelector('.host')!.attachShadow({ mode: 'open' })
    shadowRoot.innerHTML = `<latea-collapsible-trigger>T</latea-collapsible-trigger>`
    const trigger = shadowRoot.querySelector('latea-collapsible-trigger')!
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    defineRekaElements([collapsibleElements], { prefix: 'latea' })
    await settle()
    expect(trigger.hasAttribute('aria-expanded')).toBe(false)
    warn.mockRestore()
    defineRekaElements([collapsibleElements], { prefix: 'lateb' })
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  })

  it('binds a nested trigger to the nearest root of its family', async () => {
    defineRekaElements([collapsibleElements], { prefix: 'nest' })
    render(`
      <nest-collapsible-root default-open>
        <nest-collapsible-trigger>O</nest-collapsible-trigger>
        <nest-collapsible-content class="outer">
          <nest-collapsible-root>
            <nest-collapsible-trigger id="inner-trigger">I</nest-collapsible-trigger>
            <nest-collapsible-content class="inner">inner</nest-collapsible-content>
          </nest-collapsible-root>
        </nest-collapsible-content>
      </nest-collapsible-root>`)
    const trigger = query('#inner-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(query('.inner').getAttribute('data-state')).toBe('open'))
    expect(query('.outer').getAttribute('data-state')).toBe('open')
    expect(trigger.getAttribute('aria-controls')).toBe(query('.inner').id)
  })

  it('keeps properties set before the element was defined', async () => {
    const el = document.createElement('late-switch-root') as SwitchElement
    el.setAttribute('aria-label', 'Wi-Fi')
    el.modelValue = true
    render('').append(el)
    defineRekaElements([switchElements], { prefix: 'late' })
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(el.modelValue).toBe(true)
  })
})

describe('props', () => {
  beforeAll(() => {
    defineRekaElements(rekaElementFamilies)
  })

  it('reads kebab-case attributes, and follows their changes', async () => {
    render(`<reka-switch-root aria-label="Wi-Fi" default-value disabled ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(el.hasAttribute('data-disabled')).toBe(true)

    el.removeAttribute('disabled')
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))

    // `"false"` is an explicit `false`: here it makes the switch controlled and off.
    el.setAttribute('model-value', 'false')
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('false'))
  })

  it('exposes props as properties, reflecting only `disabled` to its attribute', async () => {
    render(`<reka-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query<SwitchElement>('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))

    el.modelValue = true
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(el.hasAttribute('model-value')).toBe(false)

    // A form-associated host is `:disabled` by its attribute: the property keeps it in step.
    el.disabled = true
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(true))
    expect(el.disabled).toBe(true)
    expect(el.hasAttribute('disabled')).toBe(true)

    el.disabled = undefined
    await vi.waitFor(() => expect(el.hasAttribute('data-disabled')).toBe(false))
    expect(el.hasAttribute('disabled')).toBe(false)
  })

  it('takes object and array values as properties only', async () => {
    render(`
      <reka-checkbox-group-root aria-label="Toppings" default-value="cheese">
        <reka-checkbox-root value="cheese" aria-label="Cheese"></reka-checkbox-root>
        <reka-checkbox-root value="ham" aria-label="Ham"></reka-checkbox-root>
      </reka-checkbox-group-root>
    `)
    const group = query<HTMLElement & { modelValue?: string[] }>('reka-checkbox-group-root')
    const [cheese, ham] = document.querySelectorAll('reka-checkbox-root')
    await vi.waitFor(() => expect(ham.getAttribute('aria-checked')).toBe('false'))
    // An array prop has no attribute: `default-value` is not read.
    expect(cheese.getAttribute('aria-checked')).toBe('false')
    expect((customElements.get('reka-checkbox-group-root') as unknown as { observedAttributes: string[] }).observedAttributes)
      .not
      .toContain('default-value')

    group.modelValue = ['ham']
    await vi.waitFor(() => expect(ham.getAttribute('aria-checked')).toBe('true'))
    expect(cheese.getAttribute('aria-checked')).toBe('false')
  })
})

describe('events', () => {
  beforeAll(() => {
    defineRekaElements(rekaElementFamilies)
  })

  it('dispatches `update-*` with `{ value, details }`, without bubbling', async () => {
    const container = render(`<reka-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    const onUpdate = vi.fn()
    const onBubbled = vi.fn()
    el.addEventListener('update-model-value', onUpdate)
    container.addEventListener('update-model-value', onBubbled)

    await userEvent.click(el)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const event = onUpdate.mock.calls[0][0] as RekaElementEvent<boolean, { reason: string, event?: Event }>
    expect(event).toBeInstanceOf(CustomEvent)
    expect(event.detail.value).toBe(true)
    expect(event.detail.details.reason).toBe('trigger-press')
    expect(event.detail.details.event).toBeInstanceOf(MouseEvent)
    expect(onBubbled).not.toHaveBeenCalled()
    expect(el.getAttribute('data-state')).toBe('checked')
  })

  it('cancels the change when `before-update-*` is prevented', async () => {
    render(`<reka-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    const onUpdate = vi.fn()
    el.addEventListener('before-update-model-value', event => event.preventDefault())
    el.addEventListener('update-model-value', onUpdate)

    await userEvent.click(el)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(el.getAttribute('aria-checked')).toBe('false')
  })

  it('stays controlled: the consumer applies the value from the event', async () => {
    render(`<reka-switch-root aria-label="Wi-Fi" model-value="false" ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query<SwitchElement>('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    const values: unknown[] = []
    el.addEventListener('update-model-value', (event) => {
      values.push((event as RekaElementEvent).detail.value)
    })

    await userEvent.click(el)
    expect(values).toEqual([true])
    // Nothing applied it yet.
    expect(el.getAttribute('aria-checked')).toBe('false')

    el.modelValue = true
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
  })
})

describe('the host is the rendered part', () => {
  beforeAll(() => {
    defineRekaElements(rekaElementFamilies)
  })

  it('keeps the consumer\'s attributes, classes and styles, and restores them when the part unmounts', async () => {
    render(`
      <reka-collapsible-root>
        <reka-collapsible-trigger class="trigger">Details</reka-collapsible-trigger>
        <reka-collapsible-content class="panel" style="color: rgb(255, 0, 0)" data-testid="panel">Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    const trigger = query('reka-collapsible-trigger')
    const content = query('reka-collapsible-content')
    const consumerAttributes = ['class', 'data-testid', 'style']
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    expect(trigger.className).toBe('trigger')
    expect(trigger.getAttribute('data-state')).toBe('closed')
    // Not rendered while closed.
    expect(content.hasAttribute('data-reka-unmounted')).toBe(true)
    expect(getComputedStyle(content).display).toBe('none')

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(content.className).toBe('panel')
    expect(content.style.color).toBe('rgb(255, 0, 0)')
    expect(content.style.getPropertyValue('--reka-collapsible-content-height')).not.toBe('')
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    expect(getComputedStyle(content).display).not.toBe('none')

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    // Back to exactly what the consumer wrote, plus the unmounted state.
    expect(content.getAttributeNames().sort()).toEqual([...consumerAttributes, 'data-reka-unmounted', 'hidden', 'inert'].sort())
    expect(content.getAttribute('style')).toBe('color: rgb(255, 0, 0);')
  })

  it('keeps a part-owned attribute while mounted, and gives back what the consumer wrote meanwhile', async () => {
    render(`
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger>Details</reka-collapsible-trigger>
        <reka-collapsible-content id="mine" hidden>Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    const trigger = query('reka-collapsible-trigger')
    const content = query('reka-collapsible-content')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    // `aria-controls` needs the part's id while it is rendered.
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    content.setAttribute('data-state', 'tampered')
    content.removeAttribute('id')
    await vi.waitFor(() => expect(content.getAttribute('data-state')).toBe('open'))
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)

    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(true))
    // What the consumer wrote while the part owned the attributes is what they get back.
    expect(content.hasAttribute('id')).toBe(false)
    expect(content.getAttribute('data-state')).toBe('tampered')
    // They set `hidden` themselves: it is theirs, and stays.
    expect(content.getAttribute('data-reka-unmounted')).toBe('inert')
    await userEvent.click(trigger)
    await vi.waitFor(() => expect(content.hasAttribute('data-reka-unmounted')).toBe(false))
    expect(content.hasAttribute('hidden')).toBe(true)
  })

  it('hides an unrendered part even when the consumer sets `display`', async () => {
    render(`
      <reka-collapsible-root>
        <reka-collapsible-trigger>Details</reka-collapsible-trigger>
        <reka-collapsible-content style="display: flex">Body</reka-collapsible-content>
      </reka-collapsible-root>
    `)
    const trigger = query('reka-collapsible-trigger')
    await vi.waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    expect(getComputedStyle(query('reka-collapsible-content')).display).toBe('none')
  })

  it('takes part in forms and is labelled by `<label for>`', async () => {
    const container = render(`
      <form>
        <label for="wifi">Wi-Fi</label>
        <reka-switch-root id="wifi" name="wifi" ${SWITCH_STYLE}></reka-switch-root>
      </form>
    `)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    expect(el.getAttribute('aria-label')).toBe('Wi-Fi')
    const form = container.querySelector('form')!
    expect(new FormData(form).get('wifi')).toBeNull()

    await userEvent.click(container.querySelector('label')!)
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(new FormData(form).get('wifi')).toBe('on')
  })
})

describe('shadowRoot option', () => {
  it('slots the children; context, state and events work the same', async () => {
    defineRekaElements([switchElements], { prefix: 'shadow', shadowRoot: true })
    render(`<shadow-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}><shadow-switch-thumb></shadow-switch-thumb></shadow-switch-root>`)
    const el = query('shadow-switch-root')
    const thumb = query('shadow-switch-thumb')
    await vi.waitFor(() => expect(thumb.getAttribute('data-state')).toBe('unchecked'))
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(thumb.assignedSlot).toBe(el.shadowRoot!.querySelector('slot'))

    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
    expect(thumb.getAttribute('data-state')).toBe('checked')
  })
})

describe('lifecycle', () => {
  beforeAll(() => {
    defineRekaElements(rekaElementFamilies)
  })

  it('tears down when removed, and mounts again when re-inserted', async () => {
    const container = render(`<reka-switch-root aria-label="Wi-Fi" default-value ${SWITCH_STYLE}></reka-switch-root>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))

    el.remove()
    await settle()
    // Everything the part added is gone.
    expect(el.getAttributeNames().sort()).toEqual(['aria-label', 'default-value', 'style'])

    container.append(el)
    await vi.waitFor(() => expect(el.getAttribute('aria-checked')).toBe('true'))
  })

  it('survives being moved within the document', async () => {
    const container = render(`<div id="a"><reka-switch-root aria-label="Wi-Fi" ${SWITCH_STYLE}></reka-switch-root></div><div id="b"></div>`)
    const el = query('reka-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')

    container.querySelector('#b')!.append(el)
    await settle()
    // Same app, same state.
    expect(el.getAttribute('aria-checked')).toBe('true')
  })
})
