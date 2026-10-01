import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { Ref, VNode } from 'vue'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import Toolbar from './story/_Toolbar.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarRoot from './ToolbarRoot.vue'
import ToolbarToggleGroup from './ToolbarToggleGroup.vue'
import ToolbarToggleItem from './ToolbarToggleItem.vue'

describe('given default Toolbar', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toolbar>>
  let triggers: DOMWrapper<HTMLElement>[]

  beforeEach(() => {
    wrapper = mount(Toolbar, { attachTo: document.body })
    triggers = wrapper.findAll('button')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have default selected value', () => {
    const selected = triggers.filter(i => i.attributes('data-state') === 'on').map(i => i.element)
    expect(selected.includes(triggers[4].element)).toBeTruthy()
  })

  // Since Toolbar is just a collection of ToggleGroup, so would exclude the test here
})

describe('given Toolbar with all ToolbarToggleItem disabled', () => {
  it('should not be tabbable when all toggle items are disabled', async () => {
    const TestComponent = defineComponent({
      components: {
        ToolbarRoot,
        ToolbarToggleGroup,
        ToolbarToggleItem,
      },
      setup() {
        const model = ref([])
        return { model }
      },
      template: `
        <ToolbarRoot aria-label="Test toolbar">
          <ToolbarToggleGroup v-model="model" type="multiple" aria-label="Formatting">
            <ToolbarToggleItem value="bold" disabled>Bold</ToolbarToggleItem>
            <ToolbarToggleItem value="italic" disabled>Italic</ToolbarToggleItem>
            <ToolbarToggleItem value="underline" disabled>Underline</ToolbarToggleItem>
          </ToolbarToggleGroup>
        </ToolbarRoot>
      `,
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })
    await nextTick()

    // The ToolbarRoot should have tabindex="-1" since all items are disabled
    const root = wrapper.find('[role="toolbar"]')
    expect(root.attributes('tabindex')).toBe('-1')

    wrapper.unmount()
  })

  it('should be tabbable when at least one toggle item is not disabled', async () => {
    const TestComponent = defineComponent({
      components: {
        ToolbarRoot,
        ToolbarToggleGroup,
        ToolbarToggleItem,
      },
      setup() {
        const model = ref([])
        return { model }
      },
      template: `
        <ToolbarRoot aria-label="Test toolbar">
          <ToolbarToggleGroup v-model="model" type="multiple" aria-label="Formatting">
            <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
            <ToolbarToggleItem value="italic" disabled>Italic</ToolbarToggleItem>
            <ToolbarToggleItem value="underline" disabled>Underline</ToolbarToggleItem>
          </ToolbarToggleGroup>
        </ToolbarRoot>
      `,
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })
    await nextTick()

    // The ToolbarRoot should have tabindex="0" since there are focusable items
    const root = wrapper.find('[role="toolbar"]')
    expect(root.attributes('tabindex')).toBe('0')

    wrapper.unmount()
  })
})

describe('given Toolbar items with their own key handling', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.releasePointerCapture = vi.fn()
    window.HTMLElement.prototype.hasPointerCapture = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function mountToolbar(orientation: 'horizontal' | 'vertical', item: (open: Ref<boolean>) => VNode) {
    const open = ref(false)
    mount(defineComponent({
      setup: () => () => h(ToolbarRoot, { orientation }, () => [
        h(ToolbarButton, () => 'Before'),
        item(open),
        h(ToolbarButton, { 'data-testid': 'after' }, () => 'After'),
      ]),
    }), { attachTo: document.body })
    const trigger = document.querySelector('[data-testid="trigger"]') as HTMLElement
    trigger.focus()
    return { open, trigger }
  }

  const dropdownMenu = (open: Ref<boolean>) => h(DropdownMenuRoot, {
    'open': open.value,
    'onUpdate:open': (value: boolean) => { open.value = value },
  }, () => [
    h(ToolbarButton, { asChild: true }, () => h(DropdownMenuTrigger, { 'data-testid': 'trigger' }, () => 'Menu')),
    h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item'))),
  ])

  const select = (open: Ref<boolean>) => h(SelectRoot, {
    'open': open.value,
    'onUpdate:open': (value: boolean) => { open.value = value },
  }, () => [
    h(ToolbarButton, { asChild: true }, () => h(SelectTrigger, { 'data-testid': 'trigger' }, () => 'Select')),
    h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () => h(SelectItem, { value: 'a' }, () => 'A')))),
  ])

  it.each([
    ['horizontal', 'DropdownMenuTrigger', 'ArrowDown', dropdownMenu],
    ['vertical', 'DropdownMenuTrigger', 'ArrowDown', dropdownMenu],
    ['horizontal', 'SelectTrigger', 'ArrowDown', select],
    ['vertical', 'SelectTrigger', 'ArrowDown', select],
    ['vertical', 'SelectTrigger', 'ArrowUp', select],
  ] as const)('%s toolbar: %s should open on %s instead of moving focus', async (orientation, _name, key, item) => {
    const { open, trigger } = mountToolbar(orientation, item)
    await fireEvent.keyDown(trigger, { key })
    await nextTick()

    expect(open.value).toBe(true)
    expect(document.activeElement).not.toBe(document.querySelector('[data-testid="after"]'))
  })

  async function tabIntoToolbar(firstButtonListeners: Record<string, (event: KeyboardEvent) => void> = {}) {
    mount(defineComponent({
      setup: () => () => h(ToolbarRoot, { orientation: 'vertical' }, () => [
        h(ToolbarButton, { 'data-testid': 'first', ...firstButtonListeners }, () => 'First'),
        h(ToolbarButton, { 'data-testid': 'second' }, () => 'Second'),
      ]),
    }), { attachTo: document.body })
    await userEvent.tab()
    return {
      first: document.querySelector('[data-testid="first"]'),
      second: document.querySelector('[data-testid="second"]'),
    }
  }

  it('should move focus on arrow keys', async () => {
    const { first, second } = await tabIntoToolbar()
    expect(document.activeElement).toBe(first)

    await userEvent.keyboard('[ArrowDown]')
    expect(document.activeElement).toBe(second)
  })

  it('should not move focus when the consumer prevents default', async () => {
    const { first } = await tabIntoToolbar({ onKeydown: event => event.preventDefault() })
    expect(document.activeElement).toBe(first)

    await userEvent.keyboard('[ArrowDown]')
    expect(document.activeElement).toBe(first)
  })
})
