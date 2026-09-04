import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import Label from './Label.vue'

describe('test label functionalities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should pass axe accessibility tests', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h('div', [
              h(Label, { for: 'input' }, { default: () => 'Label' }),
              h('input', { id: 'input' }),
            ])
        },
      }),
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('should render without crashing', async () => {
    const label = render(Label)
    expect(label.html()).toBe('<label></label>')
  })

  it('should render with a default slot', async () => {
    const label = render(Label, { slots: { default: 'Label' } })
    expect(label.html()).toBe('<label>Label</label>')
  })

  it('should render with a `for` attribute', async () => {
    const label = render(Label, { props: { for: 'input' } })
    expect(label.html()).toBe('<label for="input"></label>')
  })

  it('should render with a `for` attribute and a default slot', async () => {
    const label = render(Label, {
      props: { for: 'input' },
      slots: { default: 'Label' },
    })
    expect(label.html()).toBe('<label for="input">Label</label>')
  })

  it('should not focus the input when click on the label without a `for` attribute', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () => h('div', [h(Label), h('input', { id: 'input' })])
        },
      }),
    )

    container.getElementsByTagName('label')[0].click()
    await nextTick()
    expect(container.querySelector('input')).not.toBe(document.activeElement)
  })

  it('should not focus the input when click on the label with a `for` attribute that does not match any input', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h('div', [h(Label, { for: 'input' }), h('input', { id: 'input2' })])
        },
      }),
    )

    container.getElementsByTagName('label')[0].click()
    await nextTick()
    expect(container.querySelector('input')).not.toBe(document.activeElement)
  })
})

// Label sets `inheritAttrs: false` and folds attrs into `renderProps`, so they
// must reach the element exactly once on both the default and `#render` paths.
describe('label attrs forwarding', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('forwards class / id / aria-label on the default path and chains a consumer @mousedown after its own', async () => {
    const onMousedown = vi.fn()
    const wrapper = mount(Label, {
      attrs: { 'class': 'x', 'id': 'lbl', 'aria-label': 'Name', onMousedown },
    })
    const label = wrapper.find('label')
    expect(label.classes()).toContain('x')
    expect(label.attributes('id')).toBe('lbl')
    expect(label.attributes('aria-label')).toBe('Name')

    await label.trigger('mousedown', { detail: 2 })
    expect(onMousedown).toHaveBeenCalledTimes(1)
    // Label's own handler ran first (double-click text-selection prevention).
    expect(onMousedown.mock.calls[0][0].defaultPrevented).toBe(true)
  })

  it('forwards attrs and listeners to the consumer element on the #render path', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Label, {
      props: { for: 'input' },
      attrs: { 'class': 'x', 'id': 'lbl', 'data-testid': 'lbl', onClick },
      slots: { render: `<template #render="{ props }"><span v-bind="props">Name</span></template>` },
    })
    expect(wrapper.find('label').exists()).toBe(false)
    const span = wrapper.find('span')
    expect(span.exists()).toBe(true)
    expect(span.classes()).toContain('x')
    expect(span.attributes('id')).toBe('lbl')
    expect(span.attributes('data-testid')).toBe('lbl')
    expect(span.attributes('for')).toBe('input')

    await span.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not warn about extraneous non-props attributes on the #render path', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Label, {
      attrs: { class: 'x', id: 'lbl' },
      slots: { render: `<template #render="{ props }"><span v-bind="props">Name</span></template>` },
    })
    expect(spy.mock.calls.flat().some(arg => typeof arg === 'string' && arg.includes('Extraneous non-props attributes'))).toBe(false)
    spy.mockRestore()
  })
})
