import type { VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import Accordion from './story/_Accordion.vue'

describe('given a single Accordion', () => {
  let wrapper: VueWrapper<InstanceType<typeof Accordion>>
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Accordion, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when navigating by keyboard', () => {
    beforeEach(() => {
      const trigger = wrapper.find('button')
      trigger.element.focus()
    })

    describe('on `ArrowDown`', () => {
      it('should move focus to the next trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        const trigger = wrapper.findAll('button')[1].element
        expect(trigger).toBe(document.activeElement)
      })

      it('should move focus to the first item if at the end', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[3].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        expect(triggers[0]).toBe(document.activeElement)
      })
    })

    describe('on `ArrowUp`', () => {
      it('should move focus to the previous trigger', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[2].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(triggers[1]).toBe(document.activeElement)
      })

      it('should move focus to the last item if at the beginning', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[0].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(triggers[3]).toBe(document.activeElement)
      })
    })

    describe('on `Home`', () => {
      it('should move focus to the first trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'Home' })
        expect(wrapper.findAll('button')[0].element).toBe(document.activeElement)
      })
    })

    describe('on `End`', () => {
      it('should move focus to the last trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'End' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })
  })

  describe('when clicking a trigger', () => {
    let trigger: HTMLButtonElement
    let contentOne: HTMLElement | null

    beforeEach(async () => {
      trigger = wrapper.find('button').element
      fireEvent.click(trigger)
      contentOne = await findByText(wrapper.element as HTMLElement, 'Content One')
    })

    it('should show the content', () => {
      expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
    })

    it('should call update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('One')
    })

    describe('then clicking the trigger again', () => {
      it('should not close the content', () => {
        fireEvent.click(trigger)
        expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
      })

      it('should not call update:modelValue', () => {
        fireEvent.click(trigger)
        expect(wrapper.emitted('update:modelValue')?.length).toBe(1)
      })
    })

    describe('then clicking another trigger', () => {
      beforeEach(() => {
        const trigger = wrapper.findAll('button')[1].element
        fireEvent.click(trigger)
      })

      it('should show the new content', async () => {
        const contentTwo = await findByText(wrapper.element as HTMLElement, 'Content Two')
        expect(document.body.innerHTML).toContain(contentTwo?.innerHTML)
      })

      it('should call update:modelValue', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toBe('Two')
      })

      it('should hide the previous content', () => {
        expect(document.body.innerHTML).not.toContain(contentOne?.innerHTML)
      })
    })
  })
})

describe('given a multiple Accordion', () => {
  let wrapper: VueWrapper<InstanceType<typeof Accordion>>
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Accordion, { props: { type: 'multiple' }, attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when navigating by keyboard', () => {
    beforeEach(() => {
      wrapper.find('button').element.focus()
    })

    describe('on `ArrowDown`', () => {
      it('should move focus to the next trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        expect(wrapper.findAll('button')[1].element).toBe(document.activeElement)
      })
    })

    describe('on `ArrowUp`', () => {
      it('should move focus to the previous trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })

    describe('on `Home`', () => {
      it('should move focus to the first trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'Home' })
        expect(wrapper.findAll('button')[0].element).toBe(document.activeElement)
      })
    })

    describe('on `End`', () => {
      it('should move focus to the last trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'End' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })
  })

  describe('when clicking a trigger', () => {
    let trigger: HTMLButtonElement
    let contentOne: HTMLElement | null

    beforeEach(async () => {
      trigger = wrapper.find('button').element
      fireEvent.click(trigger)
      contentOne = await findByText(wrapper.element as HTMLElement, 'Content One')
    })

    it('should show the content', () => {
      expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
    })

    it('should call update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toMatchObject(['One'])
    })

    describe('then clicking the trigger again', () => {
      beforeEach(() => {
        fireEvent.click(trigger)
      })

      it('should hide the content', () => {
        expect(document.body.innerHTML).not.toContain(contentOne?.innerHTML)
      })

      it('should call update:modelValue', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toMatchObject([])
      })
    })

    describe('then clicking another trigger', () => {
      beforeEach(() => {
        const trigger = wrapper.findAll('button')[1].element
        fireEvent.click(trigger)
      })

      it('should show the new content', async () => {
        const contentTwo = await findByText(wrapper.element as HTMLElement, 'Content Two')
        expect(document.body.innerHTML).toContain(contentTwo.innerHTML)
      })

      it('should call onValueChange', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toMatchObject(['One', 'Two'])
      })

      it('should not hide the previous content', () => {
        expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
      })
    })
  })
})
