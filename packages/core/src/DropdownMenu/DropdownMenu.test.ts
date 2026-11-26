import type { VueWrapper } from '@vue/test-utils'
import { findAllByRole, findByRole, fireEvent, render } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { injectMenuContext } from '@/Menu/MenuRoot.vue'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'
import DropdownMenu from './story/_DropdownMenu.vue'

// TODO(v3-port): #3202 v3 menu content does not clear its root registration on unmount
describe.skip('given a DropdownMenu root that stays mounted', () => {
  it.each([true, false])('should preserve replaced submenu content and keyboard focus with modal=%s', async (modal) => {
    let menuContext!: NonNullable<ReturnType<typeof injectMenuContext>>
    const ContextProbe = defineComponent({
      setup() {
        menuContext = injectMenuContext()!
        return () => null
      },
    })
    const contentKey = ref(0)
    const open = ref(true)
    const wrapper = mount(defineComponent({
      components: {
        ContextProbe,
        DropdownMenuRoot,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuSub,
        DropdownMenuSubTrigger,
        DropdownMenuSubContent,
        DropdownMenuItem,
      },
      setup: () => ({ contentKey, open, modal }),
      template: `<DropdownMenuRoot :open="true" :modal="modal">
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent @close-auto-focus.prevent>
          <DropdownMenuSub :open="open">
            <ContextProbe />
            <DropdownMenuSubTrigger data-testid="sub-trigger">Submenu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent :key="contentKey" data-testid="sub-content">
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenuRoot>`,
    }), { attachTo: document.body })

    try {
      await flushPromises()
      let content = wrapper.get('[data-testid="sub-content"]').element
      expect(menuContext.content.value).toBe(content)

      for (let cycle = 0; cycle < 2; cycle++) {
        contentKey.value++
        await flushPromises()
        const replacement = wrapper.get('[data-testid="sub-content"]').element
        expect(replacement).not.toBe(content)
        expect(menuContext.content.value).toBe(replacement)

        const trigger = wrapper.get<HTMLElement>('[data-testid="sub-trigger"]')
        trigger.element.focus()
        expect(document.activeElement).toBe(trigger.element)
        await trigger.trigger('keydown', { key: 'ArrowRight' })
        expect(replacement.contains(document.activeElement)).toBe(true)
        content = replacement
      }

      open.value = false
      await flushPromises()
      expect(menuContext.content.value).toBeUndefined()
    }
    finally {
      wrapper.unmount()
    }
  })

  it('should keep the registered submenu content when an older one unmounts', async () => {
    let menuContext!: NonNullable<ReturnType<typeof injectMenuContext>>
    const ContextProbe = defineComponent({
      setup() {
        menuContext = injectMenuContext()!
        return () => null
      },
    })
    const showFirst = ref(true)
    const showSecond = ref(false)
    const wrapper = mount(defineComponent({
      components: {
        ContextProbe,
        DropdownMenuRoot,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuSub,
        DropdownMenuSubTrigger,
        DropdownMenuSubContent,
        DropdownMenuItem,
      },
      setup: () => ({ showFirst, showSecond }),
      template: `<DropdownMenuRoot :open="true">
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent @close-auto-focus.prevent>
          <DropdownMenuSub :open="true">
            <ContextProbe />
            <DropdownMenuSubTrigger data-testid="sub-trigger">Submenu</DropdownMenuSubTrigger>
            <DropdownMenuSubContent v-if="showFirst" data-testid="first-content">
              <DropdownMenuItem>First Item</DropdownMenuItem>
            </DropdownMenuSubContent>
            <DropdownMenuSubContent v-if="showSecond" data-testid="second-content">
              <DropdownMenuItem>Second Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenuRoot>`,
    }), { attachTo: document.body })

    try {
      await flushPromises()
      expect(menuContext.content.value).toBe(wrapper.get('[data-testid="first-content"]').element)

      showSecond.value = true
      await flushPromises()
      const second = wrapper.get('[data-testid="second-content"]').element
      expect(menuContext.content.value).toBe(second)

      showFirst.value = false
      await flushPromises()
      expect(wrapper.find('[data-testid="first-content"]').exists()).toBe(false)
      expect(menuContext.content.value).toBe(second)

      const trigger = wrapper.get<HTMLElement>('[data-testid="sub-trigger"]')
      trigger.element.focus()
      expect(document.activeElement).toBe(trigger.element)
      await trigger.trigger('keydown', { key: 'ArrowRight' })
      expect(second.contains(document.activeElement)).toBe(true)

      showSecond.value = false
      await flushPromises()
      expect(menuContext.content.value).toBeUndefined()
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each([true, false])('should release closed content with modal=%s', async (modal) => {
    let menuContext!: NonNullable<ReturnType<typeof injectMenuContext>>
    const ContextProbe = defineComponent({
      setup() {
        menuContext = injectMenuContext()!
        return () => null
      },
    })
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, { open: open.value, modal }, () => [
        h(ContextProbe),
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuPortal, { disabled: true }, () => h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item'))),
      ]),
    }), { attachTo: document.body })

    for (let cycle = 0; cycle < 2; cycle++) {
      open.value = true
      await flushPromises()
      expect(menuContext.content.value).toBe(wrapper.get('[role="menu"]').element)

      open.value = false
      await flushPromises()
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
      expect(menuContext.content.value).toBeUndefined()
    }

    wrapper.unmount()
  })
})

const DropdownMenuTabTest = defineComponent({
  components: {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  },
  props: {
    modal: {
      type: Boolean,
      default: true,
    },
  },
  template: `
    <div>
      <button>Before</button>
      <DropdownMenuRoot :open="true" :modal="modal">
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuPortal disabled>
          <DropdownMenuContent @close-auto-focus.prevent>
            <DropdownMenuItem>Item</DropdownMenuItem>
            <DropdownMenuSub :open="true">
              <DropdownMenuSubTrigger>Sub Trigger</DropdownMenuSubTrigger>
              <DropdownMenuPortal disabled>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Sub Item</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
      <button>After</button>
    </div>
  `,
})

describe('given default DropdownMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof DropdownMenu>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DropdownMenu, { attachTo: document.body })
  })

  it('should render trigger button', () => {
    expect(wrapper.find('button').exists()).toBeTruthy()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after opening the dropdown', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(wrapper.element)).toHaveNoViolations()
    })

    it('should render the menu', async () => {
      expect(await findByRole(wrapper.element as HTMLElement, 'menu')).toBeTruthy()
    })

    describe('after selecting the first item', () => {
      beforeEach(async () => {
        const item = wrapper.find('[role="menuitem"]')
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

describe('given DropdownMenu tab navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should allow Tab to move focus out of non-modal menu', async () => {
    const { container } = render(DropdownMenuTabTest, {
      props: { modal: false },
    })

    const menu = (await findAllByRole(container as HTMLElement, 'menu'))[0]
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    fireEvent(menu, event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('should prevent Tab in modal menu', async () => {
    const { container } = render(DropdownMenuTabTest, {
      props: { modal: true },
    })

    const menu = (await findAllByRole(container as HTMLElement, 'menu'))[0]
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    fireEvent(menu, event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('should prevent Tab in modal submenu', async () => {
    const { container } = render(DropdownMenuTabTest, {
      props: { modal: true },
    })

    const submenu = (await findAllByRole(container as HTMLElement, 'menu'))[1]
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    fireEvent(submenu, event)

    expect(event.defaultPrevented).toBe(true)
  })
})

describe('given DropdownMenu checkbox and radio item slot props', () => {
  it('should expose `checked` on both checkbox and radio items', async () => {
    const checkbox = ref(false)
    const radio = ref('a')
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DropdownMenuRoot, { open: true }, () => [
          h(DropdownMenuTrigger, () => 'open'),
          h(DropdownMenuContent, () => [
            h(DropdownMenuCheckboxItem, {
              'modelValue': checkbox.value,
              'onUpdate:modelValue': (v: boolean) => { checkbox.value = v },
            }, {
              default: ({ checked, modelValue }: { checked: boolean, modelValue: boolean }) =>
                h('span', { 'data-testid': 'checkbox' }, `${checked}:${modelValue}`),
            }),
            h(DropdownMenuRadioGroup, { modelValue: radio.value }, () => ['a', 'b'].map(value =>
              h(DropdownMenuRadioItem, { value }, {
                default: ({ checked }: { checked: boolean }) =>
                  h('span', { 'data-testid': `radio-${value}` }, String(checked)),
              }),
            )),
          ]),
        ])
      },
    }), { attachTo: document.body })
    await nextTick()

    const text = (id: string) => document.querySelector(`[data-testid=${id}]`)?.textContent
    expect(text('checkbox')).toBe('false:false')
    expect(text('radio-a')).toBe('true')
    expect(text('radio-b')).toBe('false')

    checkbox.value = true
    radio.value = 'b'
    await nextTick()
    expect(text('checkbox')).toBe('true:true')
    expect(text('radio-a')).toBe('false')
    expect(text('radio-b')).toBe('true')

    wrapper.unmount()
  })
})

describe('given DropdownMenuTrigger with consumer event listeners', () => {
  function mountDropdownMenu(triggerListeners: Record<string, (event: Event) => void> = {}) {
    document.body.innerHTML = ''
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(DropdownMenuTrigger, triggerListeners, () => 'Open'),
        h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item'))),
      ]),
    }), { attachTo: document.body })
    return { open, trigger: wrapper.find('button') }
  }

  it.each(['Enter', ' ', 'ArrowDown'])('should open on %j keydown', async (key) => {
    const { open, trigger } = mountDropdownMenu()
    await trigger.trigger('keydown', { key })
    expect(open.value).toBe(true)
  })

  it.each(['Enter', ' ', 'ArrowDown'])('should not open on %j keydown when the consumer prevents default', async (key) => {
    const { open, trigger } = mountDropdownMenu({ onKeydown: event => event.preventDefault() })
    await trigger.trigger('keydown', { key })
    expect(open.value).toBe(false)
  })

  it('should open on click', async () => {
    const { open, trigger } = mountDropdownMenu()
    await trigger.trigger('click', { button: 0, ctrlKey: false })
    expect(open.value).toBe(true)
  })

  it('should not open on click when the consumer prevents default', async () => {
    const { open, trigger } = mountDropdownMenu({ onClick: event => event.preventDefault() })
    await trigger.trigger('click', { button: 0, ctrlKey: false })
    expect(open.value).toBe(false)
  })
})

describe('dropdownMenu change events (v3 contract on the wrapper roots)', () => {
  function mountDropdownMenu(rootProps: Record<string, unknown> = {}, subProps: Record<string, unknown> = {}) {
    document.body.innerHTML = ''
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, rootProps, () => [
        h(DropdownMenuTrigger, () => 'Open'),
        h(DropdownMenuContent, () => [
          h(DropdownMenuItem, () => 'Item'),
          h(DropdownMenuSub, subProps, () => [
            h(DropdownMenuSubTrigger, () => 'More'),
            h(DropdownMenuSubContent, () => h(DropdownMenuItem, () => 'Sub item')),
          ]),
        ]),
      ]),
    }), { attachTo: document.body })
    const root = wrapper.findComponent(DropdownMenuRoot)
    const sub = () => wrapper.findComponent(DropdownMenuSub)
    return { wrapper, root, sub, trigger: wrapper.find('button') }
  }

  it('emits beforeUpdate:open then update:open with the reason and event on a trigger press', async () => {
    const { wrapper, root, trigger } = mountDropdownMenu()
    await trigger.trigger('click', { button: 0, ctrlKey: false })

    expect(root.emitted('beforeUpdate:open')).toHaveLength(1)
    expect(root.emitted('update:open')).toHaveLength(1)
    const [value, details] = root.emitted('update:open')![0] as [boolean, { reason: string, event?: Event }]
    expect(value).toBe(true)
    expect(details.reason).toBe('trigger-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(trigger.attributes('data-popup-open')).toBe('')
    wrapper.unmount()
  })

  it('keeps the menu closed when beforeUpdate:open is cancelled', async () => {
    const { wrapper, root, trigger } = mountDropdownMenu({
      'onBeforeUpdate:open': (_value: boolean, details: { cancel: () => void }) => details.cancel(),
    })
    await trigger.trigger('click', { button: 0, ctrlKey: false })

    expect(root.emitted('update:open')).toBeUndefined()
    expect(trigger.attributes('data-popup-open')).toBeUndefined()
    wrapper.unmount()
  })

  it('reports the close reason from the inner menu', async () => {
    const { wrapper, root } = mountDropdownMenu({ defaultOpen: true })
    await nextTick()
    await fireEvent.keyDown(wrapper.find('[role=menu]').element, { key: 'Escape' })
    await nextTick()

    const updates = root.emitted('update:open')!
    const [value, details] = updates.at(-1) as [boolean, { reason: string }]
    expect(value).toBe(false)
    expect(details.reason).toBe('escape-key')
    wrapper.unmount()
  })

  it('emits beforeUpdate:open on the sub and lets it cancel the open', async () => {
    const { wrapper, sub } = mountDropdownMenu({ defaultOpen: true }, {
      'onBeforeUpdate:open': (_value: boolean, details: { cancel: () => void }) => details.cancel(),
    })
    await nextTick()
    const subTrigger = wrapper.find('[aria-haspopup=menu][role=menuitem]')
    await fireEvent.keyDown(subTrigger.element, { key: 'ArrowRight' })
    await nextTick()

    expect(sub().emitted('beforeUpdate:open')).toHaveLength(1)
    expect(sub().emitted('update:open')).toBeUndefined()
    expect(subTrigger.attributes('data-popup-open')).toBeUndefined()
    wrapper.unmount()
  })
})
