import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { sleep } from '@/test'
import { RatingRoot } from '..'
import Rating from './story/_Rating.vue'

describe('given a default Rating', () => {
  let wrapper: VueWrapper<InstanceType<typeof Rating>>
  let radios: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Rating, { attachTo: document.body, props: { defaultValue: 1, length: 3, orientation: 'vertical' } })
    radios = wrapper.findAll('[role=radio]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected', () => {
    expect(radios[0].attributes('data-state')).toBe('active')
    expect(radios[1].attributes('data-state')).toBeUndefined()
    expect(radios[2].attributes('data-state')).toBeUndefined()
  })

  describe('on keyboard navigation', () => {
    beforeEach(async () => {
      radios[0].element.focus()
      await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
      await sleep(0)
    })

    it('should emit `update:modelValue` on keyboard navigation', async () => {
      const root = wrapper.findComponent(RatingRoot)
      expect(root.emitted('update:modelValue')?.[0]?.[0]).toBe(2)
    })

    it('should select next item on keydown', async () => {
      expect(radios[0].attributes('data-state')).toBe('active')
      expect(radios[1].attributes('data-state')).toBe('active')
      expect(radios[1].element).toBe(document.activeElement)
    })

    describe('on arrow up', () => {
      it('should select the first item again', async () => {
        await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        await sleep(0)
        expect(radios[0].attributes('data-state')).toBe('active')
        expect(radios[2].attributes('data-state')).toBeUndefined()
      })
    })
  })
})

describe('given disabled Rating', () => {
  let wrapper: VueWrapper<InstanceType<typeof Rating>>
  let radios: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Rating, { attachTo: document.body, props: { defaultValue: 1, disabled: true, length: 3 } })
    radios = wrapper.findAll('[role=radio]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected', () => {
    expect(radios[0].attributes('data-state')).toBe('active')
  })

  it.each([[0, 'active'], [1, undefined], [2, undefined]])('should not select any item', async (input, output) => {
    await radios[input].trigger('click')
    expect(radios[input].attributes('data-state')).toBe(output)
  })

  it.each([[0], [1], [2]])('should have disabled attribute on item', async (input) => {
    expect(radios[input].attributes('disabled')).toBe('')
    expect(radios[input].attributes('data-disabled')).toBe('')
  })
})
