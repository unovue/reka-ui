import { fireEvent, render, screen } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { handleSubmit } from '@/test'
import Switch from './_Switch.vue'
import SwitchRoot from './SwitchRoot.vue'

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

// Locks the surface the black-box suite above misses (id, aria-label / [for]
// label, consumer-listener chaining, disabled, controlled emit) BEFORE the
// useSwitch refactor — a regression there fails here instead of shipping.
describe('switchRoot characterization (pre-refactor contract)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the id attribute on the control', () => {
    const wrapper = mount(SwitchRoot, { props: { id: 'sw1' } })
    expect(wrapper.find('button').attributes('id')).toBe('sw1')
  })

  it('resolves aria-label from an associated [for] label', async () => {
    document.body.innerHTML = '<label for="sw1">Wifi</label>'
    // jsdom has no real `innerText`; mock it so the `[for]` lookup is exercised.
    Object.defineProperty(document.querySelector('[for="sw1"]'), 'innerText', { value: 'Wifi', configurable: true })
    const wrapper = mount(SwitchRoot as any, { props: { id: 'sw1' }, attachTo: document.body })
    await nextTick()
    expect(wrapper.find('button').attributes('aria-label')).toBe('Wifi')
    wrapper.unmount()
  })

  it('prefers an explicit aria-label over the [for] label', async () => {
    document.body.innerHTML = '<label for="sw2">Wifi</label>'
    Object.defineProperty(document.querySelector('[for="sw2"]'), 'innerText', { value: 'Wifi', configurable: true })
    const wrapper = mount(SwitchRoot as any, { props: { id: 'sw2' }, attrs: { 'aria-label': 'Explicit' }, attachTo: document.body })
    await nextTick()
    expect(wrapper.find('button').attributes('aria-label')).toBe('Explicit')
    wrapper.unmount()
  })

  // Controlled model: the toggle emits synchronously, so the consumer listener
  // running first means it sees the pre-toggle state (v2 `v-bind` / `@click` order).
  it('runs a consumer @click before the internal toggle (both fire, consumer first)', async () => {
    const order: string[] = []
    const onClick = vi.fn(() => order.push('consumer'))
    const wrapper = mount(SwitchRoot as any, {
      props: { 'modelValue': false, 'onUpdate:modelValue': () => order.push('update') },
      attrs: { onClick },
    })
    await wrapper.find('button').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(order).toEqual(['consumer', 'update'])
  })

  it('runs a consumer @keydown before the internal Enter toggle', async () => {
    const order: string[] = []
    const onKeydown = vi.fn(() => order.push('consumer'))
    const wrapper = mount(SwitchRoot as any, {
      props: { 'modelValue': false, 'onUpdate:modelValue': () => order.push('update') },
      attrs: { onKeydown },
    })
    await wrapper.find('button').trigger('keydown', { key: 'Enter' })
    expect(onKeydown).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(order).toEqual(['consumer', 'update'])
  })

  it('lets a consumer attribute override the component\'s own (v2 precedence)', () => {
    const wrapper = mount(SwitchRoot as any, { attrs: { role: 'menuitemcheckbox' } })
    expect(wrapper.find('button').attributes('role')).toBe('menuitemcheckbox')
  })

  it('does not toggle when disabled', async () => {
    const wrapper = mount(SwitchRoot as any, { props: { disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:modelValue without mutating a controlled model', async () => {
    const wrapper = mount(SwitchRoot as any, { props: { modelValue: false } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    // controlled: the rendered state stays until the parent updates the prop
    expect(wrapper.find('button').attributes('data-state')).toBe('unchecked')
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
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ })
    })
  })
})
