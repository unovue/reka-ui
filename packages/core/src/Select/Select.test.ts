import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { handleSubmit } from '@/test'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'
import SelectUnmountCleanup from './__test__/SelectUnmountCleanup.vue'
import Select from './story/_SelectTest.vue'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('given default Select', () => {
  let wrapper: VueWrapper<InstanceType<typeof Select>>
  let valueBox: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Select, { attachTo: document.body })
    valueBox = wrapper.find('[aria-label="Customise options"]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should show placeholder', () => {
    expect(valueBox.html()).toContain('Please select a fruit')
    const selectTrigger = wrapper.find('[role="combobox"]')
    expect(selectTrigger.attributes('data-placeholder')).toBe('')
  })

  it('should only render aria-controls while open', async () => {
    const trigger = wrapper.find('[role="combobox"]')
    expect(trigger.attributes('aria-controls')).toBeUndefined()

    await fireEvent.pointerDown(trigger.element, { button: 0, ctrlKey: false })
    await nextTick()

    expect(document.getElementById(trigger.attributes('aria-controls')!)).not.toBeNull()
  })

  describe('trigger mouse interop', () => {
    async function openSelectWithMouseClick() {
      const button = wrapper.find('button')
      // Open on pointerdown, then emit the compatibility mouse events that follow in browsers.
      await fireEvent.pointerDown(button.element, { button: 0, ctrlKey: false })
      fireEvent.mouseDown(button.element, { button: 0, ctrlKey: false })
      fireEvent.mouseUp(button.element, { button: 0, ctrlKey: false })
      fireEvent.click(button.element, { button: 0, ctrlKey: false })
      await nextTick()
      await nextTick()
    }

    it('should not suppress window mousedown listeners when opening (#1773)', async () => {
      const button = wrapper.find('button').element
      const onWindowMousedown = vi.fn()
      window.addEventListener('mousedown', onWindowMousedown, true)

      fireEvent.pointerDown(button, { button: 0, ctrlKey: false, pointerType: 'mouse' })
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        ctrlKey: false,
      })
      button.dispatchEvent(mousedownEvent)

      expect(onWindowMousedown).toHaveBeenCalled()
      expect(mousedownEvent.defaultPrevented).toBe(true)

      window.removeEventListener('mousedown', onWindowMousedown, true)
    })

    it('should focus the trigger on click without a preceding pointerdown', async () => {
      const trigger = wrapper.find('[role="combobox"]').element as HTMLElement
      const focusSpy = vi.spyOn(trigger, 'focus')

      fireEvent.click(trigger, { button: 0, ctrlKey: false })

      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should not re-focus the trigger on click after opening via pointerdown', async () => {
      const trigger = wrapper.find('[role="combobox"]').element as HTMLElement
      const focusSpy = vi.spyOn(trigger, 'focus')

      await fireEvent.pointerDown(wrapper.find('button').element, { button: 0, ctrlKey: false })
      fireEvent.click(trigger, { button: 0, ctrlKey: false })

      expect(focusSpy).not.toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('should not leave focus on the trigger after opening via mouse click', async () => {
      const trigger = wrapper.find('[role="combobox"]').element

      await openSelectWithMouseClick()

      expect(wrapper.html()).toContain('Apple')
      expect(document.activeElement).not.toBe(trigger)
    })
  })

  describe('opening the modal', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
    })

    it('should pass axe accessibility tests', async () => {
      // We have hidden children such as icon, thus disabling this
      expect(await axe(wrapper.element, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      })).toHaveNoViolations()
    })

    it('should show the modal content', () => {
      expect(wrapper.html()).toContain('Apple')
    })

    it('should select the focused item with Space', async () => {
      const selection = wrapper.findAll('[role=option]')[1]
      ;(selection.element as HTMLElement).focus()
      await selection.trigger('keydown', { key: ' ', code: 'Space' })
      await nextTick()

      expect(valueBox.html()).toContain('Banana')
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = wrapper.findAll('[role=option]')[1];
        (selection.element as HTMLElement).focus()
        await selection.trigger('pointerup')
        // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
        await fireEvent.pointerUp(selection.element)
      })

      it('should show value correctly', () => {
        expect(valueBox.html()).toContain('Banana')
      })

      it('should close the modal', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeFalsy()
      })

      describe('after opening the modal again', () => {
        beforeEach(async () => {
          await fireEvent.pointerDown(wrapper.find('button').element, {
            button: 0,
            ctrlKey: false,
          })
          await nextTick()
        })

        it('should focus on the selected value', () => {
          const selection = wrapper.findAll('[role=option]')[1]
          expect(selection.attributes('data-state')).toBe('checked')
        })

        it('should render the icon', () => {
          const selection = wrapper.findAll('[role=option]')[1]
          expect(selection.html()).toContain('svg')
        })
      })
    })
  })
})

describe('given Select with multiple props', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Select>>
  let valueBox: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Select, { attachTo: document.body, props: { multiple: true } })
    valueBox = wrapper.find('[aria-label="Customise options"]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('opening the modal', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
    })

    it('should pass axe accessibility tests', async () => {
      // We have hidden children such as icon, thus disabling this
      expect(await axe(wrapper.element, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      })).toHaveNoViolations()
    })

    it('should show the modal content', () => {
      expect(wrapper.html()).toContain('Apple')
    })

    it('should toggle the focused item with Space', async () => {
      const selection = wrapper.findAll('[role=option]')[1]
      ;(selection.element as HTMLElement).focus()
      await selection.trigger('keydown', { key: ' ', code: 'Space' })
      await nextTick()

      expect(valueBox.html()).toContain('Banana')
      expect(selection.attributes('data-state')).toBe('checked')
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = wrapper.findAll('[role=option]')[1];
        (selection.element as HTMLElement).focus()
        await selection.trigger('pointerup')
        // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
        await fireEvent.pointerUp(selection.element)
      })

      it('should show value correctly', () => {
        expect(valueBox.html()).toContain('Banana')
      })

      it('should close the modal', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeTruthy()
      })

      describe('after opening the modal again', () => {
        beforeEach(async () => {
          await fireEvent.pointerDown(wrapper.find('button').element, {
            button: 0,
            ctrlKey: false,
          })
          await nextTick()
        })

        it('should focus on the selected value', () => {
          const selection = wrapper.findAll('[role=option]')[1]
          expect(selection.attributes('data-state')).toBe('checked')
        })

        it('should render the icon', () => {
          const selection = wrapper.findAll('[role=option]')[1]
          expect(selection.html()).toContain('svg')
        })

        describe('after selecting another value', () => {
          beforeEach(async () => {
            const selection = wrapper.findAll('[role=option]')[2];
            (selection.element as HTMLElement).focus()
            await selection.trigger('pointerup')
            // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
            await fireEvent.pointerUp(selection.element)
          })

          it('should show value correctly', () => {
            expect(valueBox.html()).toContain('Banana')
            expect(valueBox.html()).toContain('Blueberry')
          })

          it('should not close the modal', () => {
            const group = wrapper.find('[role=group]')
            expect(group.exists()).toBeTruthy()
          })
        })

        describe('after unselecting the value', () => {
          it('should have data placeholder attribute', async () => {
            const selection = wrapper.findAll('[role=option]')[1];
            (selection.element as HTMLElement).focus()
            await selection.trigger('pointerup')
            // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
            await fireEvent.pointerUp(selection.element)

            const trigger = wrapper.find('[role="combobox"]')
            expect(trigger.attributes('data-placeholder')).toBe('')
          })
        })
      })
    })
  })
})

describe('given Select with object type', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Select>>
  let valueBox: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Select, { attachTo: document.body, props: { options: ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple'].map(i => ({ label: i, value: i.toLowerCase() })) } })
    valueBox = wrapper.find('[aria-label="Customise options"]')
  })

  describe('opening the modal', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = wrapper.findAll('[role=option]')[1];
        (selection.element as HTMLElement).focus()
        await selection.trigger('pointerup')
        // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
        await fireEvent.pointerUp(selection.element)
      })

      it('should show value correctly', () => {
        expect(valueBox.html()).toContain('banana')
        expect(valueBox.html()).toContain('Banana')
      })

      it('should close the modal', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeFalsy()
      })
    })
  })
})

describe('given Select with options containing spaces', () => {
  let wrapper: VueWrapper<InstanceType<typeof Select>>

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Select, { attachTo: document.body, props: { options: ['New York', 'Newark', 'New Jersey'] } })
    await fireEvent.pointerDown(wrapper.find('button').element, {
      button: 0,
      ctrlKey: false,
    })
    await nextTick()
  })

  it('should include Space in the typeahead search once typing has started', async () => {
    (wrapper.findAll('[role=option]')[0].element as HTMLElement).focus()

    for (const [key, code] of [['n', 'KeyN'], ['e', 'KeyE'], ['w', 'KeyW'], [' ', 'Space'], ['j', 'KeyJ']]) {
      await fireEvent.keyDown(document.activeElement!, { key, code })
      await nextTick()
    }

    expect(document.activeElement?.textContent).toContain('New Jersey')
  })

  it('should prevent scrolling when Space extends the typeahead search', async () => {
    (wrapper.findAll('[role=option]')[0].element as HTMLElement).focus()
    await fireEvent.keyDown(document.activeElement!, { key: 'n', code: 'KeyN' })
    await nextTick()

    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true })
    document.activeElement!.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })
})

describe('given typing on a Select trigger', () => {
  async function mountSelect<T>(options: T[], { initialValue, label = String, withItemText = true, rootProps = {}, triggerProps = {}, itemProps = () => ({}) }: {
    initialValue?: T
    label?: (option: T) => string
    withItemText?: boolean
    rootProps?: Record<string, unknown>
    triggerProps?: Record<string, unknown>
    itemProps?: (option: T) => Record<string, unknown>
  } = {}) {
    // A shallow ref keeps object values unproxied, so their identity can be asserted.
    const modelValue = shallowRef<T | undefined>(initialValue)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(SelectRoot, { ...rootProps, 'modelValue': modelValue.value, 'onUpdate:modelValue': (value: T) => { modelValue.value = value } }, () => [
          h(SelectTrigger, triggerProps, () => h(SelectValue)),
          h(SelectContent, () => h(SelectViewport, () => options.map(option =>
            h(SelectItem, { value: option, ...itemProps(option) }, () => withItemText ? h(SelectItemText, () => label(option)) : label(option)),
          ))),
        ])
      },
    }), { attachTo: document.body })
    await nextTick()
    const trigger = wrapper.find('[role="combobox"]').element as HTMLElement
    trigger.focus()
    return { modelValue, trigger }
  }

  async function type(element: HTMLElement, ...keys: string[]) {
    for (const key of keys) {
      await fireEvent.keyDown(element, { key })
      await nextTick()
    }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should select the item matching the typed characters without opening', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana', 'Blueberry'])
    await type(trigger, 'b', 'l')
    expect(modelValue.value).toBe('Blueberry')
    expect(trigger.textContent).toContain('Blueberry')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('should cycle through items that start with a repeated letter', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana', 'Blueberry'])
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Banana')
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Blueberry')
  })

  it('should still select after the content has been opened and closed', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Pineapple'])
    await fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })
    await nextTick()
    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
    trigger.focus()
    await type(trigger, 'p')
    expect(modelValue.value).toBe('Pineapple')
  })

  it('should skip disabled items', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana', 'Blueberry'], { itemProps: option => ({ disabled: option === 'Banana' }) })
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Blueberry')
  })

  it('should emit the item\'s own object value to a controlled Select', async () => {
    const options = [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }]
    const { modelValue, trigger } = await mountSelect(options, { initialValue: options[0], label: option => option.name, rootProps: { by: 'id' } })
    await type(trigger, 'b')
    expect(modelValue.value).toBe(options[1])
  })

  it('should cycle through items with the same text', async () => {
    const options = [{ id: 1, name: 'Main St' }, { id: 2, name: 'Main St' }]
    const { modelValue, trigger } = await mountSelect(options, { initialValue: options[0], label: option => option.name, rootProps: { by: 'id' } })
    await type(trigger, 'm')
    expect(modelValue.value).toBe(options[1])
  })

  it('should match an item\'s text content when it has no `SelectItemText`', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { withItemText: false })
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Banana')
  })

  it('should not emit `update:open` when selecting while closed', async () => {
    const onUpdateOpen = vi.fn()
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { rootProps: { 'open': false, 'onUpdate:open': onUpdateOpen } })
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Banana')
    expect(onUpdateOpen).not.toHaveBeenCalled()
  })

  it('should not select when the Select is disabled', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { rootProps: { disabled: true }, triggerProps: { as: 'div', tabindex: 0 } })
    await type(trigger, 'b')
    expect(modelValue.value).toBeUndefined()
  })

  it('should not select when the Select is `multiple`', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { rootProps: { multiple: true } })
    await type(trigger, 'b')
    expect(modelValue.value).toBeUndefined()
  })

  it('should focus the match without selecting it while open', async () => {
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { rootProps: { open: true } })
    await new Promise(resolve => setTimeout(resolve))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await type(trigger, 'b')
    expect(document.activeElement?.textContent).toContain('Banana')
    expect(modelValue.value).toBeUndefined()
  })
})

describe('given SelectContent cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should clear delayed presence updates when unmounted after closing', async () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const wrapper = mount(SelectUnmountCleanup, { attachTo: document.body })

    await nextTick()
    await wrapper.find('button').trigger('click')
    await nextTick()

    const timerCountAfterClose = vi.getTimerCount()
    expect(timerCountAfterClose).toBeGreaterThan(0)

    await wrapper.findAll('button')[1].trigger('click')
    await nextTick()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBeLessThan(timerCountAfterClose)
  })
})

describe('given Select in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Select },
    template: '<form @submit="handleSubmit"><Select name="test" value="true" /></form>',
  }, {
    props: { handleSubmit },
    attachTo: document.body,
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('should use the nullableValue for the hidden select when the value is nullish', async () => {
    const wrapper = mount({
      components: { Select },
      template: '<form><Select name="test" nullable-value="null" /></form>',
    }, {
      attachTo: document.body,
    })

    const options = wrapper.findAll('select option')
    expect((options[0].element as HTMLOptionElement).value).toBe('null')
  })

  describe('after selecting option and clicking submit button', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
      const selection = wrapper.findAll('[role=option]')[1];
      (selection.element as HTMLElement).focus()
      await selection.trigger('pointerup')
      // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
      await fireEvent.pointerUp(selection.element)
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'Banana' })
    })
  })

  describe('after selecting other option and click submit button again', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
      const selection = wrapper.findAll('[role=option]')[4];
      (selection.element as HTMLElement).focus()
      await selection.trigger('pointerup')
      // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
      await fireEvent.pointerUp(selection.element)
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'Pineapple' })
    })
  })
})

describe('given SelectItem slot props and SelectItemIndicator', () => {
  function mountSelect(forceMount = false) {
    const modelValue = ref('a')
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(SelectRoot, {
          'open': true,
          'modelValue': modelValue.value,
          'onUpdate:modelValue': (v: any) => { modelValue.value = v },
        }, () => h(SelectContent, { position: 'item-aligned' }, () => h(SelectViewport, () => ['a', 'b'].map(value =>
          h(SelectItem, { value }, {
            default: ({ selected }: { selected: boolean }) => [
              h(SelectItemText, () => value),
              h('span', { 'data-testid': `label-${value}` }, String(selected)),
              h(SelectItemIndicator, { 'forceMount': forceMount, 'data-testid': `indicator-${value}` }, () => '✓'),
            ],
          }),
        ))))
      },
    }), { attachTo: document.body })
    return { wrapper, modelValue }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should expose `selected` slot prop', async () => {
    const { modelValue } = mountSelect()
    await nextTick()
    expect(document.querySelector('[data-testid=label-a]')?.textContent).toBe('true')
    expect(document.querySelector('[data-testid=label-b]')?.textContent).toBe('false')

    modelValue.value = 'b'
    await nextTick()
    expect(document.querySelector('[data-testid=label-a]')?.textContent).toBe('false')
    expect(document.querySelector('[data-testid=label-b]')?.textContent).toBe('true')
  })

  it('should only mount the indicator of the selected item', async () => {
    const { modelValue } = mountSelect()
    await nextTick()
    expect(document.querySelector('[data-testid=indicator-a]')).not.toBeNull()
    expect(document.querySelector('[data-testid=indicator-b]')).toBeNull()

    modelValue.value = 'b'
    // Presence unmounts after its exit state settles
    await vi.waitFor(() => expect(document.querySelector('[data-testid=indicator-a]')).toBeNull())
    expect(document.querySelector('[data-testid=indicator-b]')).not.toBeNull()
  })

  it('should keep indicators mounted with `forceMount` and reflect `data-state`', async () => {
    mountSelect(true)
    await nextTick()
    const a = document.querySelector('[data-testid=indicator-a]')!
    const b = document.querySelector('[data-testid=indicator-b]')!
    expect(a.getAttribute('data-state')).toBe('checked')
    expect(b.getAttribute('data-state')).toBe('unchecked')
    expect(a.hasAttribute('forcemount')).toBe(false)
    expect(a.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('given Select with `loop`', () => {
  function setup(props: { loop?: boolean, position?: 'item-aligned' | 'popper' }) {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(SelectRoot, { open: true }, () =>
          h(SelectContent, props, () => h(SelectViewport, () => ['a', 'b', 'c'].map(value =>
            h(SelectItem, { value }, () => h(SelectItemText, () => value)),
          ))))
      },
    }), { attachTo: document.body })
    return { wrapper, items: () => [...document.querySelectorAll<HTMLElement>('[role=option]')] }
  }

  async function press(key: string) {
    fireEvent.keyDown(document.activeElement!, { key })
    await new Promise(resolve => setTimeout(resolve))
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it.each(['item-aligned', 'popper'] as const)('should wrap around the boundary items (%s)', async (position) => {
    const { items } = setup({ loop: true, position })
    await nextTick()
    const [first, , last] = items()

    first.focus()
    await press('ArrowUp')
    expect(document.activeElement).toBe(last)

    await press('ArrowDown')
    expect(document.activeElement).toBe(first)
  })

  it('should stay on the boundary items without `loop`', async () => {
    const { items } = setup({})
    await nextTick()
    const [first, , last] = items()

    first.focus()
    await press('ArrowUp')
    expect(document.activeElement).toBe(first)

    last.focus()
    await press('ArrowDown')
    expect(document.activeElement).toBe(last)
  })

  it('should not forward `loop` to the popper content element', async () => {
    setup({ loop: true, position: 'popper' })
    await nextTick()
    expect(document.querySelector('[loop]')).toBeNull()
  })
})

describe('given SelectTrigger with consumer event listeners', () => {
  function mountSelect(triggerListeners: Record<string, (event: Event) => void> = {}) {
    document.body.innerHTML = ''
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(SelectRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(SelectTrigger, triggerListeners, () => h(SelectValue, { placeholder: 'Pick one' })),
        h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => [
          h(SelectItem, { value: 'apple' }, () => h(SelectItemText, () => 'Apple')),
        ]))),
      ]),
    }), { attachTo: document.body })
    const trigger = wrapper.find('[role="combobox"]').element as HTMLElement
    return { open, trigger }
  }

  // jsdom has no `PointerEvent`, so `fireEvent` drops `button`/`pointerType`.
  function dispatchPointer(target: HTMLElement, type: string, pointerType: string) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    target.dispatchEvent(event)
    return nextTick()
  }

  it.each(['Enter', ' ', 'ArrowDown'])('should open on %j keydown', async (key) => {
    const { open, trigger } = mountSelect()
    await fireEvent.keyDown(trigger, { key })
    expect(open.value).toBe(true)
  })

  it.each(['Enter', ' ', 'ArrowDown'])('should not open on %j keydown when the consumer prevents default', async (key) => {
    const { open, trigger } = mountSelect({ onKeydown: event => event.preventDefault() })
    await fireEvent.keyDown(trigger, { key })
    expect(open.value).toBe(false)
  })

  it('should open on mouse pointerdown', async () => {
    const { open, trigger } = mountSelect()
    await dispatchPointer(trigger, 'pointerdown', 'mouse')
    expect(open.value).toBe(true)
  })

  it('should not open on mouse pointerdown when the consumer prevents default', async () => {
    const { open, trigger } = mountSelect({ onPointerdown: event => event.preventDefault() })
    await dispatchPointer(trigger, 'pointerdown', 'mouse')
    expect(open.value).toBe(false)
  })

  it('should not open on touch pointerup when the consumer prevents default', async () => {
    const { open, trigger } = mountSelect({ onPointerup: event => event.preventDefault() })
    await dispatchPointer(trigger, 'pointerup', 'touch')
    expect(open.value).toBe(false)
  })

  it('should still open on touch pointerup', async () => {
    const { open, trigger } = mountSelect()
    await dispatchPointer(trigger, 'pointerup', 'touch')
    expect(open.value).toBe(true)
  })

  it('should keep the trigger from taking focus on mousedown', async () => {
    const { trigger } = mountSelect()
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })
    trigger.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('should run consumer mousedown listeners before its own', async () => {
    let preventedWhenConsumerRan: boolean | undefined
    const { trigger } = mountSelect({ onMousedown: (event) => { preventedWhenConsumerRan = event.defaultPrevented } })
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }))
    expect(preventedWhenConsumerRan).toBe(false)
  })

  it('should not focus the trigger on click when the consumer prevents default', async () => {
    const { trigger } = mountSelect({ onClick: event => event.preventDefault() })
    const focusSpy = vi.spyOn(trigger, 'focus')
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    expect(focusSpy).not.toHaveBeenCalled()
    focusSpy.mockRestore()
  })

  it('should open on Space after a non-printable key', async () => {
    const { open, trigger } = mountSelect()
    await fireEvent.keyDown(trigger, { key: 'ArrowLeft' })
    await fireEvent.keyDown(trigger, { key: 'Shift' })
    await fireEvent.keyDown(trigger, { key: ' ' })
    expect(open.value).toBe(true)
  })
})
