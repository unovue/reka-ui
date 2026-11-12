import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, reactive, ref, shallowRef } from 'vue'
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

type Option = string | { id: number, label: string }

function mountOptionsCombobox(initial: Option[], rootProps: Record<string, unknown> = {}) {
  const shown = shallowRef(initial)
  const selected = ref<Option>()
  const label = (option: Option) => typeof option === 'string' ? option : option.label
  const Fixture = defineComponent({
    setup() {
      return () => h(ComboboxRoot, {
        'open': true,
        'ignoreFilter': true,
        'modelValue': selected.value,
        'onUpdate:modelValue': (value: Option) => { selected.value = value },
        ...rootProps,
      }, () => [
        h(ComboboxAnchor, null, () => h(ComboboxInput)),
        h(ComboboxContent, null, () => h(ComboboxViewport, {
          'data-testid': 'viewport',
          'style': { maxHeight: '280px' },
        }, () => h(ComboboxVirtualizer, { options: shown.value, estimateSize: ROW_HEIGHT }, {
          default: ({ option }: { option: Option }) => h(ComboboxItem, { value: option, style: { height: `${ROW_HEIGHT}px` } }, () => label(option)),
        }))),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { shown, selected }
}

async function settle() {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
}

// What assistive technology is told, and what the user sees.
function highlight() {
  const id = input().getAttribute('aria-activedescendant')
  return {
    activedescendant: id ? document.getElementById(id)?.textContent ?? 'not in the document' : null,
    highlighted: Array.from(document.querySelectorAll('[data-highlighted]'), row => row.textContent),
  }
}

async function highlightWithArrowDown(text: string, presses: number) {
  await userEvent.click(input())
  await expect.poll(() => highlightedOption()?.textContent).toBeTruthy()
  await userEvent.keyboard('{ArrowDown}'.repeat(presses))
  await expect.poll(() => highlightedOption()?.textContent).toBe(text)
}

describe('given a virtualized Combobox whose options change, in a real browser', () => {
  it('keeps the highlight on its option when options before it are removed', async () => {
    const { shown, selected } = mountOptionsCombobox(['A', 'B', 'C'])
    await highlightWithArrowDown('B', 1)

    shown.value = ['B', 'C']
    await settle()
    expect(highlight()).toEqual({ activedescendant: 'B', highlighted: ['B'] })

    shown.value = ['B']
    await settle()
    expect(highlight()).toEqual({ activedescendant: 'B', highlighted: ['B'] })

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('B')
  })

  it('keeps the highlight on its option when an option is inserted before it', async () => {
    const { shown, selected } = mountOptionsCombobox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = ['New', ...options]
    await settle()
    expect(highlight()).toEqual({ activedescendant: 'Option 5', highlighted: ['Option 5'] })

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })

  it('keeps the highlight on its option when the parent removes an option in place', async () => {
    const { shown, selected } = mountOptionsCombobox(reactive(options.slice()))
    await highlightWithArrowDown('Option 5', 5)

    shown.value.splice(2, 1)
    await settle()
    expect(highlight()).toEqual({ activedescendant: 'Option 5', highlighted: ['Option 5'] })

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })

  it('keeps the highlight on its option, mounted, when the list is sorted the other way', async () => {
    const { shown, selected } = mountOptionsCombobox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.toReversed()
    await settle()
    expect(renderedIndexes()).not.toContain(200)
    expect(highlight()).toEqual({ activedescendant: 'Option 5', highlighted: ['Option 5'] })
    expect(highlightedOption()?.dataset.index).toBe('414')

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })

  it('moves on from the new position of the highlighted option', async () => {
    const { shown } = mountOptionsCombobox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.slice(3)
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => highlight()).toEqual({ activedescendant: 'Option 6', highlighted: ['Option 6'] })
  })

  it('follows object options by the `by` key when the parent replaces them with new objects', async () => {
    const items = Array.from({ length: 50 }, (_, id) => ({ id, label: `Item ${id}` }))
    const { shown, selected } = mountOptionsCombobox(items, { by: 'id' })
    await highlightWithArrowDown('Item 5', 5)

    shown.value = items.slice(2).map(item => ({ id: item.id, label: `${item.label} (updated)` }))
    await settle()
    expect(highlight()).toEqual({ activedescendant: 'Item 5 (updated)', highlighted: ['Item 5 (updated)'] })

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toEqual({ id: 5, label: 'Item 5 (updated)' })
  })

  it('releases the highlight when its option is removed', async () => {
    const { shown, selected } = mountOptionsCombobox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.filter(option => option !== 'Option 5')
    await settle()
    expect(highlight()).toEqual({ activedescendant: null, highlighted: [] })

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBeUndefined()
  })

  describe('while the highlighted row is kept mounted out of view', () => {
    async function highlightThenScrollAway() {
      const fixture = mountOptionsCombobox(options)
      await highlightWithArrowDown('Option 5', 5)
      viewport().scrollTop = 5000
      await expect.poll(renderedIndexes).toContain(190)
      expect(highlight()).toEqual({ activedescendant: 'Option 5', highlighted: ['Option 5'] })
      return fixture
    }

    it('keeps the highlight on its option when the options are replaced', async () => {
      const { shown, selected } = await highlightThenScrollAway()

      shown.value = options.slice(3)
      await settle()
      expect(highlight()).toEqual({ activedescendant: 'Option 5', highlighted: ['Option 5'] })

      await userEvent.keyboard('{Enter}')
      expect(selected.value).toBe('Option 5')
    })

    it('releases the highlight when the replaced options no longer have its option', async () => {
      const { shown, selected } = await highlightThenScrollAway()

      shown.value = options.slice(100)
      await settle()
      expect(highlight()).toEqual({ activedescendant: null, highlighted: [] })

      await userEvent.keyboard('{Enter}')
      expect(selected.value).toBeUndefined()
    })
  })
})
