import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from '.'

const ROW_HEIGHT = 28
const options = Array.from({ length: 420 }, (_, index) => `Option ${index}`)

function mountCombobox(listHeight: number, value?: string) {
  const height = ref(listHeight)
  const Fixture = defineComponent({
    setup() {
      return () => h(ComboboxRoot, { defaultValue: value, open: true }, () => [
        h(ComboboxAnchor, null, () => h(ComboboxInput)),
        h(ComboboxContent, null, () => h(ComboboxViewport, {
          'data-testid': 'viewport',
          'style': { maxHeight: `${height.value}px` },
        }, () => h(ComboboxVirtualizer, { options, estimateSize: ROW_HEIGHT }, {
          default: ({ option }: { option: string }) => h(ComboboxItem, { value: option, style: { height: `${ROW_HEIGHT}px` } }, () => option),
        }))),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { height }
}

const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!
const viewport = () => document.querySelector<HTMLElement>('[data-testid="viewport"]')!
const renderedIndexes = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'), row => Number(row.dataset.index))

function highlightedOption() {
  const id = input().getAttribute('aria-activedescendant')
  return id ? document.getElementById(id) : null
}

describe('given a virtualized Combobox, in a real browser', () => {
  // jsdom has no layout, so the rows that leave the rendered window can only be observed here.
  it('keeps the highlighted option mounted when the list gets shorter', async () => {
    // Tall enough to render every row, as a list is until Popper sets its available height.
    const { height } = mountCombobox(options.length * ROW_HEIGHT, 'Option 300')
    await expect.poll(() => highlightedOption()?.textContent).toBe('Option 300')

    height.value = 280
    await expect.poll(() => renderedIndexes().length).toBeLessThan(100)

    expect(highlightedOption()?.textContent).toBe('Option 300')
    expect(highlightedOption()?.hasAttribute('data-highlighted')).toBe(true)
  })

  it('keeps the highlighted option mounted, and moves on from it, when the list scrolls away', async () => {
    mountCombobox(280)
    await userEvent.click(input())
    await expect.poll(() => highlightedOption()?.textContent).toBe('Option 0')
    await userEvent.keyboard('{ArrowDown}'.repeat(5))
    await expect.poll(() => highlightedOption()?.textContent).toBe('Option 5')

    viewport().scrollTop = 5000
    await expect.poll(renderedIndexes).toContain(190)

    expect(highlightedOption()?.textContent).toBe('Option 5')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => highlightedOption()?.textContent).toBe('Option 6')
  })
})
