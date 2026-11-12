import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'

const ROW_HEIGHT = 28
const options = Array.from({ length: 420 }, (_, index) => `Option ${index}`)

function mountListbox(initial: string[]) {
  const shown = shallowRef(initial)
  const selected = ref<string>()
  const Fixture = defineComponent({
    setup() {
      return () => h(ListboxRoot, {
        'modelValue': selected.value,
        'onUpdate:modelValue': (value: string) => { selected.value = value },
      }, () => h(ListboxContent, {
        'data-testid': 'content',
        'style': { height: '280px', overflow: 'auto' },
      }, () => h(ListboxVirtualizer, { options: shown.value, estimateSize: ROW_HEIGHT }, {
        default: ({ option }: { option: string }) => h(ListboxItem, { value: option, style: { height: `${ROW_HEIGHT}px` } }, () => option),
      })))
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

const content = () => document.querySelector<HTMLElement>('[data-testid="content"]')!
const renderedIndexes = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'), option => Number(option.dataset.index))

// The highlighted row is the one that has the focus and the tab stop.
function highlight() {
  return {
    highlighted: Array.from(document.querySelectorAll('[data-highlighted]'), option => option.textContent),
    focused: document.activeElement?.getAttribute('role') === 'option' ? document.activeElement.textContent : null,
    tabStop: Array.from(document.querySelectorAll('[role="option"][tabindex="0"]'), option => option.textContent),
  }
}

async function highlightWithArrowDown(text: string, presses: number) {
  // The first option has the tab stop once the list is mounted. A click would select it.
  await expect.poll(() => highlight().tabStop).toEqual(['Option 0'])
  await userEvent.tab()
  await userEvent.keyboard('{ArrowDown}'.repeat(presses))
  await expect.poll(() => highlight().focused).toBe(text)
}

const on = (text: string) => ({ highlighted: [text], focused: text, tabStop: [text] })

describe('given a virtualized Listbox whose options change, in a real browser', () => {
  it('keeps the highlight and the focus on its option when options before it are removed', async () => {
    const { shown, selected } = mountListbox(['Option 0', 'B', 'C'])
    await highlightWithArrowDown('B', 1)

    shown.value = ['B', 'C']
    await settle()
    expect(highlight()).toEqual(on('B'))

    shown.value = ['B']
    await settle()
    expect(highlight()).toEqual(on('B'))

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('B')
  })

  it('keeps the highlight and the focus on its option when an option is inserted before it', async () => {
    const { shown, selected } = mountListbox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = ['New', ...options]
    await settle()
    expect(highlight()).toEqual(on('Option 5'))

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })

  it('keeps the highlight and the focus on its option, without scrolling, when the list is sorted the other way', async () => {
    const { shown, selected } = mountListbox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.toReversed()
    await settle()
    expect(renderedIndexes()).not.toContain(200)
    expect(highlight()).toEqual(on('Option 5'))
    expect(content().scrollTop).toBe(0)

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })

  it('moves on from the new position of the highlighted option', async () => {
    const { shown } = mountListbox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.slice(3)
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => highlight()).toEqual(on('Option 6'))
  })

  it('releases the highlight when its option is removed', async () => {
    const { shown, selected } = mountListbox(options)
    await highlightWithArrowDown('Option 5', 5)

    shown.value = options.filter(option => option !== 'Option 5')
    await settle()
    expect(highlight().highlighted).toEqual([])
    expect(highlight().tabStop).toEqual([])

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBeUndefined()
  })

  it.each([
    { order: 'before', focusFirst: true },
    { order: 'after', focusFirst: false },
  ])('does not restore the highlight when the focus leaves the list $order the options change, in the same tick', async ({ focusFirst }) => {
    const outside = document.createElement('button')
    try {
      const { shown } = mountListbox(options)
      document.body.append(outside)
      await highlightWithArrowDown('Option 5', 5)

      if (focusFirst)
        outside.focus()
      shown.value = options.slice(3)
      if (!focusFirst)
        outside.focus()
      await settle()

      expect(document.activeElement).toBe(outside)
      expect(highlight()).toEqual({ highlighted: [], focused: null, tabStop: [] })
    }
    finally {
      outside.remove()
    }
  })

  it('keeps the highlight on its option when the options are replaced while its row is out of view', async () => {
    const { shown, selected } = mountListbox(options)
    await highlightWithArrowDown('Option 5', 5)
    content().scrollTop = 5000
    await expect.poll(renderedIndexes).toContain(190)
    expect(highlight()).toEqual(on('Option 5'))

    shown.value = options.slice(3)
    await settle()
    expect(highlight()).toEqual(on('Option 5'))

    await userEvent.keyboard('{Enter}')
    expect(selected.value).toBe('Option 5')
  })
})
