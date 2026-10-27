import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Lemon', 'Mango']

function mountSelect(rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}, onSubmit?: (data: FormData) => void) {
  const Fixture = defineComponent({
    setup() {
      return () => h('form', {
        style: 'padding: 200px 100px;',
        onSubmit: (event: SubmitEvent) => {
          event.preventDefault()
          onSubmit?.(new FormData(event.target as HTMLFormElement))
        },
      }, [
        h(SelectRoot, { name: 'fruit', ...rootProps }, () => [
          h(SelectTrigger, { 'data-testid': 'trigger', 'aria-label': 'Fruit', 'style': 'width: 160px; height: 32px; padding: 0 12px; display: flex; align-items: center;' }, () =>
            h(SelectValue, { 'data-testid': 'value', 'placeholder': 'Pick a fruit' })),
          h(SelectPortal, () => h(SelectContent, { 'data-testid': 'content', 'style': 'background: white; padding: 4px;', ...contentProps }, () =>
            h(SelectViewport, () => fruits.map(value => h(SelectItem, { value, style: 'height: 24px; padding: 0 12px; display: flex; align-items: center;' }, () =>
              h(SelectItemText, { 'data-testid': `text-${value}` }, () => value)))))),
        ]),
        h('button', { 'type': 'submit', 'data-testid': 'submit' }, 'Submit'),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { wrapper, get }
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

describe('given a Select, in a real browser', () => {
  it('aligns the selected item text over the value (item-aligned)', async () => {
    const { wrapper, get } = mountSelect({ defaultValue: 'Cherry' })
    unmount = () => wrapper.unmount()
    await expect.poll(() => get('value')?.textContent).toBe('Cherry')
    const valueRect = get('value')!.getBoundingClientRect()
    const triggerRect = get('trigger')!.getBoundingClientRect()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('text-Cherry')).not.toBeNull()

    await expect.poll(() => Math.round(get('text-Cherry')!.getBoundingClientRect().left)).toBe(Math.round(valueRect.left))
    const item = get('text-Cherry')!.closest('[role=option]')!.getBoundingClientRect()
    expect(Math.abs((item.top + item.height / 2) - (triggerRect.top + triggerRect.height / 2))).toBeLessThanOrEqual(1)
    expect(document.activeElement?.textContent).toBe('Cherry')
  })

  // #2827: the content is measured while `data-starting-style` applies; a
  // transform there must not skew where the content settles.
  it('aligns the selected item text over the value when the starting style scales the content', async () => {
    const style = document.createElement('style')
    style.textContent = `
      [data-testid=content] { transition: transform 100ms linear, opacity 100ms linear; transform-origin: center; }
      [data-testid=content][data-starting-style] { transform: scale(0.5); opacity: 0; }
    `
    document.head.appendChild(style)
    const { wrapper, get } = mountSelect({ defaultValue: 'Cherry' }, { style: 'background: white; padding: 4px 40px;' })
    unmount = () => {
      wrapper.unmount()
      style.remove()
    }
    await expect.poll(() => get('value')?.textContent).toBe('Cherry')
    const valueRect = get('value')!.getBoundingClientRect()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')?.hasAttribute('data-starting-style')).toBe(false)
    await expect.poll(() => get('content')!.getAnimations().length).toBe(0)

    expect(Math.abs(get('text-Cherry')!.getBoundingClientRect().left - valueRect.left)).toBeLessThan(1)
  })

  it('submits the selected value with the form', async () => {
    const submitted: FormData[] = []
    const { wrapper, get } = mountSelect({}, { position: 'popper' }, data => submitted.push(data))
    unmount = () => wrapper.unmount()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('text-Banana')).not.toBeNull()
    await userEvent.click(get('text-Banana')!)
    await expect.poll(() => get('value')?.textContent).toBe('Banana')

    await userEvent.click(get('submit')!)
    expect(submitted.at(-1)?.get('fruit')).toBe('Banana')
  })

  it('submits every value of a multiple select', async () => {
    const submitted: FormData[] = []
    const { wrapper, get } = mountSelect({ multiple: true }, { position: 'popper' }, data => submitted.push(data))
    unmount = () => wrapper.unmount()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('text-Banana')).not.toBeNull()
    await userEvent.click(get('text-Banana')!)
    await userEvent.click(get('text-Mango')!)
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()

    await userEvent.click(get('submit')!)
    expect(submitted.at(-1)?.getAll('fruit')).toEqual(['Banana', 'Mango'])
  })

  it('selects by typing on the focused, closed trigger', async () => {
    const { wrapper, get } = mountSelect()
    unmount = () => wrapper.unmount()
    await expect.poll(() => document.querySelector('select option')).not.toBeNull()

    get('trigger')!.focus()
    await userEvent.keyboard('bl')
    await expect.poll(() => get('value')?.textContent).toBe('Blueberry')
    expect(get('content')).toBeNull()
  })

  it('closes a popper select from a press on its trigger (cut out of the backdrop)', async () => {
    const reasons: string[] = []
    const { wrapper, get } = mountSelect({
      'onUpdate:open': (_open: boolean, details: { reason: string }) => reasons.push(details.reason),
    }, { position: 'popper' })
    unmount = () => wrapper.unmount()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('trigger')!.getAttribute('aria-expanded')).toBe('true')
    // Let the dismissable layer arm its outside-press listener.
    await new Promise(resolve => setTimeout(resolve, 50))

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('trigger')!.getAttribute('aria-expanded')).toBe('false')
    expect(reasons).toEqual(['trigger-press', 'trigger-press'])
  })
})
