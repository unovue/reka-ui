import type { VueWrapper } from '@vue/test-utils'
import { findByRole, fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from '.'
import Menubar from './story/_Menubar.vue'

describe('given default Menubar', () => {
  let wrapper: VueWrapper<InstanceType<typeof Menubar>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Menubar, { attachTo: document.body })
  })

  it('should render all trigger button', () => {
    expect(wrapper.findAll('button').length).toBe(4)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after opening the dropdown', () => {
    beforeEach(async () => {
      await fireEvent.pointerDown(wrapper.find('button').element, {
        button: 0,
        ctrlKey: false,
      })
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(wrapper.element)).toHaveNoViolations()
    })

    it('should render the menu', async () => {
      expect(await findByRole(wrapper.element as HTMLElement, 'menu')).toBeTruthy()
    })

    describe('after selecting the first item', () => {
      beforeEach(async () => {
        const item = wrapper.find('[role="menu"]').find('[role="menuitem"]')
        await item.trigger('click')
      })

      it('should close the modal', () => {
        expect(wrapper.find('[role="menu"]').exists()).toBeFalsy()
      })

      it('should emit select event', () => {
        expect(wrapper.emitted('select')?.length).toBe(1)
      })
    })
  })
})

describe('given MenubarTrigger with consumer event listeners', () => {
  function mountMenubar(triggerListeners: Record<string, (event: Event) => void> = {}) {
    document.body.innerHTML = ''
    const value = ref('')
    const wrapper = mount(defineComponent({
      setup: () => () => h(MenubarRoot, {
        'modelValue': value.value,
        'onUpdate:modelValue': (next: string) => { value.value = next },
      }, () => h(MenubarMenu, { value: 'file' }, () => [
        h(MenubarTrigger, triggerListeners, () => 'File'),
        h(MenubarPortal, () => h(MenubarContent, () => h(MenubarItem, () => 'New'))),
      ])),
    }), { attachTo: document.body })
    return { value, trigger: wrapper.find('button') }
  }

  it.each(['Enter', ' ', 'ArrowDown'])('should open on %j keydown', async (key) => {
    const { value, trigger } = mountMenubar()
    await trigger.trigger('keydown', { key })
    expect(value.value).toBe('file')
  })

  it.each(['Enter', ' ', 'ArrowDown'])('should not open on %j keydown when the consumer prevents default', async (key) => {
    const { value, trigger } = mountMenubar({ onKeydown: event => event.preventDefault() })
    await trigger.trigger('keydown', { key })
    expect(value.value).toBe('')
  })

  it('should open on pointerdown', async () => {
    const { value, trigger } = mountMenubar()
    await fireEvent.pointerDown(trigger.element, { button: 0, ctrlKey: false })
    expect(value.value).toBe('file')
  })

  it('should not open on pointerdown when the consumer prevents default', async () => {
    const { value, trigger } = mountMenubar({ onPointerdown: event => event.preventDefault() })
    await fireEvent.pointerDown(trigger.element, { button: 0, ctrlKey: false })
    expect(value.value).toBe('')
  })
})

describe('given a MenubarContent with a closeAutoFocus listener', () => {
  type CloseBy = 'Escape' | 'v-model'

  async function setup(by: CloseBy, onCloseAutoFocus?: (event: Event) => void) {
    const value = ref('')
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { id: 'elsewhere' }, 'Elsewhere'),
        h(MenubarRoot, {
          'modelValue': value.value,
          'onUpdate:modelValue': (next: string) => { value.value = next },
        }, () => h(MenubarMenu, { value: 'file' }, () => [
          h(MenubarTrigger, { id: 'trigger' }, () => 'File'),
          h(MenubarPortal, () => h(MenubarContent, { onCloseAutoFocus }, () => h(MenubarItem, { id: 'item' }, () => 'New'))),
        ])),
      ]),
    }), { attachTo: document.body })
    // Unmount even when an assertion fails, so a failure cannot leak into later tests.
    onTestFinished(() => wrapper.unmount())

    const trigger = wrapper.get('#trigger')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('keydown', { key: 'Enter' })
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('item'))

    if (by === 'Escape')
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    else
      value.value = ''
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull())
    // The focus scope restores focus on the next macrotask
    await new Promise(resolve => setTimeout(resolve))
    await flushPromises()
    return { trigger: trigger.element }
  }

  it.each(['Escape', 'v-model'] as CloseBy[])('should return focus to the trigger on close by %s', async (by) => {
    const { trigger } = await setup(by)
    expect(document.activeElement).toBe(trigger)
  })

  it.each(['Escape', 'v-model'] as CloseBy[])('should leave focus alone when closeAutoFocus is only prevented on close by %s', async (by) => {
    await setup(by, event => event.preventDefault())
    // Nothing restores focus, so it falls back to the body once the content is removed
    expect(document.activeElement).toBe(document.body)
  })

  it.each(['Escape', 'v-model'] as CloseBy[])('should keep the focus the closeAutoFocus listener moved on close by %s', async (by) => {
    await setup(by, (event) => {
      event.preventDefault()
      document.getElementById('elsewhere')!.focus()
    })
    expect(document.activeElement).toBe(document.getElementById('elsewhere'))
  })
})
