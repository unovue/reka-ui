import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

// Counts the comparisons the Select makes. The counter lives on `globalThis`: the factory is
// hoisted above everything else in this file.
vi.mock('./utils', async (importOriginal) => {
  const utils = await importOriginal<typeof import('./utils')>()
  const counter = globalThis as { selectComparisons?: number }
  counter.selectComparisons = 0
  return {
    ...utils,
    valueComparator: (...args: Parameters<typeof utils.valueComparator>) => {
      counter.selectComparisons!++
      return utils.valueComparator(...args)
    },
  }
})

const counter = globalThis as { selectComparisons?: number }

function mountSelect(setup: () => Record<string, unknown>, items: string, root = '') {
  return mount(defineComponent({
    components: { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport },
    setup,
    template: `
      <form>
        <SelectRoot name="option" ${root}>
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectViewport>${items}</SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </form>`,
  }), { attachTo: document.body })
}

function nativeOptions() {
  return Array.from(document.querySelectorAll('select option')).map(option => [(option as HTMLOptionElement).value, option.textContent])
}

describe('given a Select with many options', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should register each option without comparing it to every other option', async () => {
    const count = 300
    const options = Array.from({ length: count }, (_, index) => `Option ${index + 1}`)
    counter.selectComparisons = 0
    const wrapper = mountSelect(
      () => ({ options }),
      `<SelectItem v-for="option in options" :key="option" :value="option"><SelectItemText>{{ option }}</SelectItemText></SelectItem>`,
    )
    await nextTick()
    await nextTick()

    expect(nativeOptions()).toHaveLength(count + 1)
    // A scan of the registered options per item took count² / 2 comparisons (45,000 here)
    expect(counter.selectComparisons).toBeLessThan(count * 10)

    counter.selectComparisons = 0
    wrapper.unmount()
    expect(counter.selectComparisons).toBeLessThan(count * 10)
  })
})

describe('given Select items that share a value', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // TODO(v3-port): #3391 native options keyed by value, one per value in registration order (Select option registry resolved to v3)
  it.skip('should keep one option per value, the last one registered', async () => {
    const wrapper = mountSelect(
      () => ({}),
      `<SelectItem value="a"><SelectItemText>First</SelectItemText></SelectItem>
       <SelectItem value="b"><SelectItemText>Other</SelectItemText></SelectItem>
       <SelectItem value="a"><SelectItemText>Second</SelectItemText></SelectItem>`,
      'default-value="a"',
    )
    await nextTick()
    await nextTick()

    expect(nativeOptions()).toEqual([['b', 'Other'], ['a', 'Second']])
    expect(wrapper.find('[role=combobox]').text()).toBe('Second')
  })

  // TODO(v3-port): #3391 native options keyed by value, one per value in registration order (Select option registry resolved to v3)
  it.skip.each([
    ['numbers', [1, 2, 1], [['2', 'Item 2'], ['1', 'Item 1']]],
    ['booleans', [true, false, true], [['false', 'Item false'], ['true', 'Item true']]],
    ['a number and its string form', [1, '1'], [['1', 'Item 1'], ['1', 'Item 1']]],
  ])('should tell %s apart as the comparator does', async (_, values, expected) => {
    mountSelect(
      () => ({ values }),
      `<SelectItem v-for="(value, index) in values" :key="index" :value="value"><SelectItemText>Item {{ value }}</SelectItemText></SelectItem>`,
    )
    await nextTick()
    await nextTick()

    expect(nativeOptions().slice(1)).toEqual(expected)
  })

  // TODO(v3-port): #3391 native options keyed by value, one per value in registration order (Select option registry resolved to v3)
  it.skip('should match object values through `by`', async () => {
    mountSelect(
      () => ({ values: [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }, { id: 1, name: 'Uno' }] }),
      `<SelectItem v-for="(value, index) in values" :key="index" :value="value"><SelectItemText>{{ value.name }}</SelectItemText></SelectItem>`,
      'by="id"',
    )
    await nextTick()
    await nextTick()

    expect(nativeOptions().slice(1).map(option => option[1])).toEqual(['Two', 'Uno'])
  })
})

describe('given Select items that mount and unmount', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // TODO(v3-port): #3391 native options keyed by value, one per value in registration order (Select option registry resolved to v3)
  it.skip('should add and remove their options', async () => {
    const values = ref(['a', 'b', 'c'])
    const wrapper = mountSelect(
      () => ({ values }),
      `<SelectItem v-for="value in values" :key="value" :value="value"><SelectItemText>Item {{ value }}</SelectItemText></SelectItem>`,
      'default-value="b"',
    )
    await nextTick()
    await nextTick()
    expect(nativeOptions()).toEqual([['a', 'Item a'], ['b', 'Item b'], ['c', 'Item c']])
    expect(wrapper.find('[role=combobox]').text()).toBe('Item b')

    values.value = ['a', 'c', 'd']
    await nextTick()
    await nextTick()
    expect(nativeOptions()).toEqual([['a', 'Item a'], ['c', 'Item c'], ['d', 'Item d']])
    expect(wrapper.find('[role=combobox]').text()).toBe('Pick')

    values.value = ['d', 'b']
    await nextTick()
    await nextTick()
    expect(nativeOptions()).toEqual([['d', 'Item d'], ['b', 'Item b']])
    expect(wrapper.find('[role=combobox]').text()).toBe('Item b')
  })
})
