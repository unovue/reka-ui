import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { handleSubmit, sleep } from '@/test'
import { RadioGroupItem, RadioGroupRoot } from '..'
import Radio from './story/_Radio.vue'
import RadioGroup from './story/_RadioGroup.vue'

describe('given a default RadioGroup', () => {
  let wrapper: VueWrapper<InstanceType<typeof RadioGroup>>
  let radios: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(RadioGroup, { attachTo: document.body })
    radios = wrapper.findAll('[role=radio]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected', () => {
    expect(radios[0].attributes('data-state')).toBe('checked')
  })

  it('should render icons', () => {
    expect(radios[0].find('span').exists()).toBeTruthy()
  })

  describe('on keyboard navigation', () => {
    beforeEach(async () => {
      radios[0].element.focus()
      await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
      await sleep(0)
    })

    it('should emit `select` event', async () => {
      const radiosComponent = wrapper.findAllComponents(RadioGroupItem) as VueWrapper[]
      expect(radiosComponent[2].emitted('select')?.[0]?.[0]).toBeTruthy()
    })

    it('should skip disabled item', () => {
      expect(radios[1].attributes('data-state')).toBe('unchecked')
      expect(radios[2].element).toBe(document.activeElement)
    })

    it('should select next item on keydown', async () => {
      expect(radios[0].attributes('data-state')).toBe('unchecked')
      expect(radios[2].attributes('data-state')).toBe('checked')
      expect(radios[2].element).toBe(document.activeElement)
    })

    describe('on arrow up', () => {
      it('should select the first item again', async () => {
        await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        await sleep(0)
        expect(radios[0].attributes('data-state')).toBe('checked')
        expect(radios[2].attributes('data-state')).toBe('unchecked')
      })
    })
  })
})

describe('given disabled RadioGroup', () => {
  let wrapper: VueWrapper<InstanceType<typeof RadioGroup>>
  let radios: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(RadioGroup, { attachTo: document.body, props: { disabled: true } })
    radios = wrapper.findAll('[role=radio]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected', () => {
    expect(radios[0].attributes('data-state')).toBe('checked')
  })

  it.each([[0, 'checked'], [1, 'unchecked'], [2, 'unchecked']])('should not select any item', async (input, output) => {
    await radios[input].trigger('click')
    expect(radios[input].attributes('data-state')).toBe(output)
  })

  it.each([[0], [1], [2]])('should have disabled attribute on item', async (input) => {
    expect(radios[input].attributes('disabled')).toBe('')
    expect(radios[input].attributes('data-disabled')).toBe('')
  })
})

describe('given a RadioGroupItem whose label is not found', () => {
  it('should not fall back to the value as the accessible name', async () => {
    document.body.innerHTML = ''
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      template: '<RadioGroupRoot><RadioGroupItem id="r1" value="event_type" /></RadioGroupRoot>',
    }, { attachTo: document.body })
    await nextTick()

    expect(wrapper.find('[role=radio]').attributes('aria-label')).toBeUndefined()
    wrapper.unmount()
  })

  it('should resolve aria-label from an associated [for] label', async () => {
    document.body.innerHTML = '<label for="r2">Event type</label>'
    // jsdom has no real `innerText`; mock it so the `[for]` lookup is exercised.
    Object.defineProperty(document.querySelector('[for="r2"]'), 'innerText', { value: 'Event type', configurable: true })
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      template: '<RadioGroupRoot><RadioGroupItem id="r2" value="event_type" /></RadioGroupRoot>',
    }, { attachTo: document.body })
    await nextTick()

    expect(wrapper.find('[role=radio]').attributes('aria-label')).toBe('Event type')
    wrapper.unmount()
  })

  it('should prefer an explicit aria-label over the [for] label', async () => {
    document.body.innerHTML = '<label for="r3">Event type</label>'
    Object.defineProperty(document.querySelector('[for="r3"]'), 'innerText', { value: 'Event type', configurable: true })
    const wrapper = mount({
      components: { RadioGroupItem, RadioGroupRoot },
      template: '<RadioGroupRoot><RadioGroupItem id="r3" value="event_type" aria-label="Explicit" /></RadioGroupRoot>',
    }, { attachTo: document.body })
    await nextTick()

    expect(wrapper.find('[role=radio]').attributes('aria-label')).toBe('Explicit')
    wrapper.unmount()
  })
})

describe('given radio in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Radio },
    template: '<form @submit="handleSubmit"><Radio  /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="Radio"]').exists()).toBe(true)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not nest the hidden input inside the interactive control', () => {
    expect(wrapper.find('button input').exists()).toBe(false)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'true' })
    })
  })

  describe('after uncheck and click submit button again', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: 'true' })
    })
  })
})
