import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import Rating from './story/_Rating.vue'

describe('given a default Rating', () => {
  let wrapper: VueWrapper<InstanceType<typeof Rating>>
  let ratings: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Rating, { props: { defaultValue: 1 } })
    ratings = wrapper.findAll('[role=radio]')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected', () => {
    expect(ratings[0].attributes('data-state')).toBe('active')
  })

  describe('on keyboard navigation', () => {
    describe('on arrow right', () => {
      beforeEach(async () => {
        ratings[0].element.focus()
      })

      it('should emit `update:modelValue` event', async () => {
        expect(document.activeElement).toBe(ratings[0].element)
        expect(wrapper.emitted()).toBe({})
      })
    })
  })
})

// describe('given disabled RadioGroup', () => {
//   let wrapper: VueWrapper<InstanceType<typeof RadioGroup>>
//   let radios: DOMWrapper<HTMLElement>[]

//   beforeEach(() => {
//     document.body.innerHTML = ''
//     wrapper = mount(RadioGroup, { attachTo: document.body, props: { disabled: true } })
//     radios = wrapper.findAll('[role=radio]')
//   })

//   it('should pass axe accessibility tests', async () => {
//     expect(await axe(wrapper.element)).toHaveNoViolations()
//   })

//   it('should have default selected', () => {
//     expect(radios[0].attributes('data-state')).toBe('checked')
//   })

//   it.each([[0, 'checked'], [1, 'unchecked'], [2, 'unchecked']])('should not select any item', async (input, output) => {
//     await radios[input].trigger('click')
//     expect(radios[input].attributes('data-state')).toBe(output)
//   })

//   it.each([[0], [1], [2]])('should have disabled attribute on item', async (input) => {
//     expect(radios[input].attributes('disabled')).toBe('')
//     expect(radios[input].attributes('data-disabled')).toBe('')
//   })
// })

// describe('given radio in a form', async () => {
//   const wrapper = mount({
//     props: ['handleSubmit'],
//     components: { Radio },
//     template: '<form @submit="handleSubmit"><Radio  /></form>',
//   }, {
//     props: { handleSubmit },
//   })

//   it('should have hidden input field', async () => {
//     expect(wrapper.find('[type="Radio"]').exists()).toBe(true)
//   })

//   describe('after clicking submit button', () => {
//     beforeEach(async () => {
//       await wrapper.find('button').trigger('click')
//       await wrapper.find('form').trigger('submit')
//     })

//     it('should trigger submit once', () => {
//       expect(handleSubmit).toHaveBeenCalledTimes(1)
//       expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: 'true' })
//     })
//   })

//   describe('after uncheck and click submit button again', () => {
//     beforeEach(async () => {
//       await wrapper.find('button').trigger('click')
//       await wrapper.find('form').trigger('submit')
//     })

//     it('should trigger submit once', () => {
//       expect(handleSubmit).toHaveBeenCalledTimes(2)
//       expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: 'true' })
//     })
//   })
// })
