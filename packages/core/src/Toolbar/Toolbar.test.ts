import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import Toolbar from './story/_Toolbar.vue'
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
