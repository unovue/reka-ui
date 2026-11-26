import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'

const options = Array.from({ length: 30 }, (_, index) => `Option ${index}`)

interface FixtureOptions {
  keepFocusOnValueChange?: boolean
  virtual?: boolean
  belowFold?: boolean
  count?: number
  disabled?: string[]
}

function mountListbox({ keepFocusOnValueChange, virtual = false, belowFold = false, count, disabled = [] }: FixtureOptions = {}) {
  const selected = ref<string>()
  const shown = shallowRef(count ? Array.from({ length: count }, (_, index) => `Option ${index}`) : options)
  const item = (option: string) => h(ListboxItem, { key: option, value: option, disabled: disabled.includes(option), style: { height: '28px' } }, () => option)
  const Fixture = defineComponent({
    setup() {
      return () => [
        h('input', { 'data-testid': 'search', 'aria-label': 'Search' }),
        // Pushes the listbox below the fold, so scrolling it into view would move the page.
        belowFold ? h('div', { style: { height: '200vh' } }) : null,
        h(ListboxRoot, {
          keepFocusOnValueChange,
          'modelValue': selected.value,
          'onUpdate:modelValue': (value: unknown) => { selected.value = value as string },
        }, () => h(ListboxContent, { 'aria-label': 'Options', 'data-testid': 'content', 'style': { height: '140px', overflow: 'auto' } }, () => virtual
          ? h(ListboxVirtualizer, { options: shown.value, estimateSize: 28 }, { default: ({ option }: { option: string }) => item(option) })
          : shown.value.map(item))),
      ]
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { selected, shown }
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
const content = () => document.querySelector<HTMLElement>('[data-testid="content"]')!
const tabStop = () => Array.from(document.querySelectorAll('[role="option"][tabindex="0"]'), o => o.textContent)

async function focusInput() {
  await userEvent.click(input())
  expect(document.activeElement).toBe(input())
}

describe('given a Listbox whose value is set programmatically while focus is outside, in a real browser', () => {
  describe.each([['non-virtual', false], ['virtual', true]])('%s', (_, virtual) => {
    it('keeps focus on the input by default', async () => {
      const { selected } = mountListbox({ virtual })
      await settle()
      await focusInput()

      selected.value = 'Option 20'
      await expect.poll(highlighted).toEqual(['Option 20'])
      await settle()

      expect(document.activeElement).toBe(input())
      expect(tabStop()).toEqual(['Option 20'])
    })

    it('moves focus to the selected item with `keepFocusOnValueChange: false`', async () => {
      const { selected } = mountListbox({ keepFocusOnValueChange: false, virtual })
      await settle()
      await focusInput()

      selected.value = 'Option 20'
      await expect.poll(() => document.activeElement?.textContent).toBe('Option 20')
      expect(highlighted()).toEqual(['Option 20'])
    })
  })

  it('does not scroll the page to a listbox below the fold by default', async () => {
    const { selected } = mountListbox({ belowFold: true })
    await settle()
    await focusInput()
    window.scrollTo(0, 0)

    selected.value = 'Option 3'
    await expect.poll(highlighted).toEqual(['Option 3'])
    await settle()

    expect(window.scrollY).toBe(0)
    expect(document.activeElement).toBe(input())
  })

  it.each([[undefined], [false]])('moves focus to the new item when focus is already inside the listbox (keepFocusOnValueChange: %s)', async (keepFocusOnValueChange) => {
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

  it('keeps keyboard navigation and selection working by default', async () => {
    const { selected } = mountListbox()
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

  it.each([['non-virtual', false], ['virtual', true]])('%s: moves focus to the new item when the focused item is removed in the same update', async (_, virtual) => {
    const { selected, shown } = mountListbox({ virtual })
    await settle()
    await focusInput()
    await userEvent.tab()
    expect(document.activeElement).toBe(option('Option 0'))

    // The update that changes the value also removes the focused item, so focus falls back to
    // the body before the highlight runs. Focus was inside the listbox when the value changed.
    shown.value = options.slice(1)
    selected.value = 'Option 4'
    await expect.poll(() => document.activeElement?.textContent).toBe('Option 4')
    expect(highlighted()).toEqual(['Option 4'])
  })

  it('highlights the first enabled option of the full list when a virtual list is cleared, without moving focus', async () => {
    const { selected } = mountListbox({ virtual: true, count: 200, disabled: ['Option 0'] })
    await settle()
    await focusInput()

    // Two jumps, so the rows near the start that kept the mount highlight are unmounted.
    selected.value = 'Option 150'
    await expect.poll(highlighted).toEqual(['Option 150'])
    await settle()
    selected.value = 'Option 100'
    await expect.poll(highlighted).toEqual(['Option 100'])
    await settle()
    expect(option('Option 1')).toBeUndefined()

    selected.value = undefined
    await expect.poll(highlighted).toEqual(['Option 1'])
    await settle()

    expect(document.activeElement).toBe(input())
    expect(tabStop()).toEqual(['Option 1'])
    expect(window.scrollY).toBe(0)
  })

  it.each([['non-virtual', false], ['virtual', true]])('%s: a later change made after focus leaves supersedes an earlier pending highlight', async (_, virtual) => {
    const { selected } = mountListbox({ virtual })
    await settle()
    await focusInput()
    await userEvent.tab()
    expect(document.activeElement).toBe(option('Option 0'))

    // The first change is made with focus inside, so its highlight would focus the item.
    // Focus leaves before that highlight has run, and the second change must win.
    selected.value = 'Option 4'
    await nextTick()
    input().focus()
    selected.value = 'Option 8'
    await expect.poll(highlighted).toEqual(['Option 8'])
    await settle()

    expect(document.activeElement).toBe(input())
    expect(tabStop()).toEqual(['Option 8'])
  })

  it.each([[undefined], [false]])('moves focus to the first option when a virtual list is cleared with focus inside (keepFocusOnValueChange: %s)', async (keepFocusOnValueChange) => {
    const { selected } = mountListbox({ keepFocusOnValueChange, virtual: true, count: 200 })
    await settle()
    await focusInput()
    await userEvent.tab()

    selected.value = 'Option 150'
    await expect.poll(() => document.activeElement?.textContent).toBe('Option 150')
    await settle()

    selected.value = undefined
    await expect.poll(() => document.activeElement?.textContent).toBe('Option 0')
    expect(highlighted()).toEqual(['Option 0'])
  })
})
