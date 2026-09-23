import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'
import Tabs from './story/_Tabs.vue'

const TabsHydrationFixture = defineComponent({
  setup() {
    let count = 0
    const useId = () => `nuxt-${++count}`

    return () =>
      h(ConfigProvider, { useId }, () =>
        h(TabsRoot, { defaultValue: 'account' }, () => [
          h(TabsList, () => [
            h(TabsTrigger, { value: 'account' }, () => 'Account'),
            h(TabsTrigger, { value: 'password' }, () => 'Password'),
          ]),
          h(TabsContent, { value: 'account' }, () => 'Account content'),
          h(TabsContent, { value: 'password' }, () => 'Password content'),
        ]))
  },
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ssr hydration', () => {
  it('uses ConfigProvider ids when Vue app id prefixes differ', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Tabs derives trigger/content IDs from one base ID, so this catches the
    // shared source-order bug for components that build related IDs.
    const serverApp = createSSRApp(TabsHydrationFixture)
    serverApp.config.idPrefix = 'v-1'

    const container = document.createElement('div')
    container.innerHTML = await renderToString(serverApp)
    document.body.innerHTML = ''
    document.body.append(container)

    expect(container.innerHTML).toContain('id="reka-tabs-nuxt-1-trigger-account"')
    expect(container.innerHTML).toContain('id="reka-tabs-nuxt-1-content-account"')
    const triggerId = container.querySelector('[role="tab"]')?.id
    const contentId = container.querySelector('[role="tabpanel"]')?.id

    const clientApp = createSSRApp(TabsHydrationFixture)
    clientApp.config.idPrefix = 'v-0'
    clientApp.mount(container)
    await nextTick()

    expect(container.querySelector('[role="tab"]')?.id).toBe(triggerId)
    expect(container.querySelector('[role="tabpanel"]')?.id).toBe(contentId)

    const warnings = warn.mock.calls.flat().join('\n')
    expect(warnings).not.toContain('Hydration attribute mismatch')
    expect(error.mock.calls.flat().join('\n')).not.toContain('Hydration completed but contains mismatches')
  })
})

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
