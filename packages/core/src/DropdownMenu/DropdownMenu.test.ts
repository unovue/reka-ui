import type { VueWrapper } from '@vue/test-utils'
import { fireEvent, findAllByRole, findByRole, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'
import DropdownMenu from './story/_DropdownMenu.vue'

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

    const menu = (await findAllByRole(container, 'menu'))[0]
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

    const menu = (await findAllByRole(container, 'menu'))[0]
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

    const submenu = (await findAllByRole(container, 'menu'))[1]
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    fireEvent(submenu, event)

    expect(event.defaultPrevented).toBe(true)
  })
})
