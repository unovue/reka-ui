import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { AcceptableValue } from '@/shared/types'
import { fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, inject, nextTick, ref, shallowRef } from 'vue'
import { handleSubmit } from '@/test'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'
import SelectUnmountCleanup from './__test__/SelectUnmountCleanup.vue'
import { injectSelectContentContext } from './SelectContentImpl.vue'
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

  // TODO(v3-port): #3127 disable options when the root becomes disabled (Select source resolved to v3)
  it.skip('disables options when the select becomes disabled while open', async () => {
    wrapper.unmount()
    wrapper = mount(Select, { attachTo: document.body, props: { disabled: false } })
    await fireEvent.pointerDown(wrapper.find('button').element, { button: 0, ctrlKey: false })
    await nextTick()
    const option = wrapper.findAll('[role=option]')[1]

    await wrapper.setProps({ disabled: true })
    await nextTick()
    expect(option.attributes('aria-disabled')).toBe('true')
    await option.trigger('pointerup')
    await option.trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await wrapper.setProps({ disabled: false })
    await option.trigger('pointerup')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Banana'])
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

    describe('touch interop', () => {
      // TODO(v3-port): #3134 touch/pen items select on click (Select source resolved to v3)
      it.skip('should not select the item a touch scroll ends on', async () => {
        const selection = wrapper.findAll('[role=option]')[1]
        await fireEvent.pointerDown(selection.element, { pointerType: 'touch' })
        // iOS Safari fires pointerup on the item under the finger when the scroll stops, but no click follows
        await fireEvent.pointerUp(selection.element, { pointerType: 'touch' })
        await nextTick()

        expect(valueBox.html()).not.toContain('Banana')
        expect(wrapper.find('[role=group]').exists()).toBeTruthy()
      })

      it('should select on the click that follows a tap', async () => {
        const selection = wrapper.findAll('[role=option]')[1]
        await fireEvent.pointerDown(selection.element, { pointerType: 'touch' })
        await fireEvent.pointerUp(selection.element, { pointerType: 'touch' })
        // A real tap's click has `detail: 1`
        await fireEvent.click(selection.element, { detail: 1 })

        await vi.waitFor(() => expect(valueBox.html()).toContain('Banana'))
        // The content unmounts a macrotask after the selection
        await vi.waitFor(() => expect(wrapper.find('[role=group]').exists()).toBeFalsy())
      })

      it('should not select on a click that did not start on the item', async () => {
        // Tapping the trigger opens the content, and that tap's click can land on an item
        const selection = wrapper.findAll('[role=option]')[1]
        await fireEvent.click(selection.element, { detail: 1 })
        await nextTick()
        await nextTick()

        expect(valueBox.html()).not.toContain('Banana')
        expect(wrapper.find('[role=group]').exists()).toBeTruthy()
      })

      it('should select on a pen pointerup', async () => {
        const selection = wrapper.findAll('[role=option]')[1]
        // Needs 2 pointerup because SelectContentImpl prevents accidental pointerup's
        await fireEvent.pointerUp(selection.element, { pointerType: 'pen' })
        await fireEvent.pointerUp(selection.element, { pointerType: 'pen' })

        await vi.waitFor(() => expect(valueBox.html()).toContain('Banana'))
      })

      // TODO(v3-port): #3134 touch/pen items select on click (Select source resolved to v3)
      it.skip('should select on a click without pointer events', async () => {
        // Assistive technology activates with a click that no pointer produced (`detail: 0`)
        const selection = wrapper.findAll('[role=option]')[1]
        await fireEvent.click(selection.element)

        await vi.waitFor(() => expect(valueBox.html()).toContain('Banana'))
      })

      it('should not highlight items a finger scrolls across', async () => {
        const selection = wrapper.findAll('[role=option]')[1]
        await fireEvent.pointerMove(selection.element, { pointerType: 'touch' })
        await nextTick()

        expect(selection.attributes('data-highlighted')).toBeUndefined()
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
  async function mountSelect<T extends AcceptableValue>(options: T[], { initialValue, label = String, withItemText = true, rootProps = {}, triggerProps = {}, itemProps = () => ({}) }: {
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
        return () => h(SelectRoot, { ...rootProps, 'modelValue': modelValue.value, 'onUpdate:modelValue': (value: unknown) => { modelValue.value = value as T } }, () => [
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

  // TODO(v3-port): #3061 typeahead on the closed trigger selects the match (Select source resolved to v3)
  it.skip('should cycle through items with the same text', async () => {
    const options = [{ id: 1, name: 'Main St' }, { id: 2, name: 'Main St' }]
    const { modelValue, trigger } = await mountSelect(options, { initialValue: options[0], label: option => option.name, rootProps: { by: 'id' } })
    await type(trigger, 'm')
    expect(modelValue.value).toBe(options[1])
  })

  // TODO(v3-port): #3061 typeahead on the closed trigger selects the match (Select source resolved to v3)
  it.skip('should match an item\'s text content when it has no `SelectItemText`', async () => {
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

  // TODO(v3-port): #3061 typeahead on the closed trigger selects the match (Select source resolved to v3)
  it.skip('should emit the matched item\'s `select` once, with the key event', async () => {
    const onSelect = vi.fn()
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], { itemProps: option => ({ onSelect: (event: CustomEvent) => onSelect(option, event) }) })
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Banana')
    expect(onSelect).toHaveBeenCalledTimes(1)
    const [option, event] = onSelect.mock.calls[0]
    expect(option).toBe('Banana')
    expect(event.detail.value).toBe('Banana')
    expect(event.detail.originalEvent).toBeInstanceOf(KeyboardEvent)
  })

  // TODO(v3-port): #3061 typeahead on the closed trigger selects the match (Select source resolved to v3)
  it.skip('should not select an item whose `select` is prevented', async () => {
    const onUpdateOpen = vi.fn()
    const { modelValue, trigger } = await mountSelect(['Apple', 'Banana'], {
      initialValue: 'Apple',
      rootProps: { 'onUpdate:open': onUpdateOpen },
      itemProps: option => option === 'Banana' ? { onSelect: (event: Event) => event.preventDefault() } : {},
    })
    await type(trigger, 'b')
    expect(modelValue.value).toBe('Apple')
    expect(trigger.textContent).toContain('Apple')
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

  // TODO(v3-port): #3061 typeahead on the closed trigger selects the match (Select source resolved to v3)
  it.skip('should focus the match without selecting it while open', async () => {
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

describe('given SelectContent closing after a selection', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the selected option once the menu closes, before any timer runs', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { defaultValue: 'Apple' } })
    const valueBox = wrapper.find('[aria-label="Customise options"]')

    await fireEvent.pointerDown(wrapper.find('button').element, { button: 0, ctrlKey: false })
    await nextTick()

    const banana = wrapper.findAll('[role=option]')[1]
    ;(banana.element as HTMLElement).focus()
    await banana.trigger('pointerup')
    await fireEvent.pointerUp(banana.element)
    for (let i = 0; i < 5; i++) {
      await nextTick()
    }

    expect(valueBox.text()).toContain('Banana')
    expect(valueBox.text()).not.toContain('Please select a fruit')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })
})

describe('given a Select value that no longer matches a mounted option', () => {
  const placeholder = 'Pick one'

  function mountControlled(initial: { value?: string, options: string[], forceMount?: boolean }) {
    document.body.innerHTML = ''
    const model = ref<string | undefined>(initial.value)
    const options = ref(initial.options)
    const Fixture = defineComponent({
      setup() {
        return () => h(SelectRoot, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: unknown) => {
            model.value = value as string
          },
        }, () => [
          h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { placeholder })),
          h(SelectPortal, null, () => h(SelectContent, { forceMount: initial.forceMount, position: 'popper' }, () => h(SelectViewport, null, () => options.value.map(fruit =>
            h(SelectItem, { key: fruit, value: fruit }, () => h(SelectItemText, null, () => fruit)),
          )))),
        ])
      },
    })
    const wrapper = mount(Fixture, { attachTo: document.body })
    return {
      wrapper,
      model,
      options,
      trigger: () => document.querySelector('[role="combobox"]')!,
    }
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the placeholder when the value is cleared', async () => {
    const { model, trigger } = mountControlled({ value: 'Apple', options: ['Apple', 'Banana'] })
    await nextTick()
    expect(trigger().textContent).toContain('Apple')

    model.value = undefined
    await nextTick()

    expect(trigger().textContent).toContain(placeholder)
  })

  it('shows the placeholder when the value matches no option', async () => {
    const { model, trigger } = mountControlled({ value: 'Apple', options: ['Apple', 'Banana'] })
    await nextTick()

    model.value = 'Durian'
    await nextTick()

    expect(trigger().textContent).toContain(placeholder)
    expect(trigger().textContent).not.toContain('Apple')
  })

  // TODO(v3-port): #3180 trigger label follows the mounted options (Select source resolved to v3)
  it.skip('shows the placeholder when the selected option is removed', async () => {
    const { options, trigger } = mountControlled({ value: 'Apple', options: ['Apple', 'Banana'] })
    await nextTick()
    expect(trigger().textContent).toContain('Apple')

    options.value = ['Banana']
    await nextTick()

    expect(trigger().textContent).toContain(placeholder)
    expect(trigger().textContent).not.toContain('Apple')
  })

  it('keeps the selected option and the menu mounted when forceMount is set', async () => {
    const { trigger } = mountControlled({ value: 'Apple', options: ['Apple', 'Cherry'], forceMount: true })
    await nextTick()

    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
    await nextTick()
    const cherry = document.querySelectorAll<HTMLElement>('[role="option"]')[1]
    cherry.focus()
    await fireEvent.pointerUp(cherry)
    await fireEvent.pointerUp(cherry)
    await nextTick()

    expect(trigger().textContent).toContain('Cherry')
    expect(trigger().textContent).not.toContain(placeholder)
    const listbox = document.querySelector('[role="listbox"]')
    expect(listbox).not.toBeNull()
    expect(listbox?.getAttribute('data-state')).toBe('closed')
  })
})

describe('given Select in a form', async () => {
  // Mounted when the suite runs, not when it is collected: the suites before
  // it empty the body, and a closed select resolves its portal target on the
  // first open.
  let wrapper: VueWrapper
  beforeAll(() => {
    wrapper = mount({
      props: ['handleSubmit'],
      components: { Select },
      template: '<form @submit="handleSubmit"><Select name="test" value="true" /></form>',
    }, {
      props: { handleSubmit },
      attachTo: document.body,
    })
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

describe('given an initially disabled, open Select', () => {
  it('keeps a fallback item for positioning and scrolling after enabling', async () => {
    const disabled = ref(true)
    const ContentProbe = defineComponent({
      setup() {
        const context = injectSelectContentContext()
        return () => h('span', { 'data-testid': 'scroll-item' }, context.selectedItem?.value?.textContent)
      },
    })
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(SelectRoot, { open: true, disabled: disabled.value }, () =>
          h(SelectContent, { position: 'popper' }, () => [
            h(SelectViewport, () => ['Apple', 'Orange'].map(value =>
              h(SelectItem, { value }, () => h(SelectItemText, () => value)),
            )),
            h(ContentProbe),
          ]))
      },
    }), { attachTo: document.body })
    await nextTick()
    disabled.value = false
    await nextTick()
    expect(wrapper.get('[data-testid="scroll-item"]').text()).toBe('Apple')
    wrapper.unmount()
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

describe('given a Select root that stays mounted', () => {
  // TODO(v3-port): #3202 release the closed content from the collection (Select source resolved to v3)
  it.skip.each(['item-aligned', 'popper'] as const)('should release the closed content from the collection with position=%s', async (position) => {
    let collection!: { collectionRef: { value: HTMLElement | undefined } }
    const CollectionProbe = defineComponent({
      setup() {
        collection = inject('CollectionProvider')!
        return () => null
      },
    })
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(SelectRoot, { open: open.value }, () => [
        h(CollectionProbe),
        h(SelectTrigger, { 'aria-label': 'Food' }, () => h(SelectValue, { placeholder: 'Pick' })),
        h(SelectContent, { position }, () => h(SelectViewport, () => ['Apple', 'Banana'].map(value =>
          h(SelectItem, { key: value, value }, () => h(SelectItemText, () => value))))),
      ]),
    }), { attachTo: document.body })

    // Every open content element the collection has pointed at. None may come back.
    const openContents: HTMLElement[] = []

    for (let cycle = 0; cycle < 2; cycle++) {
      open.value = true
      await vi.waitFor(() => expect(wrapper.find('[role="listbox"]').exists()).toBe(true))
      await flushPromises()
      const openContent = collection.collectionRef.value!
      expect(openContent.contains(wrapper.get('[role="listbox"]').element)).toBe(true)
      expect(openContents).not.toContain(openContent)
      expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
      openContents.push(openContent)

      open.value = false
      await vi.waitFor(() => expect(wrapper.find('[role="listbox"]').exists()).toBe(false))
      await flushPromises()
      // While closed the collection is the detached fragment that the trigger's typeahead
      // reads its items from, never the content that was just removed from the document.
      const closedCollection = collection.collectionRef.value
      expect(openContents).not.toContain(closedCollection)
      expect(closedCollection?.isConnected).toBe(false)
      expect(openContents.some(content => closedCollection?.contains(content) || content.contains(closedCollection!))).toBe(false)
    }

    wrapper.unmount()
  })
})

function mountFruitsInForm(modelValue: { value: unknown }, rootProps: Record<string, unknown> = {}, items: unknown[] = ['apple', 'banana', 'cherry']) {
  return mount(defineComponent({
    setup() {
      return () => h('form', [
        h(SelectRoot, {
          'name': 'fruit',
          'multiple': true,
          ...rootProps,
          'modelValue': modelValue.value as AcceptableValue,
          'onUpdate:modelValue': (value: unknown) => { modelValue.value = value },
        }, () => [
          h(SelectTrigger, () => h(SelectValue)),
          h(SelectContent, () => h(SelectViewport, () => items.map(value =>
            h(SelectItem, { value: value as AcceptableValue }, () => h(SelectItemText, () => JSON.stringify(value))),
          ))),
        ]),
      ])
    },
  }), { attachTo: document.body })
}

describe('given a multiple Select in a form', () => {
  let wrapper: VueWrapper | undefined
  const form = () => wrapper!.get('form').element as HTMLFormElement
  const submitted = () => new FormData(form()).getAll('fruit')
  const selectedOptions = () => Array.from(form().querySelectorAll('option')).map(option => option.selected)

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  it('submits every selected value', async () => {
    wrapper = mountFruitsInForm(ref(['apple', 'cherry']))
    await nextTick()

    expect(submitted()).toEqual(['apple', 'cherry'])
  })

  it('submits the new selection after the value is replaced or changed in place', async () => {
    const modelValue = ref(['apple'])
    wrapper = mountFruitsInForm(modelValue)
    await nextTick()

    modelValue.value = ['apple', 'banana']
    await flushPromises()
    expect(submitted()).toEqual(['apple', 'banana'])

    modelValue.value.push('cherry')
    await flushPromises()
    expect(submitted()).toEqual(['apple', 'banana', 'cherry'])
  })

  it('bubbles a `change` that reads the new selection', async () => {
    const modelValue = ref(['apple'])
    wrapper = mountFruitsInForm(modelValue)
    await nextTick()
    const seen: FormDataEntryValue[][] = []
    form().addEventListener('change', () => seen.push(submitted()))

    modelValue.value = ['apple', 'cherry']
    await flushPromises()

    expect(seen).toEqual([['apple', 'cherry']])
  })

  it('selects the options of object values, compared with `by`', async () => {
    wrapper = mountFruitsInForm(ref([{ id: 1 }, { id: 3 }]), { by: 'id' }, [{ id: 1 }, { id: 2 }, { id: 3 }])
    await nextTick()

    expect(selectedOptions()).toEqual([true, false, true])
  })

  it('is valid when `required` and more than one value is selected', async () => {
    wrapper = mountFruitsInForm(ref(['apple', 'banana']), { required: true })
    await nextTick()

    expect(form().checkValidity()).toBe(true)
  })

  it('is invalid when `required` and nothing is selected', async () => {
    wrapper = mountFruitsInForm(ref([]), { required: true })
    await nextTick()

    expect(form().checkValidity()).toBe(false)
  })

  it('keeps the selection and reads it in `change` when `multiple` is turned on', async () => {
    const multiple = ref(false)
    const modelValue = ref<unknown>('apple')
    wrapper = mount(defineComponent({
      setup() {
        return () => h('form', [
          h(SelectRoot, {
            'name': 'fruit',
            'multiple': multiple.value,
            'modelValue': modelValue.value as AcceptableValue,
            'onUpdate:modelValue': (value: unknown) => { modelValue.value = value },
          }, () => [
            h(SelectTrigger, () => h(SelectValue)),
            h(SelectContent, () => h(SelectViewport, () => ['apple', 'banana', 'cherry'].map(value =>
              h(SelectItem, { value }, () => h(SelectItemText, () => value)),
            ))),
          ]),
        ])
      },
    }), { attachTo: document.body })
    await flushPromises()
    expect(submitted()).toEqual(['apple'])

    multiple.value = true
    modelValue.value = ['apple']
    await flushPromises()
    expect(submitted()).toEqual(['apple'])

    const seen: FormDataEntryValue[][] = []
    form().addEventListener('change', () => seen.push(submitted()))
    multiple.value = false
    modelValue.value = 'apple'
    await flushPromises()
    seen.length = 0
    multiple.value = true
    modelValue.value = ['cherry']
    await flushPromises()
    expect(submitted()).toEqual(['cherry'])
    // The mode and the value changed in one update: `change` still fires, with the new selection
    expect(seen).toEqual([['cherry']])
    modelValue.value = ['banana', 'cherry']
    await flushPromises()
    expect(seen.at(-1)).toEqual(['banana', 'cherry'])

    seen.length = 0
    multiple.value = false
    modelValue.value = 'banana'
    await flushPromises()
    expect(seen).toEqual([['banana']])
  })

  // TODO(v3-port): #3345 multiple Select submits the empty `nullableValue` (Select source resolved to v3)
  it.skip('keeps submitting the empty `nullableValue` while the value is nullish', async () => {
    wrapper = mountFruitsInForm(ref(null))
    await nextTick()

    expect(submitted()).toEqual([''])
  })
})

describe('given a single Select in a form', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('submits the empty `nullableValue` once the value is cleared', async () => {
    const modelValue = ref<string | null>('apple')
    const wrapper = mountFruitsInForm(modelValue, { multiple: false })
    await nextTick()

    modelValue.value = null
    await flushPromises()

    expect(new FormData(wrapper.get('form').element).getAll('fruit')).toEqual([''])
    wrapper.unmount()
  })
})
