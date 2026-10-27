import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport, SelectVirtualizer } from '.'

const options = Array.from({ length: 2000 }, (_, i) => (i === 1500 ? 'Zucchini' : `Fruit ${i}`))

function mountSelect(rootProps: Record<string, unknown> = {}) {
  const wrapper = mount(defineComponent({
    setup: () => () => h(SelectRoot, rootProps, () => [
      h(SelectTrigger, { 'data-testid': 'trigger', 'aria-label': 'Fruit', 'style': 'width: 160px; height: 32px;' }, () => h(SelectValue, { placeholder: 'Pick a fruit' })),
      h(SelectPortal, () => h(SelectContent, { position: 'popper', style: 'background: white; width: 200px;' }, () =>
        h(SelectViewport, { style: 'max-height: 240px;' }, () =>
          h(SelectVirtualizer, { options, estimateSize: 24 }, {
            default: ({ option }: { option: string }) => h(SelectItem, { value: option, style: 'height: 24px;' }, () => h(SelectItemText, () => option)),
          })))),
    ]),
  }), { attachTo: document.body })
  return wrapper
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  unmount = undefined
  document.body.innerHTML = ''
})

const trigger = () => document.querySelector<HTMLElement>('[data-testid="trigger"]')!
const focused = () => document.activeElement?.getAttribute('aria-posinset')

describe('given a SelectVirtualizer, in a real browser', () => {
  it('renders a window of the options and reaches unrendered ones by keyboard', async () => {
    const wrapper = mountSelect()
    unmount = () => wrapper.unmount()
    await userEvent.click(trigger())
    await expect.poll(() => document.querySelectorAll('[role=option]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[role=option]').length).toBeLessThan(60)
    await expect.poll(focused).toBe('1')

    await userEvent.keyboard('{End}')
    await expect.poll(focused).toBe('2000')

    await userEvent.keyboard('{Home}')
    await expect.poll(focused).toBe('1')

    await userEvent.keyboard('z')
    await expect.poll(() => document.activeElement?.textContent).toBe('Zucchini')

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => trigger().textContent).toBe('Zucchini')
  })

  it('opens on a selected option far down the list', async () => {
    const wrapper = mountSelect({ defaultValue: 'Fruit 1200' })
    unmount = () => wrapper.unmount()
    await expect.poll(() => trigger().textContent).toBe('Fruit 1200')
    await userEvent.click(trigger())
    await expect.poll(() => document.activeElement?.textContent).toBe('Fruit 1200')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(focused).toBe('1202')
  })
})
