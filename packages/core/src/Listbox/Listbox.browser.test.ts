import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'

const options = Array.from({ length: 30 }, (_, index) => `Option ${index}`)

function mountListbox({ keepFocusOnValueChange, virtual = false, belowFold = false }: { keepFocusOnValueChange?: boolean, virtual?: boolean, belowFold?: boolean } = {}) {
  const selected = ref<string>()
  const item = (option: string) => h(ListboxItem, { key: option, value: option, style: { height: '28px' } }, () => option)
  const Fixture = defineComponent({
    setup() {
      return () => [
        h('input', { 'data-testid': 'search', 'aria-label': 'Search' }),
        // Pushes the listbox below the fold, so scrolling it into view would move the page.
        belowFold ? h('div', { style: { height: '200vh' } }) : null,
        h(ListboxRoot, {
          keepFocusOnValueChange,
          'modelValue': selected.value,
          'onUpdate:modelValue': (value: string) => { selected.value = value },
        }, () => h(ListboxContent, { 'aria-label': 'Options', 'style': { height: '140px', overflow: 'auto' } }, () => virtual
          ? h(ListboxVirtualizer, { options, estimateSize: 28 }, { default: ({ option }: { option: string }) => item(option) })
          : options.map(item))),
      ]
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { selected }
}

async function settle() {
  await nextTick()
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
}

const input = () => document.querySelector<HTMLInputElement>('[data-testid="search"]')!
const option = (text: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(o => o.textContent === text)!
const highlighted = () => Array.from(document.querySelectorAll('[role="option"][data-highlighted]'), o => o.textContent)
const tabStop = () => Array.from(document.querySelectorAll('[role="option"][tabindex="0"]'), o => o.textContent)

async function focusInput() {
  await userEvent.click(input())
  expect(document.activeElement).toBe(input())
}

describe('given a Listbox whose value is set programmatically while focus is outside, in a real browser', () => {
  describe.each([['non-virtual', false], ['virtual', true]])('%s', (_, virtual) => {
    it('keeps focus on the input with `keepFocusOnValueChange`', async () => {
      const { selected } = mountListbox({ keepFocusOnValueChange: true, virtual })
      await settle()
      await focusInput()

      selected.value = 'Option 20'
      await expect.poll(highlighted).toEqual(['Option 20'])
      await settle()

      expect(document.activeElement).toBe(input())
      expect(tabStop()).toEqual(['Option 20'])
    })

    it('moves focus to the selected item by default', async () => {
      const { selected } = mountListbox({ virtual })
      await settle()
      await focusInput()

      selected.value = 'Option 20'
      await expect.poll(() => document.activeElement?.textContent).toBe('Option 20')
      expect(highlighted()).toEqual(['Option 20'])
    })
  })

  it('does not scroll the page to a listbox below the fold with `keepFocusOnValueChange`', async () => {
    const { selected } = mountListbox({ keepFocusOnValueChange: true, belowFold: true })
    await settle()
    await focusInput()
    window.scrollTo(0, 0)

    selected.value = 'Option 3'
    await expect.poll(highlighted).toEqual(['Option 3'])
    await settle()

    expect(window.scrollY).toBe(0)
    expect(document.activeElement).toBe(input())
  })

  it.each([[true], [undefined]])('moves focus to the new item when focus is already inside the listbox (keepFocusOnValueChange: %s)', async (keepFocusOnValueChange) => {
    const { selected } = mountListbox({ keepFocusOnValueChange })
    await settle()
    // Tab in rather than click, so no user selection is in flight when the value changes.
    await focusInput()
    await userEvent.tab()
    expect(document.activeElement).toBe(option('Option 0'))

    selected.value = 'Option 4'
    await expect.poll(() => document.activeElement?.textContent).toBe('Option 4')
    expect(highlighted()).toEqual(['Option 4'])
  })

  it('keeps keyboard navigation and selection working with `keepFocusOnValueChange`', async () => {
    const { selected } = mountListbox({ keepFocusOnValueChange: true })
    await settle()
    await focusInput()
    selected.value = 'Option 2'
    await expect.poll(highlighted).toEqual(['Option 2'])

    // Tab from the input lands on the highlighted item, the roving tab stop.
    await userEvent.tab()
    expect(document.activeElement).toBe(option('Option 2'))

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(option('Option 4'))
    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 4')

    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(option('Option 29'))
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(option('Option 0'))

    await userEvent.click(option('Option 7'))
    expect(selected.value).toBe('Option 7')
    expect(document.activeElement).toBe(option('Option 7'))
  })
})
