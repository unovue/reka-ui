import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'
import Tabs from './story/_Tabs.vue'

describe('given default Tabs', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tabs>>

  beforeEach(() => {
    wrapper = mount(Tabs, { attachTo: document.body })
    wrapper.find('button').element.focus()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render tab\'s content', () => {
    expect(wrapper.find('[role=tabpanel]').exists()).toBeTruthy()

    expect(wrapper.html()).toContain('Make changes')
  })

  describe('after changing tab', () => {
    beforeEach(async () => {
      const trigger = wrapper.find('button')
      await trigger.trigger('keydown', { key: 'ArrowRight' })
    })

    it('should focus on next tab', () => {
      const trigger = wrapper.findAll('button')[1]
      expect(trigger.element).toBe(document.activeElement)
    })

    it('should render it\'s content', () => {
      expect(wrapper.find('[role=tabpanel]').exists()).toBeTruthy()
      expect(wrapper.html()).toContain('Change your password')
    })
  })
})

describe('given Tabs without TabsContent', () => {
  it('should not render aria-controls on TabsTrigger', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger },
      template: `
        <TabsRoot default-value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </TabsRoot>
      `,
    })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers[0].attributes('aria-controls')).toBeUndefined()
    expect(triggers[1].attributes('aria-controls')).toBeUndefined()
  })

  it('should render aria-controls only for TabsTrigger with matching TabsContent', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      template: `
        <TabsRoot default-value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </TabsRoot>
      `,
    })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers[0].attributes('aria-controls')).toBeDefined()
    expect(triggers[1].attributes('aria-controls')).toBeUndefined()
  })
})
