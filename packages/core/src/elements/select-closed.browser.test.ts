// Regression (#3111 review): a closed custom-element select stays live.
// Focus 9: custom elements Select — label / typeahead freshness while closed (real Chromium).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, selectElements } from '.'
import { cleanup, query, render } from './elements.test.helpers'

beforeAll(() => {
  defineRekaElements([selectElements])
})
afterEach(cleanup)

function SELECT(rootAttrs = '') {
  return `
  <form>
    <reka-select-root name="fruit" ${rootAttrs}>
      <reka-select-trigger aria-label="Fruit"><reka-select-value placeholder="Pick"></reka-select-value></reka-select-trigger>
      <reka-select-portal>
        <reka-select-content>
          <reka-select-viewport>
            <reka-select-item value="apple"><reka-select-item-text>Apple</reka-select-item-text></reka-select-item>
            <reka-select-item value="banana"><reka-select-item-text>Banana</reka-select-item-text></reka-select-item>
            <reka-select-item value="cherry"><reka-select-item-text>Cherry</reka-select-item-text></reka-select-item>
          </reka-select-viewport>
        </reka-select-content>
      </reka-select-portal>
    </reka-select-root>
  </form>`
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
async function mountSel(attrs = '') {
  render(SELECT(attrs))
  const trigger = query('reka-select-trigger')
  await vi.waitFor(() => expect(trigger.getAttribute('role')).toBe('combobox'))
  await sleep(1200) // past the idle harvest
  return { trigger, value: query('reka-select-value'), root: query('reka-select-root') as HTMLElement & { modelValue: string } }
}
const itemText = (v: string) => document.querySelector(`reka-select-item[value="${v}"] reka-select-item-text`) as HTMLElement

describe('elements select while closed', () => {
  it('a selected item\'s text changed while closed shows in reka-select-value', async () => {
    const { value } = await mountSel('default-value="cherry"')
    await vi.waitFor(() => expect(value.textContent).toBe('Cherry'))
    itemText('cherry').textContent = 'Cerise'
    await sleep(300)
    expect(value.textContent).toBe('Cerise')
  })

  it('an item disabled while closed is skipped by closed typeahead', async () => {
    const { trigger, root } = await mountSel()
    trigger.focus()
    await sleep(100)
    document.querySelector('reka-select-item[value="banana"]')!.setAttribute('disabled', '')
    await sleep(100)
    await userEvent.keyboard('b')
    await sleep(300)
    expect(root.modelValue ?? null).toBeNull()
  })
})
