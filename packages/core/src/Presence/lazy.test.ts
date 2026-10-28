import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from '@/Listbox'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { Presence } from '.'

describe('a Presence that has not been present', () => {
  it('does not evaluate its slot', async () => {
    const open = ref(false)
    const slot = vi.fn(() => h('div', { 'data-testid': 'box' }))
    const wrapper = mount(defineComponent(() => () => h(Presence, { present: open.value }, { default: slot })))
    await nextTick()
    expect(slot).not.toHaveBeenCalled()

    open.value = true
    await nextTick()
    expect(slot).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="box"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('exposes `present` reactively before and after its first open', async () => {
    const open = ref(false)
    const presence = ref<InstanceType<typeof Presence>>()
    const wrapper = mount(defineComponent(() => () =>
      h('div', [
        h('span', { 'data-testid': 'state' }, String(presence.value?.present)),
        h(Presence, { present: open.value, ref: presence }, () => h('div')),
      ])))
    await nextTick()
    expect(wrapper.find('[data-testid="state"]').text()).toBe('false')
    open.value = true
    await vi.waitFor(() => expect(wrapper.find('[data-testid="state"]').text()).toBe('true'))
    open.value = false
    await vi.waitFor(() => expect(wrapper.find('[data-testid="state"]').text()).toBe('false'))
    wrapper.unmount()
  })

  it('validates its single child only when it renders (dev)', async () => {
    const open = ref(false)
    const errors: unknown[] = []
    const wrapper = mount(defineComponent(() => () =>
      h(Presence, { present: open.value }, () => [h('div'), h('div')])), {
      global: { config: { errorHandler: error => errors.push(error) } },
    })
    await nextTick()
    expect(errors).toHaveLength(0)
    open.value = true
    await nextTick()
    expect(String(errors[0])).toMatch(/invalid children/)
    wrapper.unmount()
  })
})

describe('item indicators', () => {
  it('an unchecked checkbox indicator mounts no Presence', async () => {
    const checked = ref(false)
    const wrapper = mount(defineComponent(() => () =>
      h(CheckboxRoot, { 'modelValue': checked.value, 'onUpdate:modelValue': (v: any) => checked.value = v }, () =>
        h(CheckboxIndicator, { 'data-testid': 'indicator' }))))
    expect(wrapper.findComponent(Presence).exists()).toBe(false)

    checked.value = true
    await nextTick()
    expect(wrapper.findComponent(Presence).exists()).toBe(true)
    expect(wrapper.find('[data-testid="indicator"]').exists()).toBe(true)

    checked.value = false
    await vi.waitFor(() => expect(wrapper.findComponent(Presence).exists()).toBe(false))
    expect(wrapper.find('[data-testid="indicator"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a force-mounted indicator always mounts its Presence', () => {
    const wrapper = mount(defineComponent(() => () =>
      h(CheckboxRoot, { modelValue: false }, () => h(CheckboxIndicator, { 'forceMount': true, 'data-testid': 'indicator' }))))
    expect(wrapper.find('[data-testid="indicator"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('only the checked radio item mounts a Presence', () => {
    const wrapper = mount(defineComponent(() => () =>
      h(RadioGroupRoot, { modelValue: 'b' }, () => ['a', 'b', 'c'].map(value =>
        h(RadioGroupItem, { value }, () => h(RadioGroupIndicator))))))
    expect(wrapper.findAllComponents(Presence)).toHaveLength(1)
    wrapper.unmount()
  })

  it('only the selected listbox item mounts a Presence, until its exit', async () => {
    const model = ref('b')
    const wrapper = mount(defineComponent(() => () =>
      h(ListboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => model.value = v }, () =>
        h(ListboxContent, null, () => ['a', 'b', 'c'].map(value =>
          h(ListboxItem, { value }, () => h(ListboxItemIndicator, { 'data-testid': `indicator-${value}` })))))))
    await nextTick()
    expect(wrapper.findAllComponents(Presence)).toHaveLength(1)
    expect(wrapper.find('[data-testid="indicator-b"]').exists()).toBe(true)

    model.value = 'c'
    await vi.waitFor(() => expect(wrapper.find('[data-testid="indicator-b"]').exists()).toBe(false))
    expect(wrapper.find('[data-testid="indicator-c"]').exists()).toBe(true)
    expect(wrapper.findAllComponents(Presence)).toHaveLength(1)
    wrapper.unmount()
  })

  describe('with Web Animations', () => {
    let exit: { playState: string, target?: Element, effect: any, finished: Promise<unknown>, finish: () => void } | undefined
    beforeEach(() => {
      exit = undefined
      Element.prototype.getAnimations = function (this: Element) {
        return (exit && exit.target === this && exit.playState === 'running' ? [exit] : []) as unknown as Animation[]
      }
    })
    afterEach(() => {
      // @ts-expect-error restoring jsdom's missing implementation
      delete Element.prototype.getAnimations
    })

    it('a checked indicator enters with `data-starting-style` and stays until its exit finishes', async () => {
      const checked = ref(false)
      const wrapper = mount(defineComponent(() => () =>
        h(CheckboxRoot, { modelValue: checked.value }, () => h(CheckboxIndicator, { 'data-testid': 'indicator' }))))
      const indicator = () => wrapper.find('[data-testid="indicator"]')

      checked.value = true
      await nextTick()
      expect(indicator().attributes('data-starting-style')).toBe('')
      await vi.waitFor(() => expect(indicator().attributes()).not.toHaveProperty('data-starting-style'))

      let resolve!: () => void
      exit = {
        playState: 'running',
        effect: { getComputedTiming: () => ({ endTime: 200 }) },
        finished: new Promise<void>(res => resolve = res),
        finish() {
          exit!.playState = 'finished'
          resolve()
        },
      }
      exit.target = indicator().element
      checked.value = false
      await nextTick()
      await nextTick()
      await nextTick()
      expect(indicator().exists()).toBe(true)
      expect(indicator().attributes('data-ending-style')).toBe('')

      exit.finish()
      await vi.waitFor(() => expect(indicator().exists()).toBe(false))
      expect(wrapper.findComponent(Presence).exists()).toBe(false)
      wrapper.unmount()
    })

    it('an indicator that starts checked does not stamp `data-starting-style`', async () => {
      const wrapper = mount(defineComponent(() => () =>
        h(CheckboxRoot, { modelValue: true }, () => h(CheckboxIndicator, { 'data-testid': 'indicator' }))))
      expect(wrapper.find('[data-testid="indicator"]').attributes()).not.toHaveProperty('data-starting-style')
      wrapper.unmount()
    })
  })
})
