import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from '.'
import TagsInput from './story/_TagsInput.vue'
import TagsInputDisabled from './story/_TagsInputDisabled.vue'
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

    // TODO(v3-port): #3388 Home/End stay with the input when no tag is active (TagsInput source resolved to v3)
    it.skip.each(['Home', 'End'])('should leave %s to the input when no tag is active', async (key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      await nextTick()

      expect(tags.map(tag => tag.attributes('data-state'))).toEqual(tags.map(() => 'unchecked'))
      expect(event.defaultPrevented).toBe(false)
    })

    describe('after pressing on ArrowLeft on input', () => {
      it.each(['Home', 'End'])('should keep %s away from the caret while a tag is active', async (key) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        input.element.dispatchEvent(event)
        await nextTick()

        expect(event.defaultPrevented).toBe(true)
        expect(tags.at(key === 'Home' ? 0 : -1)!.attributes('data-state')).toBe('checked')
      })

      beforeEach(async () => {
        await input.trigger('keydown', {
          key: 'ArrowLeft',
        })
      })

      it('should select the last tags', () => {
        expect(tags.at(-1)!.attributes('data-state')).toBe('checked')
      })

      it('should select the previous tag when press ArrowLeft', async () => {
        await input.trigger('keydown', {
          key: 'ArrowLeft',
        })
        expect(tags.at(-1)!.attributes('data-state')).toBe('unchecked')
        expect(tags[tags.length - 2].attributes('data-state')).toBe('checked')
      })

      it('should select the first item when press Home', async () => {
        await input.trigger('keydown', {
          key: 'Home',
        })
        expect(tags[0].attributes('data-state')).toBe('checked')
        expect(tags.at(-1)!.attributes('data-state')).toBe('unchecked')
      })

      it('should select the last item when press End', async () => {
        await input.trigger('keydown', {
          key: 'Home',
        })
        await input.trigger('keydown', {
          key: 'End',
        })
        expect(tags[0].attributes('data-state')).toBe('unchecked')
        expect(tags.at(-1)!.attributes('data-state')).toBe('checked')
      })

      it('should remove active state when press ArrowRight', async () => {
        await input.trigger('keydown', {
          key: 'ArrowRight',
        })
        expect(tags.at(-1)!.attributes('data-state')).toBe('unchecked')
      })

      describe('after pressing on Backspace', () => {
        let prevTag: DOMWrapper<HTMLElement>
        beforeEach(async () => {
          prevTag = wrapper.find('[data-state="checked"]')
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
          expect(tags.at(-1)!.attributes('data-state')).toBe('checked')
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

    it('should keep focus in the input on keydown:tab that adds a value', async () => {
      await wrapper.setProps({ addOnTab: true })
      await setValueInInput('tag:tab')

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      await flushPromises()

      expect(wrapper.html()).toContain('tag:tab')
      expect(event.defaultPrevented).toBe(true)
    })

    // TODO(v3-port): #3359 Tab leaves the input when addOnTab rejects the draft (TagsInput source resolved to v3)
    it.skip('should let keydown:tab move focus when the draft is a duplicate', async () => {
      await wrapper.setProps({ addOnTab: true })
      await setValueInInput('Test')

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      await flushPromises()

      expect(wrapper.findAll('[data-reka-collection-item]').length).toBe(1)
      expect(event.defaultPrevented).toBe(false)
    })

    // TODO(v3-port): #3359 Tab leaves the input when addOnTab rejects the draft (TagsInput source resolved to v3)
    it.skip('should let keydown:tab move focus when max is reached', async () => {
      // @ts-expect-error TODO(v3-port): #3359 v3's TagsInputRoot has no `max` prop
      await wrapper.setProps({ addOnTab: true, max: 1 })
      await setValueInInput('tag:tab')

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      await flushPromises()

      expect(wrapper.html()).not.toContain('tag:tab')
      expect(event.defaultPrevented).toBe(false)
    })

    it.each(['', '   '])('should let keydown:tab move focus when the draft is %j', async (draft) => {
      await wrapper.setProps({ addOnTab: true })
      await setValueInInput(draft)

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)
      await flushPromises()

      expect(event.defaultPrevented).toBe(false)
    })

    // TODO(v3-port): #3359 Tab leaves the input when addOnTab rejects the draft (TagsInput source resolved to v3)
    it.skip('should emit `invalid` once when a rejected keydown:tab blurs the input', async () => {
      await wrapper.setProps({ addOnTab: true, addOnBlur: true })
      await setValueInInput('Test')

      input.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
      await flushPromises()
      await input.trigger('blur')

      expect(rootComponent.emitted('invalid')?.flat()).toEqual(['Test'])

      input.element.focus()
      await input.trigger('blur')

      expect(rootComponent.emitted('invalid')?.flat()).toEqual(['Test', 'Test'])
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

    async function expectWhitespaceDraftIgnored(trigger: string) {
      await wrapper.setProps({ addOnTab: true, addOnBlur: true })
      await setValueInInput('   ')

      await input.trigger(trigger)
      await flushPromises()

      expect(rootComponent.emitted('addTag')).toBeUndefined()
      expect(wrapper.findAll('[data-reka-collection-item]').length).toBe(1)
    }

    it.each(['keydown.enter', 'keydown.tab'])('should not add a whitespace-only draft on %s', expectWhitespaceDraftIgnored)

    // TODO(v3-port): #3339 blank drafts are not added on blur (TagsInput source resolved to v3)
    it.skip.each(['blur'])('should not add a whitespace-only draft on %s', expectWhitespaceDraftIgnored)
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

    it('should not add an empty tag when pasted text ends with a delimiter', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()
      const before = wrapper.findAll('[data-reka-collection-item]').length

      await user.click(input.element)
      await user.paste('tag1,tag2,')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags.length).toBe(before + 2)
      expect(tags[before].text()).toBe('tag1')
      expect(tags[before + 1].text()).toBe('tag2')
    })

    it('should trim whitespace around pasted tags', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()
      const before = wrapper.findAll('[data-reka-collection-item]').length

      await user.click(input.element)
      await user.paste('tag1, tag2')

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags.length).toBe(before + 2)
      // `text()` trims, so assert on the emitted value instead
      const emitted = wrapper.getComponent({ name: 'TagsInputRoot' }).emitted('update:modelValue') as string[][][]
      expect(emitted.at(-1)![0].slice(-2)).toEqual(['tag1', 'tag2'])
    })

    it('should not add a tag when pasting only whitespace', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()
      const before = wrapper.findAll('[data-reka-collection-item]').length

      await user.click(input.element)
      await user.paste('   ')

      expect(wrapper.findAll('[data-reka-collection-item]').length).toBe(before)
    })

    it('should not add a tag when pressing Enter with a whitespace-only draft', async () => {
      const { wrapper, input } = setupDelimiter(',')
      const user = userEvent.setup()
      const before = wrapper.findAll('[data-reka-collection-item]').length

      await user.type(input.element, '   {Enter}')

      expect(wrapper.findAll('[data-reka-collection-item]').length).toBe(before)
    })

    it('should keep the default Enter action for a blank draft', async () => {
      const { input } = setupDelimiter(',')
      const user = userEvent.setup()

      await user.type(input.element, '   ')
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('should cancel the default Enter action for a non-blank draft', async () => {
      const { input } = setupDelimiter(',')
      const user = userEvent.setup()

      await user.type(input.element, 'tag')
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      input.element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
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

    async function expectPastedTags(delimiter: string | RegExp, text: string, expected: string[]) {
      const { wrapper, input } = setupDelimiter(delimiter)
      const user = userEvent.setup()

      await user.click(input.element)
      await user.paste(text)

      expect(wrapper.getComponent({ name: 'TagsInputRoot' }).emitted('addTag')?.flat() ?? []).toEqual(expected)
    }

    it.each([
      [',', 'tag1,tag2,', ['tag1', 'tag2']],
      [',', 'tag1,,tag2', ['tag1', 'tag2']],
      [',', 'tag1, ,tag2', ['tag1', 'tag2']],
      [',', '   ', []],
      [/[ ,;\t\n\r]+/, 'tag1\r\ntag2\r\n', ['tag1', 'tag2']],
    ])('should add only non-blank tags on paste (delimiter %s, text %j)', expectPastedTags)

    // TODO(v3-port): #3339 paste splits on a regex delimiter with a capture group and keeps untrimmed parts (TagsInput source resolved to v3)
    it.skip.each([
      [/,(\s+)?/, 'tag1,tag2', ['tag1', 'tag2']],
      // Not trimmed, like a typed draft
      [',', 'tag1, tag2', ['tag1', ' tag2']],
    ])('should add only non-blank tags on paste (delimiter %s, text %j)', expectPastedTags)

    it('should not create tag when delimiter is typed during IME composition', async () => {
      const { wrapper, input } = setupDelimiter(',')

      input.element.focus()
      await input.trigger('compositionstart')
      input.element.value = ','
      await input.trigger('input', { data: ',' })
      await nextTick()

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags.length).toBe(1)
      expect(input.element.value).toBe(',')
    })

    it('should process value after composition ends', async () => {
      const { wrapper, input } = setupDelimiter(',')

      input.element.focus()
      await input.trigger('compositionstart')
      input.element.value = 'hello,'
      await input.trigger('input', { data: ',' })
      await nextTick()

      expect(wrapper.findAll('[data-reka-collection-item]').length).toBe(1)

      await input.trigger('compositionend')
      await nextTick()

      input.element.value = 'hello,'
      await input.trigger('input', { data: ',' })
      await nextTick()

      const tags = wrapper.findAll('[data-reka-collection-item]')
      expect(tags.length).toBe(2)
      expect(tags[1].text()).toBe('hello')
    })
  })
})

describe('given TagsInput with a disabled item before a removable one', () => {
  // @ts-expect-error we return empty object
  window.getComputedStyle = () => ({})
  let wrapper: VueWrapper<InstanceType<typeof TagsInputDisabled>>
  let input: DOMWrapper<HTMLInputElement>
  let rootComponent: Omit<VueWrapper, 'exists'>

  beforeEach(() => {
    wrapper = mount(TagsInputDisabled, { attachTo: document.body })
    rootComponent = wrapper.getComponent({ name: 'TagsInputRoot' })
    input = wrapper.find('input')
    input.element.focus()
  })

  it('removes the selected removable tag, not the disabled one', async () => {
    // First Backspace selects the last removable tag, second removes it.
    await input.trigger('keydown', { key: 'Backspace' })
    await input.trigger('keydown', { key: 'Backspace' })

    const tags = wrapper.findAll('[data-reka-collection-item]')
    expect(tags.map(tag => tag.text())).toEqual(['Disabled'])
    expect(rootComponent.emitted('removeTag')?.[0]?.[0]).toEqual('Removable')
  })

  it('does not remove the disabled tag when it is the only remaining tag', async () => {
    await input.trigger('keydown', { key: 'Backspace' })
    await input.trigger('keydown', { key: 'Backspace' })
    // Only the disabled tag remains; further backspaces must not remove it.
    await input.trigger('keydown', { key: 'Backspace' })
    await input.trigger('keydown', { key: 'Backspace' })

    const tags = wrapper.findAll('[data-reka-collection-item]')
    expect(tags.map(tag => tag.text())).toEqual(['Disabled'])
  })
})

// TODO(v3-port): #3308 remove the selected occurrence of a duplicate tag / `modelIndex` (TagsInput source resolved to v3)
describe.skip('given duplicate tags', () => {
  it.each(['click', 'Backspace'])('uses the model index with %s when an earlier duplicate is hidden', async (action) => {
    const wrapper = mount(defineComponent({
      components: { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputRoot },
      template: `<TagsInputRoot v-slot="{ modelValue }" duplicate :default-value="['a', 'b', 'a']">
        <TagsInputItem v-for="(value, index) in modelValue.slice(1)" :key="index" :value="value" :model-index="index + 1">
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput />
      </TagsInputRoot>`,
    }), { attachTo: document.body })

    await nextTick()
    if (action === 'click') {
      await wrapper.findAll('button')[1].trigger('click')
    }
    else {
      const input = wrapper.get('input')
      await input.trigger('keydown', { key: 'Backspace' })
      await input.trigger('keydown', { key: 'Backspace' })
    }

    expect(wrapper.getComponent(TagsInputRoot).emitted('update:modelValue')).toEqual([[['a', 'b']]])
    wrapper.unmount()
  })

  it('falls back to the rendered occurrence when the model index does not match', async () => {
    const wrapper = mount(defineComponent({
      components: { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputRoot },
      template: `<TagsInputRoot v-slot="{ modelValue }" :default-value="['a', 'b', 'c']">
        <TagsInputItem v-for="(value, index) in modelValue.slice(1)" :key="value" :value="value" :model-index="index">
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput />
      </TagsInputRoot>`,
    }), { attachTo: document.body })

    await nextTick()
    await wrapper.findAll('button')[1].trigger('click')

    expect(wrapper.getComponent(TagsInputRoot).emitted('update:modelValue')).toEqual([[['a', 'b']]])
    wrapper.unmount()
  })

  it.each(['click', 'Backspace'])('removes the selected occurrence with %s', async (action) => {
    const wrapper = mount(defineComponent({
      components: { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot },
      template: `<TagsInputRoot v-slot="{ modelValue }" duplicate :default-value="['hidden', 'a', 'b', 'a']">
        <TagsInputItem v-for="(value, index) in modelValue.slice(1)" :key="index" :value="value" :disabled="index === 0">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput />
      </TagsInputRoot>`,
    }), { attachTo: document.body })

    await nextTick()
    if (action === 'click') {
      await wrapper.findAll('button')[2].trigger('click')
    }
    else {
      const input = wrapper.get('input')
      await input.trigger('keydown', { key: 'Backspace' })
      await input.trigger('keydown', { key: 'Backspace' })
    }

    expect(wrapper.getComponent(TagsInputRoot).emitted('update:modelValue')).toEqual([[['hidden', 'a', 'b']]])
    wrapper.unmount()
  })
})

describe('given a TagsInputItemDelete with an aria-label', () => {
  // TODO(v3-port): #3279 consumer aria-label names the item delete button (TagsInput source resolved to v3)
  it.skip('should not override the aria-label with aria-labelledby', () => {
    const wrapper = mount(defineComponent({
      components: { TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot },
      template: `<TagsInputRoot :model-value="['Me']">
        <TagsInputItem value="Me">
          <TagsInputItemText />
          <TagsInputItemDelete aria-label="Remove Me" />
        </TagsInputItem>
      </TagsInputRoot>`,
    }), { attachTo: document.body })

    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Remove Me')
    expect(button.attributes('aria-labelledby')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('given TagsInput inside a form', () => {
  function mountInForm(inputAttrs: Record<string, unknown> = {}) {
    const values = ref<string[]>([])
    const Form = defineComponent({
      setup() {
        return () => h('form', [
          h(TagsInputRoot<string>, {
            'modelValue': values.value,
            'onUpdate:modelValue': (v: string[]) => { values.value = v },
          }, {
            default: ({ modelValue }: { modelValue: string[] }) => [
              ...modelValue.map(item => h(TagsInputItem, { key: item, value: item }, () => h(TagsInputItemText))),
              h(TagsInputInput, inputAttrs),
            ],
          }),
        ])
      },
    })
    const wrapper = mount(Form, { attachTo: document.body })
    const input = wrapper.find('input').element as HTMLInputElement
    return { wrapper, input, values }
  }

  function pressEnter(input: HTMLInputElement) {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    input.dispatchEvent(event)
    return event
  }

  it('prevents implicit submission synchronously and adds the draft', async () => {
    const { wrapper, input, values } = mountInForm()
    input.value = 'draft'

    const event = pressEnter(input)
    // the form submits right after dispatch, so this must be set before any tick
    expect(event.defaultPrevented).toBe(true)

    await flushPromises()
    expect(values.value).toEqual(['draft'])
    expect(input.value).toBe('')
    wrapper.unmount()
  })

  it.each(['', '   '])('does not prevent submission when the draft is %j', async (draft) => {
    const { wrapper, input, values } = mountInForm()
    input.value = draft

    const event = pressEnter(input)
    expect(event.defaultPrevented).toBe(false)

    await flushPromises()
    expect(values.value).toEqual([])
    wrapper.unmount()
  })

  it('lets a consumer `@keydown.enter.prevent` opt out of adding the draft', async () => {
    const onKeydown = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const { wrapper, input, values } = mountInForm({ onKeydown })
    input.value = 'draft'

    const event = pressEnter(input)
    expect(onKeydown).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)

    await flushPromises()
    expect(values.value).toEqual([])
    expect(input.value).toBe('draft')
    wrapper.unmount()
  })
})

describe('given a TagsInputInput rendered as-child without an element', () => {
  // TODO(v3-port): #3223 useForwardExpose never resolves to an element outside the forwarded child (shared source resolved to v3)
  it.skip('should not auto focus an unrelated input that follows it', async () => {
    vi.useFakeTimers()
    const wrapper = mount(defineComponent({
      components: { TagsInputInput, TagsInputRoot },
      template: `<TagsInputRoot :model-value="[]">
        <TagsInputInput as-child auto-focus><template v-if="false"><input /></template></TagsInputInput><input data-testid="outsider" />
      </TagsInputRoot>`,
    }), { attachTo: document.body })

    try {
      await flushPromises()
      vi.runAllTimers()
      expect(document.activeElement).not.toBe(wrapper.get('[data-testid="outsider"]').element)
    }
    finally {
      vi.useRealTimers()
      wrapper.unmount()
    }
  })
})
