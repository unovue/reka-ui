import type { ChangeEventDetails } from './types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref, useModel } from 'vue'
import { SwitchRoot } from '@/Switch'

/**
 * #2828 "pairing with Vue `v-model`" investigation, settled with real
 * runtime-compiled templates (the same compiler path as SFC templates):
 *
 * 1. `v-model` consumes only the first argument, and an explicit
 *    `@update:*` listener next to it receives the details, in either source order.
 * 2. Cancelling in `@before-update:*` stops the `v-model` writer: `update:*`
 *    never fires, so the parent ref is never written.
 * 3. `@before-update:*` is a plain listener (`onBeforeUpdate:modelValue`), not
 *    a second model listener.
 * 4. A `defineModel` / `useModel` wrapper re-emits a single argument, so the
 *    details stop at the wrapper unless it forwards them itself.
 * 5. Uncontrolled emits are synchronous with the interaction.
 */
type Details = ChangeEventDetails<string>

describe('v-model pairing (#2828)', () => {
  it.each([
    ['v-model first', `<SwitchRoot v-model="checked" @update:model-value="onUpdate" />`],
    ['listener first', `<SwitchRoot @update:model-value="onUpdate" v-model="checked" />`],
  ])('an explicit @update listener next to v-model receives the details (%s)', async (_, template) => {
    const onUpdate = vi.fn((_value: boolean, _details: Details) => {})
    const wrapper = mount(defineComponent({
      components: { SwitchRoot },
      setup: () => ({ checked: ref(false), onUpdate }),
      template,
    }))
    await wrapper.find('button').trigger('click')

    expect((wrapper.vm as unknown as { checked: boolean }).checked).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe(true)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'trigger-press', isCanceled: false })
    expect(onUpdate.mock.calls[0][1].event).toBeInstanceOf(MouseEvent)
  })

  it('cancelling @before-update stops the v-model writer and the update listener', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      components: { SwitchRoot },
      setup: () => ({
        checked: ref(false),
        onUpdate,
        onBeforeUpdate: (_value: boolean, details: Details) => details.cancel(),
      }),
      template: `<SwitchRoot v-model="checked" @before-update:model-value="onBeforeUpdate" @update:model-value="onUpdate" />`,
    }))
    await wrapper.find('button').trigger('click')

    expect((wrapper.vm as unknown as { checked: boolean }).checked).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(wrapper.find('button').attributes('data-state')).toBe('unchecked')
  })

  it('`@before-update:model-value` compiles to a plain `onBeforeUpdate:modelValue` listener', () => {
    const Probe = defineComponent({
      props: ['modelValue'],
      emits: ['beforeUpdate:modelValue', 'update:modelValue'],
      setup: (_, { attrs }) => ({ attrs }),
      template: `<span />`,
    })
    const onBefore = vi.fn()
    const wrapper = mount(defineComponent({
      components: { Probe },
      setup: () => ({ value: ref(1), onBefore }),
      template: `<Probe v-model="value" @before-update:model-value="onBefore" />`,
    }))
    const vnodeProps = wrapper.findComponent(Probe).vm.$.vnode.props!
    expect(Object.keys(vnodeProps).sort()).toEqual(['modelValue', 'onBeforeUpdate:modelValue', 'onUpdate:modelValue'])
    expect(vnodeProps['onBeforeUpdate:modelValue']).toBe(onBefore)
  })

  it('a defineModel (useModel) wrapper drops the details on its own update emit', async () => {
    const Wrapper = defineComponent({
      components: { SwitchRoot },
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup: props => ({ model: useModel(props, 'modelValue') }),
      template: `<SwitchRoot v-model="model" />`,
    })
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      components: { Wrapper },
      setup: () => ({ checked: ref(false), onUpdate }),
      template: `<Wrapper v-model="checked" @update:model-value="onUpdate" />`,
    }))
    await wrapper.find('button').trigger('click')

    expect((wrapper.vm as unknown as { checked: boolean }).checked).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0]).toEqual([true])
  })

  it('an uncontrolled root emits synchronously with the interaction', () => {
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      components: { SwitchRoot },
      setup: () => ({ onUpdate }),
      template: `<SwitchRoot @update:model-value="onUpdate" />`,
    }))
    ;(wrapper.find('button').element as HTMLButtonElement).click()
    // No `await`: the emit happened inside `click()`.
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    return nextTick()
  })
})
