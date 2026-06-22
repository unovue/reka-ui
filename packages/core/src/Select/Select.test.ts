import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { handleSubmit } from '@/test'
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

  describe('trigger mouse interop', () => {
    async function openSelectWithMouseClick() {
      const button = wrapper.find('button')
      // Open on pointerdown, then emit the compatibility mouse events that follow in browsers.
      await button.trigger('pointerdown', { button: 0, ctrlKey: false })
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

      await wrapper.find('button').trigger('pointerdown', { button: 0, ctrlKey: false })
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
      await wrapper.find('button').trigger('pointerdown', {
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
          await wrapper.find('button').trigger('pointerdown', {
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
      await wrapper.find('button').trigger('pointerdown', {
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
          await wrapper.find('button').trigger('pointerdown', {
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
      await wrapper.find('button').trigger('pointerdown', {
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
      await wrapper.find('button').trigger('pointerdown', {
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
      await wrapper.find('button').trigger('pointerdown', {
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
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: 'Pineapple' })
    })
  })
})
