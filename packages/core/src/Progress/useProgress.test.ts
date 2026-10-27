import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ProgressIndicator, ProgressRoot } from '.'
import * as Reka from '../index'
import { useProgress } from './useProgress'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useProgress', () => {
  it('derives state, aria and data attributes', () => {
    const value = ref<number | null>(30)
    const { state, root, indicator } = useProgress({ modelValue: value })
    expect(state.value).toBe('loading')
    expect(root.attrs.value).toMatchObject({
      'role': 'progressbar',
      'aria-valuenow': 30,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-label': '30%',
      'data-state': 'loading',
      'data-value': '30',
      'data-max': '100',
    })
    value.value = 100
    expect(indicator.attrs.value).toEqual({ 'data-state': 'complete', 'data-value': '100', 'data-max': '100' })
    value.value = null
    expect(state.value).toBe('indeterminate')
    expect(root.attrs.value['aria-valuenow']).toBeUndefined()
    expect(root.attrs.value).not.toHaveProperty('data-value')
  })

  it('treats an invalid value or max as indeterminate / 100, with an error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { value, max, state } = useProgress({ modelValue: 150, max: -1 })
    expect(max.value).toBe(100)
    expect(value.value).toBeNull()
    expect(state.value).toBe('indeterminate')
    expect(error).toHaveBeenCalledTimes(2)
  })

  it('uses getValueLabel / getValueText', () => {
    const { root } = useProgress({
      modelValue: 2,
      max: 4,
      getValueLabel: (v, m) => `${v} of ${m}`,
      getValueText: v => `${v} files`,
    })
    expect(root.attrs.value).toMatchObject({ 'aria-label': '2 of 4', 'aria-valuetext': '2 files' })
  })

  it('renders standalone and passes axe', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        const { root, indicator } = useProgress({ modelValue: 40 })
        return () => h('div', root.attrs.value, [h('div', indicator.attrs.value)])
      },
    }))
    expect(wrapper.attributes('aria-valuenow')).toBe('40')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useProgress).toBe('function')
  })
})

describe('progressRoot — invalid props', () => {
  it('renders the corrected value and emits it once (v2 correction, no details)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ProgressRoot, {
      props: { modelValue: 150 },
      slots: { default: () => h(ProgressIndicator) },
    })
    expect(wrapper.attributes('data-state')).toBe('indeterminate')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('does not emit for a valid value', async () => {
    const wrapper = mount(ProgressRoot, { props: { modelValue: 50 } })
    await nextTick()
    await wrapper.setProps({ modelValue: 60 })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.attributes('data-value')).toBe('60')
  })

  it('emits null when `max` drops below the value', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ProgressRoot, { props: { modelValue: 80, max: 100 } })
    await nextTick()
    await wrapper.setProps({ max: 50 })
    await nextTick()
    expect(wrapper.attributes('data-state')).toBe('indeterminate')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('labels the value as a percentage of max by default', () => {
    const wrapper = mount(ProgressRoot, { props: { modelValue: 25, max: 50 } })
    expect(wrapper.attributes('aria-label')).toBe('50%')
  })
})
