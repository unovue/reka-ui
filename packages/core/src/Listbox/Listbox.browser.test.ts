import type { Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { computed, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from '.'

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
          'onUpdate:modelValue': (value: string) => { selected.value = value },
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

interface FilteringListboxOptions {
  options?: string[]
  filterSelected?: boolean
  max?: number
  listbox?: Ref<{ highlightedElement: HTMLElement | null } | undefined>
  disabled?: string[]
  enableAlongside?: string[]
  disableAlongside?: string[]
  removeAlongside?: string[]
  preventSelection?: boolean
  focusOutsideOnUpdate?: boolean
  unmountOnUpdate?: boolean
  withFilter?: boolean
}

function mountFilteringListbox({
  options = ['Apple', 'Banana', 'Cherry', 'Orange'],
  filterSelected = true,
  max,
  listbox,
  disabled = [],
  enableAlongside = [],
  disableAlongside = [],
  removeAlongside = [],
  preventSelection = false,
  focusOutsideOnUpdate = false,
  unmountOnUpdate = false,
  withFilter = false,
}: FilteringListboxOptions = {}) {
  const allOptions = options
  const selected = ref<string[]>([])
  const mounted = ref(true)
  const disabledOptions = ref([...disabled])
  const shown = computed(() => {
    const removed = new Set(filterSelected ? selected.value : [])
    if (selected.value.length)
      removeAlongside.forEach(option => removed.add(option))
    return allOptions.filter(option => !removed.has(option))
  })
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        mounted.value
          ? h(ListboxRoot, {
              'multiple': true,
              max,
              'ref': listbox,
              'modelValue': selected.value,
              'onUpdate:modelValue': (value: string[]) => {
                selected.value = value
                if (selected.value.length) {
                  disabledOptions.value = disabledOptions.value
                    .filter(option => !enableAlongside.includes(option))
                  disabledOptions.value = [...new Set([...disabledOptions.value, ...disableAlongside])]
                }
                if (focusOutsideOnUpdate)
                  document.querySelector<HTMLElement>('[data-testid="after"]')?.focus()
                if (unmountOnUpdate)
                  mounted.value = false
              },
            }, () => [
              withFilter ? h(ListboxFilter, { 'data-testid': 'filter' }) : null,
              h(ListboxContent, { 'aria-label': 'Fruits', 'data-testid': 'filter-content' }, () => shown.value.map(option =>
                h(ListboxItem, {
                  key: option,
                  value: option,
                  disabled: disabledOptions.value.includes(option),
                  onSelect: (event: Event) => {
                    if (preventSelection)
                      event.preventDefault()
                  },
                }, () => option),
              )),
            ])
          : null,
        h('button', { 'data-testid': 'after' }, 'After'),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { selected, shown, mounted }
}

interface ObjectOption {
  id: number
  label: string
  revision: number
}

function mountObjectFilteringListbox() {
  const allOptions: ObjectOption[] = [
    { id: 1, label: 'Apple', revision: 0 },
    { id: 2, label: 'Banana', revision: 0 },
    { id: 3, label: 'Cherry', revision: 0 },
  ]
  const selected = ref<ObjectOption[]>([])
  const shown = computed(() => allOptions
    .filter(option => !selected.value.some(value => value.id === option.id))
    .map(option => ({ ...option, revision: selected.value.length })))
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        h(ListboxRoot, {
          'multiple': true,
          'by': 'id',
          'modelValue': selected.value,
          'onUpdate:modelValue': (value: ObjectOption[]) => { selected.value = value },
        }, () => h(ListboxContent, { 'aria-label': 'Fruits', 'data-testid': 'object-content' }, () => shown.value.map(option =>
          h(ListboxItem, { key: option.id, value: option }, () => option.label),
        ))),
        h('button', { 'data-testid': 'after' }, 'After'),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { selected, shown }
}

async function tabIntoFilteringListbox() {
  const before = document.querySelector<HTMLButtonElement>('[data-testid="before"]')!
  await userEvent.click(before)
  await userEvent.tab()
  expect(document.activeElement).toBe(option('Apple'))
}

async function focusFilteringOption(text: string) {
  await tabIntoFilteringListbox()
  for (let index = 0; index < 10 && document.activeElement !== option(text); index++)
    await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(option(text))
}

function expectFilteringFocus(text: string) {
  expect(document.activeElement).toBe(option(text))
  expect(highlighted()).toEqual([text])
  expect(tabStop()).toEqual([text])
}

describe('given a multiple Listbox whose selected item is filtered out', () => {
  it('moves focus to the next option after Space removes the focused selection', async () => {
    const { selected } = mountFilteringListbox()
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await settle()

    expect({
      active: document.activeElement === option('Banana')
        ? 'Banana'
        : document.activeElement?.tagName.toLowerCase(),
      highlighted: highlighted(),
      tabStop: tabStop(),
    }).toEqual({
      active: 'Banana',
      highlighted: ['Banana'],
      tabStop: ['Banana'],
    })

    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(option('Cherry'))
  })

  it('keeps focus on the selected item when it remains mounted', async () => {
    const { selected } = mountFilteringListbox({ filterSelected: false })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await settle()

    expect(document.activeElement).toBe(option('Apple'))
    expect(highlighted()).toEqual(['Apple'])
    expect(tabStop()).toEqual(['Apple'])
  })

  it('preserves highlight when max blocks a new selection', async () => {
    const listbox = ref<{ highlightedElement: HTMLElement | null }>()
    const { selected } = mountFilteringListbox({ filterSelected: false, max: 1, listbox })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await userEvent.click(option('Banana'))

    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => document.activeElement).toBe(option('Banana'))
    expect(listbox.value?.highlightedElement).toBe(option('Banana'))
    expectFilteringFocus('Banana')

    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(option('Cherry'))
    expect(listbox.value?.highlightedElement).toBe(option('Cherry'))
  })

  it('moves focus after Enter removes the focused item', async () => {
    const { selected } = mountFilteringListbox()
    await settle()
    await focusFilteringOption('Apple')

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Banana'))
    expectFilteringFocus('Banana')
  })

  it('moves focus after mouse selection removes the focused item', async () => {
    const { selected } = mountFilteringListbox()
    await settle()
    await focusFilteringOption('Apple')

    await userEvent.click(option('Apple'))
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Banana'))
    expectFilteringFocus('Banana')
  })

  it('uses the next surviving item when removing a middle item', async () => {
    const { selected } = mountFilteringListbox()
    await settle()
    await focusFilteringOption('Banana')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Banana'])
    await expect.poll(() => option('Banana')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Cherry'))
    expectFilteringFocus('Cherry')
  })

  it('uses the previous surviving item when removing the last item', async () => {
    const { selected } = mountFilteringListbox()
    await settle()
    await focusFilteringOption('Orange')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Orange'])
    await expect.poll(() => option('Orange')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Cherry'))
    expectFilteringFocus('Cherry')
  })

  it('skips disabled options during recovery', async () => {
    const { selected } = mountFilteringListbox({ disabled: ['Cherry'] })
    await settle()
    await focusFilteringOption('Banana')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Banana'])
    await expect.poll(() => option('Banana')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Orange'))
    expectFilteringFocus('Orange')
  })

  it('recovers to an option enabled during the selection update', async () => {
    const { selected } = mountFilteringListbox({ disabled: ['Banana'], enableAlongside: ['Banana'] })
    await settle()
    await focusFilteringOption('Apple')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => option('Banana')?.getAttribute('data-disabled')).toBeNull()
    await expect.poll(() => document.activeElement).toBe(option('Banana'))
    expectFilteringFocus('Banana')
  })

  it('does not focus an option disabled during the selection update', async () => {
    const { selected } = mountFilteringListbox({ disableAlongside: ['Banana'] })
    await settle()
    await focusFilteringOption('Apple')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => option('Banana')?.getAttribute('data-disabled')).toBe('')
    await expect.poll(() => document.activeElement).toBe(option('Cherry'))
    expectFilteringFocus('Cherry')
  })

  it('uses collection identity rather than a stale index when multiple options disappear', async () => {
    const { selected } = mountFilteringListbox({ removeAlongside: ['Apple'] })
    await settle()
    await focusFilteringOption('Banana')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Banana'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => option('Banana')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Cherry'))
    expectFilteringFocus('Cherry')
  })

  it('leaves an empty collection accessible without focusing its container', async () => {
    const { selected } = mountFilteringListbox({ options: ['Apple'] })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => document.querySelector('[role="option"]')).toBeNull()
    await settle()

    expect(document.activeElement).toBe(document.body)
    expect(highlighted()).toEqual([])
    expect(tabStop()).toEqual([])
    expect(document.querySelector('[data-testid="filter-content"]')).toHaveAttribute('tabindex', '0')
  })

  it('does not recover focus when selection is canceled', async () => {
    const { selected } = mountFilteringListbox({ preventSelection: true })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await settle()

    expect(selected.value).toEqual([])
    expectFilteringFocus('Apple')
  })

  it('does not steal focus intentionally moved outside during the update', async () => {
    const { selected } = mountFilteringListbox({ focusOutsideOnUpdate: true })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await settle()

    expect(document.activeElement).toBe(document.querySelector('[data-testid="after"]'))
    expect(highlighted()).toEqual([])
    expect(tabStop()).toEqual([])
  })

  it('does not steal callback-owned focus when selection starts outside the item', async () => {
    const { selected } = mountFilteringListbox({ focusOutsideOnUpdate: true })
    await settle()
    const before = document.querySelector<HTMLButtonElement>('[data-testid="before"]')!
    await userEvent.click(before)
    expect(document.activeElement).toBe(before)

    // HTMLElement.click() dispatches the real selection event without transferring focus
    // from the control that owns it.
    option('Apple').click()
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await settle()

    expect(document.activeElement).toBe(document.querySelector('[data-testid="after"]'))
    expect(highlighted()).toEqual([])
    expect(tabStop()).toEqual([])
  })

  it('does not recover focus after the Listbox unmounts during selection', async () => {
    const { selected, mounted } = mountFilteringListbox({ unmountOnUpdate: true })
    await settle()
    await tabIntoFilteringListbox()

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => mounted.value).toBe(false)
    await settle()

    expect(document.activeElement).toBe(document.body)
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })

  it('keeps ListboxFilter focus when Enter removes the highlighted item', async () => {
    const { selected } = mountFilteringListbox({ withFilter: true })
    await settle()
    const filter = document.querySelector<HTMLInputElement>('[data-testid="filter"]')!
    await userEvent.click(filter)
    await userEvent.fill(filter, 'a')
    await expect.poll(highlighted).toEqual(['Apple'])

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => selected.value).toEqual(['Apple'])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await settle()

    expect(document.activeElement).toBe(filter)
    expect(highlighted()).toEqual([])
    expect(tabStop()).toEqual([])
  })
})

describe('given object-valued options recreated after filtering', () => {
  it('recovers focus by the `by` key', async () => {
    const { selected } = mountObjectFilteringListbox()
    await settle()
    await focusFilteringOption('Apple')

    await userEvent.keyboard('{Space}')
    await expect.poll(() => selected.value.map(option => option.id)).toEqual([1])
    await expect.poll(() => option('Apple')).toBeUndefined()
    await expect.poll(() => document.activeElement).toBe(option('Banana'))
    expectFilteringFocus('Banana')
  })
})

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

  it.each([['non-virtual', false], ['virtual', true]])('%s: moves focus to the new item when the focused item is removed in the same update', async (_, virtual) => {
    const { selected, shown } = mountListbox({ keepFocusOnValueChange: true, virtual })
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
    const { selected } = mountListbox({ keepFocusOnValueChange: true, virtual: true, count: 200, disabled: ['Option 0'] })
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
    const { selected } = mountListbox({ keepFocusOnValueChange: true, virtual })
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

  it.each([[true], [undefined]])('moves focus to the first option when a virtual list is cleared with focus inside (keepFocusOnValueChange: %s)', async (keepFocusOnValueChange) => {
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
