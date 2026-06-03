import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { handleSubmit, sleep } from '@/test'
import Autocomplete from './story/_Autocomplete.vue'

describe('given default Autocomplete', () => {
  let wrapper: VueWrapper<InstanceType<typeof Autocomplete>>
  let input: DOMWrapper<HTMLInputElement>
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
    wrapper = mount(Autocomplete, { attachTo: document.body })
    input = wrapper.find('input')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should show placeholder', () => {
    expect(wrapper.html()).toContain('Placeholder...')
  })

  it('should have empty modelValue initially', () => {
    expect(input.element.value).toBe('')
  })

  describe('opening the popup', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
      items = wrapper.findAll('[role=option]')
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(wrapper.element, {
        rules: {
          'aria-required-children': { enabled: false },
        },
      })).toHaveNoViolations()
    })

    it('should show the popup content', () => {
      expect(wrapper.html()).toContain('Apple')
    })

    it('should keep input text on close (resetSearchTermOnBlur defaults to false)', async () => {
      input.element.value = 'Testing'
      await input.trigger('input')
      await input.trigger('keydown', { key: 'Escape' })
      expect(input.element.value).toBe('Testing')
    })

    it('should keep typed text as modelValue even when resetSearchTermOnBlur is true', async () => {
      // In Autocomplete, typing immediately sets the modelValue, so reset only clears
      // the internal filter state — the input still reflects the modelValue.
      document.body.innerHTML = ''
      const w = mount(Autocomplete, { attachTo: document.body, props: { resetSearchTermOnBlur: true } })
      const newInput = w.find('input')
      await w.find('button').trigger('click')
      await nextTick()
      newInput.element.value = 'Testing'
      await newInput.trigger('input')
      await newInput.trigger('keydown', { key: 'Escape' })
      await sleep(50)
      // Input should still show the modelValue (typed text IS the value)
      expect(newInput.element.value).toBe('Testing')
    })

    describe('after selecting a value', () => {
      beforeEach(async () => {
        const selection = items[1]
        await selection.trigger('click')
        await sleep(1)
      })

      it('should fill the input with the selected item text', () => {
        expect(input.element.value).toBe('Banana')
      })

      it('should close the popup', () => {
        const group = wrapper.find('[role=group]')
        expect(group.exists()).toBeFalsy()
      })

      it('should emit `update:modelValue` with the text value', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('Banana')
      })

      describe('after opening the popup again', () => {
        beforeEach(async () => {
          await wrapper.find('button').trigger('click')
          await nextTick()
        })

        it('should still show the selected text in the input', () => {
          expect(input.element.value).toBe('Banana')
        })
      })
    })

    describe('typing free-form text', () => {
      beforeEach(async () => {
        input.element.value = 'Custom text'
        await input.trigger('input')
      })

      it('should emit `update:modelValue` with the typed text', () => {
        const emitted = wrapper.emitted('update:modelValue')
        const lastEmit = emitted.at(-1)?.[0]
        expect(lastEmit).toBe('Custom text')
      })

      it('should keep the typed text after closing', async () => {
        await input.trigger('keydown', { key: 'Escape' })
        expect(input.element.value).toBe('Custom text')
      })
    })

    describe('handle IME composition', () => {
      it('should not filter during composition', async () => {
        await input.trigger('compositionstart')
        input.element.value = 'x'
        await input.trigger('input')
        await nextTick()
        const content = wrapper.find('[role=listbox]')
        expect(content.attributes('data-empty')).toBeUndefined()
        const visibleItems = wrapper.findAll('[role=option]')
        expect(visibleItems.length).toBeGreaterThan(0)
      })

      it('should filter after composition ends', async () => {
        await input.trigger('compositionstart')
        input.element.value = 'xiang'
        await input.trigger('input')
        input.element.value = 'zzzzz'
        await input.trigger('compositionend')
        await nextTick()
        const content = wrapper.find('[role=listbox]')
        expect(content.attributes('data-empty')).toBeDefined()
      })

      it('should not update modelValue during composition', async () => {
        const emittedBefore = wrapper.emitted('update:modelValue')?.length ?? 0
        await input.trigger('compositionstart')
        input.element.value = 'x'
        await input.trigger('input')
        const emittedAfter = wrapper.emitted('update:modelValue')?.length ?? 0
        expect(emittedAfter).toBe(emittedBefore)
      })

      it('should update modelValue after composition ends', async () => {
        await input.trigger('compositionstart')
        input.element.value = '香'
        await input.trigger('compositionend')
        await nextTick()
        const emitted = wrapper.emitted('update:modelValue')
        const lastEmit = emitted.at(-1)?.[0]
        expect(lastEmit).toBe('香')
      })
    })

    describe('data-empty attribute on content', () => {
      it('should not have data-empty when items match', () => {
        const content = wrapper.find('[role=listbox]')
        expect(content.attributes('data-empty')).toBeUndefined()
      })

      it('should have data-empty when no items match the filter', async () => {
        input.element.value = 'zzzzz'
        await input.trigger('input')
        await nextTick()
        const content = wrapper.find('[role=listbox]')
        expect(content.attributes('data-empty')).toBeDefined()
      })

      it('should remove data-empty when items match again', async () => {
        input.element.value = 'zzzzz'
        await input.trigger('input')
        await nextTick()
        const content = wrapper.find('[role=listbox]')
        expect(content.attributes('data-empty')).toBeDefined()

        input.element.value = 'App'
        await input.trigger('input')
        await nextTick()
        expect(content.attributes('data-empty')).toBeUndefined()
      })
    })
  })
})

describe('given autocomplete in a form', () => {
  let wrapper: VueWrapper<InstanceType<any>>
  let input: DOMWrapper<HTMLInputElement>

  beforeEach(() => {
    wrapper = mount({
      props: ['handleSubmit'],
      components: { Autocomplete },
      template: '<form @submit="handleSubmit"><Autocomplete /></form>',
    }, {
      props: { handleSubmit },
      attachTo: document.body,
    })

    input = wrapper.find('input')
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
})
