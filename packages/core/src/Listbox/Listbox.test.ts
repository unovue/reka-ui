import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { useKbd } from '@/shared'
import { handleSubmit } from '@/test'
import Listbox from './story/_Listbox.vue'

describe('given default Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { attachTo: document.body })
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
  // TODO: add make sure to select first item when have ListboxFilter

  describe('when focus on content', () => {
    beforeEach(async () => {
      await content.trigger('focus')
    })

    it('should pass the focus to the first item', () => {
      expect(document.activeElement).toBe(items[0].element)
    })

    it('should have highlighted state on first item', () => {
      expect(items[0].attributes('data-highlighted')).toBe('')
    })

    it('should emit `highlight` event', () => {
      expect(wrapper.emitted('highlight')?.[0]?.[0]).toBeTruthy()
    })

    it('should highlight and select item when clicked', async () => {
      const item = items[2]
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
      expect(item.attributes('data-state')).toBe('checked')
    })

    describe('after pressing `Enter`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
      })

      it('should select the highlighted item', () => {
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('true')
        expect(item.attributes('data-state')).toBe('checked')
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(items[0].text())
      })

      it('should deselect after pressing `Enter`', async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('false')
        expect(item.attributes('data-state')).toBe('unchecked')
      })

      describe('after selecting other item and press `Enter`', async () => {
        beforeEach(async () => {
          await content.trigger('keydown', { key: kbd.ARROW_DOWN })
          await content.trigger('keydown', { key: kbd.ARROW_DOWN })
          await content.trigger('keydown', { key: kbd.ENTER })
        })

        it('should select the third item', () => {
          const item = items[0]
          const newItem = items[2]
          expect(item.attributes('aria-selected')).toBe('false')
          expect(item.attributes('data-state')).toBe('unchecked')
          expect(newItem.attributes('aria-selected')).toBe('true')
          expect(newItem.attributes('data-state')).toBe('checked')
        })
      })
    })
  })

  // Test: useTypeAhead
  describe('when typing letter', async () => {
    beforeEach(async () => {
      await content.trigger('keydown', { key: 'b' })
    })

    it('should highlight text starting with B', () => {
      const item = items.find(i => i.text().startsWith('B'))
      expect(document.activeElement).toBe(item?.element)
    })
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(() => {
      wrapper.setProps({ selectionBehavior: 'replace' })
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
      await newItem.trigger('click')
      expect(document.activeElement).toBe(newItem.element)
    })
  })
})

describe('given multiple `true` Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { props: { multiple: true, selectionBehavior: 'toggle' }, attachTo: document.body })
    await nextTick()
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
    await content.trigger('focus')
  })

  it('should select multiple items', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })

    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('true')
    expect(items[2].attributes('aria-selected')).toBe('true')
    expect(items[3].attributes('aria-selected')).toBe('false')
    expect(items[4].attributes('aria-selected')).toBe('true')
  })

  it('should emit `update:modelValue` event', async () => {
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_DOWN })
    await content.trigger('keydown', { key: kbd.ENTER })
    await content.trigger('keydown', { key: kbd.ARROW_UP })
    await content.trigger('keydown', { key: kbd.ENTER })
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [[items[0].text()]],
      [[items[0].text(), items[1].text()]],
      [[items[1].text()]],
    ])
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(async () => {
      wrapper.setProps({ selectionBehavior: 'replace' })
      await nextTick()
      await items[0].trigger('click')
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      expect(document.activeElement).toBe(item.element)
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      expect(document.activeElement).toBe(item.element)
      await newItem.trigger('click')
      expect(document.activeElement).toBe(newItem.element)
    })

    it('should emit `update:modelValue` event', async () => {
      await content.trigger('keydown', { key: kbd.ENTER })
      await content.trigger('keydown', { key: kbd.ARROW_DOWN })
      await content.trigger('keydown', { key: kbd.ENTER })
      expect(wrapper.emitted('update:modelValue')).toEqual([
        [[items[0].text()]],
        [[items[0].text()]], // there's a bug here, it shouldn't emit the same value twice
        [[items[1].text()]],
      ])
    })

    describe('when keypress Shift + ArrowDown', () => {
      it('should select the next item', async () => {
        await content.trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        expect(items[0].attributes('aria-selected')).toBe('true')
        expect(items[1].attributes('aria-selected')).toBe('true')
        expect(items[2].attributes('aria-selected')).toBe('false')
      })

      it('should select more items', async () => {
        for (let i = 0; i <= 10; i++)
          await content.trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        for (let i = 0; i <= 10; i++)
          expect(items[i].attributes('aria-selected')).toBe('true')
      })
    })
  })
})

describe('given horizontal Listbox', () => {
  const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Listbox>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Listbox, { attachTo: document.body, props: { orientation: 'horizontal' } })
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when focus on content', () => {
    beforeEach(async () => {
      await content.trigger('focus')
    })

    it('should pass the focus to the first item', () => {
      expect(document.activeElement).toBe(items[0].element)
    })

    it('should have highlighted state on first item', () => {
      expect(items[0].attributes('data-highlighted')).toBe('')
    })

    it('should emit `highlight` event', () => {
      expect(wrapper.emitted('highlight')?.[0]?.[0]).toBeTruthy()
    })

    it('should highlight and select item when clicked', async () => {
      const item = items[2]
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
      expect(item.attributes('data-state')).toBe('checked')
    })

    describe('after pressing `Enter`', async () => {
      beforeEach(async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
      })

      it('should select the highlighted item', () => {
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('true')
        expect(item.attributes('data-state')).toBe('checked')
      })

      it('should emit `update:modelValue` event', () => {
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe(items[0].text())
      })

      it('should deselect after pressing `Enter`', async () => {
        await content.trigger('keydown', { key: kbd.ENTER })
        const item = items[0]
        expect(item.attributes('data-highlighted')).toBe('')
        expect(item.attributes('aria-selected')).toBe('false')
        expect(item.attributes('data-state')).toBe('unchecked')
      })

      describe('after selecting other item and press `Enter`', async () => {
        beforeEach(async () => {
          await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
          await content.trigger('keydown', { key: kbd.ARROW_RIGHT })
          await content.trigger('keydown', { key: kbd.ENTER })
        })

        it('should select the third item', () => {
          const item = items[0]
          const newItem = items[2]
          expect(item.attributes('aria-selected')).toBe('false')
          expect(item.attributes('data-state')).toBe('unchecked')
          expect(newItem.attributes('aria-selected')).toBe('true')
          expect(newItem.attributes('data-state')).toBe('checked')
        })
      })
    })
  })
})

describe('given Listbox in a form', async () => {
  let items: DOMWrapper<Element>[]

  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Listbox },
    template: '<form @submit="handleSubmit"><Listbox name="test" default-value="Afghanistan" /></form>',
  }, {
    props: { handleSubmit },
  })

  beforeEach(() => {
    items = wrapper.findAll('[role=option]')
  })

  afterAll(() => {
    document.body.innerHTML = ''
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('input[data-hidden]').exists()).toBe(true)
  })

  describe('after selecting option and clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: items[0].text() })
    })
  })

  describe('after selecting other option and click submit button again', () => {
    beforeEach(async () => {
      await items[4].trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: items[4].text() })
    })
  })
})
