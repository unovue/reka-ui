import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import TagsInput from './story/_TagsInput.vue'
import TagsInputObject from './story/_TagsInputObject.vue'

describe('given default TagsInput', () => {
  // @ts-expect-error we return empty object
  window.getComputedStyle = () => ({})
  let wrapper: VueWrapper<InstanceType<typeof TagsInput>>
  let input: DOMWrapper<HTMLInputElement>
  let tags: DOMWrapper<HTMLElement>[]
  let rootComponent: Omit<VueWrapper, 'exists'>

  beforeEach(() => {
    wrapper = mount(TagsInput, { attachTo: document.body })
    tags = wrapper.findAll('[data-reka-collection-item]')
    rootComponent = wrapper.getComponent({ name: 'TagsInputRoot' })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render the initial tags', () => {
    expect(tags[0].html()).contains('Test')
  })

  const addTag = async (text: string) => {
    await input.setValue(text)
    await input.trigger('keydown.enter')
    tags = wrapper.findAll('[data-reka-collection-item]')
  }

  describe('after adding new value', async () => {
    beforeEach(async () => {
      input = wrapper.find('input')
      input.element.focus()
      await addTag('123')
      await addTag('Asd')
    })

    it('should emit `addTag` event', () => {
      expect(rootComponent.emitted('addTag')?.flat()).toEqual(['123', 'Asd'])
    })

    it('should add a new tag', () => {
      expect(wrapper.html()).contains('123')
      expect(tags[1].html()).contains('123')
    })

    it('should have focus on input', () => {
      expect(input.element).toBe(document.activeElement)
    })

    it('should clear off the value in input', () => {
      expect(input.element.value).toBe('')
    })

    describe('after pressing on ArrowLeft on input', () => {
      beforeEach(async () => {
        await input.trigger('keydown', {
          key: 'ArrowLeft',
        })
      })

      it('should select the last tags', () => {
        expect(tags[tags.length - 1].attributes('data-state')).toBe('active')
      })

      it('should select the previous tag when press ArrowLeft', async () => {
        await input.trigger('keydown', {
          key: 'ArrowLeft',
        })
        expect(tags[tags.length - 1].attributes('data-state')).toBe('inactive')
        expect(tags[tags.length - 2].attributes('data-state')).toBe('active')
      })

      it('should select the first item when press Home', async () => {
        await input.trigger('keydown', {
          key: 'Home',
        })
        expect(tags[0].attributes('data-state')).toBe('active')
        expect(tags[tags.length - 1].attributes('data-state')).toBe('inactive')
      })

      it('should select the last item when press End', async () => {
        await input.trigger('keydown', {
          key: 'Home',
        })
        await input.trigger('keydown', {
          key: 'End',
        })
        expect(tags[0].attributes('data-state')).toBe('inactive')
        expect(tags[tags.length - 1].attributes('data-state')).toBe('active')
      })

      it('should remove active state when press ArrowRight', async () => {
        await input.trigger('keydown', {
          key: 'ArrowRight',
        })
        expect(tags[tags.length - 1].attributes('data-state')).toBe('inactive')
      })

      describe('after pressing on Backspace', () => {
        let prevTag: DOMWrapper<HTMLElement>
        beforeEach(async () => {
          prevTag = wrapper.find('[data-state="active"]')
          await input.trigger('keydown', {
            key: 'Backspace',
          })
          tags = wrapper.findAll('[data-reka-collection-item]')
        })

        it('should trigger `removeTag` event', () => {
          expect(rootComponent.emitted('removeTag')?.[0]?.[0]).toEqual('Asd')
        })

        it('should remove the active tag', () => {
          expect(wrapper.element.contains(prevTag.element)).toBe(false)
          expect(tags.length).toBe(2)
        })

        it('should select the new last tag', () => {
          expect(tags[tags.length - 1].attributes('data-state')).toBe('active')
        })
      })
    })
  })

  describe('adding values on user actions', () => {
    const setValueInInput = (value: string) => {
      input = wrapper.find('input')
      input.element.focus()
      return input.setValue(value)
    }

    it('should add value on keydown:enter', async () => {
      const tag = 'tag:enter'

      await setValueInInput(tag)

      await input.trigger('keydown.enter')

      tags = wrapper.findAll('[data-reka-collection-item]')

      expect(wrapper.html()).toContain(tag)
      expect(tags[1].text()).toBe(tag)
    })

    it('should add value on keydown:tab', async () => {
      const tag = 'tag:tab'
      await wrapper.setProps({ addOnTab: true })
      await setValueInInput(tag)

      await input.trigger('keydown.tab')

      tags = wrapper.findAll('[data-reka-collection-item]')

      expect(wrapper.html()).toContain(tag)
      expect(tags[1].text()).toBe(tag)
    })

    it('should add value on blur', async () => {
      const tag = 'tag:blur'
      await wrapper.setProps({ addOnBlur: true })
      await setValueInInput(tag)

      await input.trigger('blur')

      tags = wrapper.findAll('[data-reka-collection-item]')

      expect(wrapper.html()).toContain(tag)
      expect(tags[1].text()).toBe(tag)
    })
  })
})

describe('given a TagsInput with objects', async () => {
  let wrapper: VueWrapper<InstanceType<typeof TagsInputObject>>
  let input: DOMWrapper<HTMLInputElement>
  let tags: DOMWrapper<HTMLElement>[]

  describe('should be able to convert the value', () => {
    beforeEach(() => {
      document.body.innerHTML = ''
      wrapper = mount(TagsInputObject, {
        props: {
          displayValue: (item: any) => `Person: ${item.name}`,
          convertValue: (item: string) => ({ name: item, id: Math.random() }),
        },
        attachTo: document.body,
      })
      input = wrapper.find('input')
      tags = wrapper.findAll('[data-reka-collection-item]')
    })

    it('should display the initial tags', () => {
      expect(tags[0].text()).toBe('Person: Durward Reynolds')
      expect(tags[1].text()).toBe('Person: Kenton Towne')
    })

    const addTag = async (text: string) => {
      await input.setValue(text)
      await input.trigger('keydown.enter')
      await nextTick()
      tags = wrapper.findAll('[data-reka-collection-item]')
    }

    it('should update the tags', async () => {
      await addTag('Moriah Stanton')
      expect(tags.at(-1)?.text()).toBe('Person: Moriah Stanton')
      expect(wrapper.vm.people).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(Number), name: expect.any(String) })]))
    })
  })

  it('should throw an error if props are not ok', async () => {
    document.body.innerHTML = ''
    const consoleWarnMockFunction = vi.fn()

    const wrapper = mount(TagsInputObject, {
      global: {
        config: {
          errorHandler(err: any) {
            consoleWarnMockFunction(err.message)
          },
        },
      },
      props: {
        displayValue: (item: any) => `Person: ${item.name}`,
        convertValue: undefined,
      },
      attachTo: document.body,
    })

    input = wrapper.find('input')
    await input.setValue('Moriah Stanton')
    await input.trigger('keydown.enter')

    expect(consoleWarnMockFunction).toHaveBeenCalledOnce()
    expect(consoleWarnMockFunction).toHaveBeenLastCalledWith('You must provide a `convertValue` function when using objects as values.')
  })

  describe('given a TagsInput with delimiter', async () => {
    const setupDelimiter = (delimiter: string | RegExp) => {
      const wrapper = mount(TagsInput, {
        props: {
          delimiter,
          addOnPaste: true,
        },
        attachTo: document.body,
      })

      const input = wrapper.find('input')

      return {
        wrapper,
        input,
      }
    }

    it('should add tag on typing single delimiter character', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()

      await user.type(input.element, 'tag1,')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags[1].text()).toBe('tag1')
    })

    it('should add tag on typing multiple delimiter characters', async () => {
      const { wrapper, input } = setupDelimiter(/[ ,;]+/)
      const user = userEvent.setup()

      await user.type(input.element, 'tag1,')
      await user.type(input.element, 'tag2 ')
      await user.type(input.element, 'tag3;')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags[1].text()).toBe('tag1')
      expect(tags[2].text()).toBe('tag2')
      expect(tags[3].text()).toBe('tag3')
    })

    it('should add multiple tags on pasting text with single delimiter character', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()

      await user.click(input.element)
      await user.paste('tag1,tag2,tag3')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags[1].text()).toBe('tag1')
      expect(tags[2].text()).toBe('tag2')
      expect(tags[3].text()).toBe('tag3')
    })

    it('should add multiple tags on pasting text with multiple delimiter characters', async () => {
      const { wrapper, input } = setupDelimiter(/[ ,;]+/)
      const user = userEvent.setup()

      await user.click(input.element)
      await user.paste('tag1, tag2;tag3 tag4')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags[1].text()).toBe('tag1')
      expect(tags[2].text()).toBe('tag2')
      expect(tags[3].text()).toBe('tag3')
      expect(tags[4].text()).toBe('tag4')
    })
  })
})
