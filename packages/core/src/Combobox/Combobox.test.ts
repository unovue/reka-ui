import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { handleSubmit, sleep } from '@/test'
import Combobox from './story/_Combobox.vue'
import ComboboxObject from './story/_ComboboxObject.vue'

describe('given default Combobox', () => {
  let wrapper: VueWrapper<InstanceType<typeof Combobox>>
  let valueBox: DOMWrapper<HTMLInputElement>
  let items: DOMWrapper<Element>[]
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    // @ts-expect-error aXe throwing error complaining getComputedStyle
    window.getComputedStyle = () => ({
      animationName: '',
    })
    document.body.innerHTML = ''
    wrapper = mount(Combobox, { attachTo: document.body, props: { resetSearchTermOnBlur: true } })
    valueBox = wrapper.find('input')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should show placeholder', () => {
    expect(wrapper.html()).toContain('Placeholder...')
  })

  describe('opening the popup', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
      items = wrapper.findAll('[role=option]')
    })

    it('should pass axe accessibility tests', async () => {
      // We have hidden children such as icon, thus disabling this
      expect(await axe(wrapper.element, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      })).toHaveNoViolations()
    })

    it('should show the popup content', () => {
      expect(wrapper.html()).toContain('Apple')
    })

    it('should reset searchTerm when close', async () => {
      const input = wrapper.find('input')
      input.element.value = 'Testing'
      await input.trigger('keydown', { key: 'Escape' })
      expect(input.element.value).toBe('')
    })

    it('should not reset searchTerm when close', async () => {
      await wrapper.setProps({ resetSearchTermOnBlur: false, key: 'key' })
      const input = wrapper.find('input')
      input.element.value = 'Testing'
      await input.trigger('keydown', { key: 'Escape' })
      expect(input.element.value).toBe('Testing')
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = items[1]
        await selection.trigger('click')
        await sleep(1)
      })

      it('should show value correctly', () => {
        expect((valueBox.element).value).toBe('Banana')
      })

      it('should close the popup', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeFalsy()
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(items[1].text())
      })

      describe('after opening the modal again', () => {
        beforeEach(async () => {
          await wrapper.find('button').trigger('click')
          await nextTick()
        })

        it('should focus on the selected value', () => {
          const selection = items[1]
          expect(selection.attributes('data-state')).toBe('checked')
        })

        it('should render the icon', () => {
          const selection = items[1]
          expect(selection.html()).toContain('svg')
        })
      })
    })

    // describe('after keypress input', () => {
    //   beforeEach(async () => {
    //     await valueBox.setValue('B')
    //   })

    //   describe('if filter-function provided', () => {
    //     beforeEach(async () => {
    //       await wrapper.setProps({
    //         filterFunction: (list: any[], term: string) => {
    //           return list.filter(i => i.toLowerCase().includes(term.toLowerCase()))
    //         },
    //       })
    //     })
    //     it('should filter with the searchTerm (Bl', async () => {
    //       await valueBox.setValue('Bl')

    //       const selection = wrapper.findAll('[data-highlighted]').filter(i => i.attributes('style') !== 'display: none;')
    //       expect(selection.length).toBe(1)
    //       expect(selection[0].element.innerHTML).contains('Blueberry')
    //     })

    //     it('should filter with the searchTerm (B', async () => {
    //       await valueBox.setValue('Bl')
    //       await valueBox.setValue('B')

    //       const selection = wrapper.findAll('[data-highlighted]').filter(i => i.attributes('style') !== 'display: none;')
    //       expect(selection.length).toBe(1)
    //       expect(selection[0].element.innerHTML).contains('Banana')
    //     })
    //   })
    // })
  })
})

describe('given a Combobox with multiple prop', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Combobox>>
  let valueBox: DOMWrapper<HTMLInputElement>
  let items: DOMWrapper<Element>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Combobox, { props: { multiple: true, resetSearchTermOnBlur: true }, attachTo: document.body })
    valueBox = wrapper.find('input')
  })

  describe('opening the popup', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
      items = wrapper.findAll('[role=option]')
    })

    it('should show the popup content', () => {
      expect(wrapper.html()).toContain('Apple')
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = items[1]
        await selection.trigger('click')
      })

      it('should not show searchTerm value', () => {
        expect((valueBox.element).value).toBe('')
      })

      it('should keep popup open', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeTruthy()
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([items[1].text()])
      })
    })
  })
})
// TODO: add Combobox Virtual story and test

describe('given a Combobox with object', async () => {
  let wrapper: VueWrapper<InstanceType<typeof ComboboxObject>>
  let valueBox: DOMWrapper<HTMLInputElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ComboboxObject, {
      props: { resetSearchTermOnBlur: true },
      attachTo: document.body,
    })
    valueBox = wrapper.find('input')
  })

  describe('opening the popup', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should show the popup content', () => {
      expect(wrapper.html()).toContain('Durward Reynolds')
    })

    describe('after keypress input', () => {
      beforeEach(async () => {
        await valueBox.setValue('Du')
      })

      it('should filter with the searchTerm (Dur)', () => {
        const selection = wrapper.findAll('[role=option]')
        expect(selection.length).toBe(1)
        expect(selection[0].element.innerHTML).contains('Dur')
      })
      // })
    })

    describe('if no display-value provided', () => {
      describe('after selecting a value', () => {
        beforeEach(async () => {
          const selection = wrapper.findAll('[role=option]')[1]
          await selection.trigger('click')
        })

        it('should not show searchTerm value', () => {
          expect((valueBox.element).value).toBe('')
        })

        it('should not keep popup open', () => {
          const group = wrapper.find('[role=group]')
          expect(group.exists()).toBeFalsy()
        })
      })
    })

    describe('if display-value provided', () => {
      describe('after selecting a value', () => {
        beforeEach(async () => {
          await wrapper.setProps({
            input: {
              displayValue: (item: any) => {
                return item.name
              },
            },
          })
          const selection = wrapper.findAll('[role=option]')[1]
          await selection.trigger('click')
          await sleep(1)
        })

        it('should show searchTerm value', () => {
          expect((valueBox.element).value).toBe('Kenton Towne')
        })

        it('should not keep popup open', () => {
          const group = wrapper.find('[role=group]')
          expect(group.exists()).toBeFalsy()
        })
      })
    })
  })
})

describe('given combobox in a form', async () => {
  let wrapper: VueWrapper<InstanceType<any>>
  let valueBox: DOMWrapper<HTMLInputElement>

  let enterEventBubbledToForm = false

  beforeEach(() => {
    wrapper = mount({
      props: ['handleSubmit'],
      components: { Combobox },
      template: '<form @submit="handleSubmit"><Combobox /></form>',
    }, {
      props: { handleSubmit },
      attachTo: document.body,
    })

    valueBox = wrapper.find('input')

    enterEventBubbledToForm = false
    wrapper.find('form').element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        enterEventBubbledToForm = true
      }
    })
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('input[data-hidden]').exists()).toBe(true)
  })

  describe('after selecting option and clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
      const selection = wrapper.findAll('[role=option]')[1]
      await selection.trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'Banana' })
    })
  })

  describe('after selecting other option and click submit button again', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
      const selection = wrapper.findAll('[role=option]')[4]
      await selection.trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: 'Pineapple' })
    })
  })

  describe('after selecting an option via keyboard', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await valueBox.setValue('B')
      await valueBox.trigger('keydown', { key: 'Enter' })
    })

    it('should show value correctly', () => {
      expect((valueBox.element).value).toBe('Banana')
    })

    it('should not bubble up the Enter keydown event to the form', () => {
      expect(enterEventBubbledToForm).toBe(false)
    })
  })
})
