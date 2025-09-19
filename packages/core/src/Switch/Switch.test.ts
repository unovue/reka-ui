import { fireEvent, render, screen } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { handleSubmit } from '@/test'
import Switch from './_Switch.vue'

describe('test switch functionalities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(Switch)
    expect(await axe(wrapper.element, {
      rules: {
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('thumb can render', async () => {
    render(Switch)
    screen.getByTestId('thumb')
  })

  it('clicking thumb will toggle value', async () => {
    const { container } = render(Switch)
    const root = container.querySelector('button')!
    screen.getByText('unchecked')

    await fireEvent.click(root)
    screen.getByText('checked')

    await fireEvent.click(root)
    screen.getByText('unchecked')
  })

  it('keydown enter root will toggle value', async () => {
    const { container } = render(Switch)
    const button = container.querySelector('button')!
    screen.getByText('unchecked')

    await fireEvent.keyDown(button, { key: 'Enter' })
    screen.getByText('checked')

    await fireEvent.keyDown(button, { key: 'Enter' })
    screen.getByText('unchecked')
  })
})

describe('given switch in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Switch },
    template: '<form @submit="handleSubmit"><Switch /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="checkbox"]').exists()).toBe(true)
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
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ })
    })
  })
})
