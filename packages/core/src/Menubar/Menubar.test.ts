import type { VueWrapper } from '@vue/test-utils'
import { findByRole, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
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
