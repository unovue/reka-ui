import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createApp, createSSRApp, defineComponent, h, nextTick, ref, useId } from 'vue'
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

  // `usedIds` stands for whatever else consumed ids before the tabs: when the server
  // and the client disagree on it, every generated id differs between the two.
  function createTabsFixture(usedIds = 0) {
    return defineComponent({
      setup() {
        for (let i = 0; i < usedIds; i++)
          useId()
        return () => h(TabsRoot, { defaultValue: 'account' }, () => [
          h(TabsList, () => [
            h(TabsTrigger, { value: 'account' }, () => 'Account'),
            h(TabsTrigger, { value: 'password' }, () => 'Password'),
          ]),
          h(TabsContent, { value: 'account' }, () => 'Account content'),
          h(TabsContent, { value: 'password' }, () => 'Password content'),
        ])
      },
    })
  }

  it('points aria-controls at the hydrated content when server and client ids diverge', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createTabsFixture(5)))
    document.body.innerHTML = ''
    document.body.append(container)
    const serverPanelIds = Array.from(container.querySelectorAll('[role="tabpanel"]'), panel => panel.id)

    const app = createSSRApp(createTabsFixture())
    app.mount(container)
    await flushPromises()

    const triggers = Array.from(container.querySelectorAll('[role="tab"]'))
    const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'))
    // Hydration keeps the ids of the server render.
    expect(panels.map(panel => panel.id)).toEqual(serverPanelIds)
    expect(triggers.map(trigger => trigger.getAttribute('aria-controls'))).toEqual(serverPanelIds)
    expect(panels.map(panel => panel.getAttribute('aria-labelledby'))).toEqual(triggers.map(trigger => trigger.id))

    triggers[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    await flushPromises()
    expect(triggers[1].getAttribute('aria-selected')).toBe('true')
    expect(triggers.map(trigger => trigger.getAttribute('aria-controls'))).toEqual(serverPanelIds)
    expect(panels.map(panel => panel.id)).toEqual(serverPanelIds)

    app.unmount()
  })

  it('keeps the default output when ids do not diverge', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    // The mount animation guard is lifted in an animation frame, which changes `style`.
    const settled = async () => {
      await flushPromises()
      await new Promise(resolve => requestAnimationFrame(resolve))
      await nextTick()
    }

    const server = await renderToString(createSSRApp(createTabsFixture()))
    expect(server).toMatchInlineSnapshot(`"<div dir="ltr" data-orientation="horizontal"><!--[--><div tabindex="-1" data-orientation="horizontal" dir="ltr" style="outline:none;" role="tablist" aria-orientation="horizontal"><!--[--><button data-reka-collection-item tabindex="-1" data-orientation="horizontal" data-active id="reka-tabs-v-0-trigger-account" role="tab" type="button" aria-selected="true" data-state="active"><!--[-->Account<!--]--></button><button data-reka-collection-item tabindex="-1" data-orientation="horizontal" id="reka-tabs-v-0-trigger-password" role="tab" type="button" aria-selected="false" data-state="inactive"><!--[-->Password<!--]--></button><!--]--></div><div id="reka-tabs-v-0-content-account" role="tabpanel" data-state="active" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style="animation-duration:0s;"><!--[-->Account content<!--]--></div><div id="reka-tabs-v-0-content-password" role="tabpanel" data-state="inactive" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-password" hidden tabindex="0" style=""><!--v-if--></div><!--]--></div>"`)

    const container = document.createElement('div')
    container.innerHTML = server
    document.body.innerHTML = ''
    document.body.append(container)
    const hydrated = createSSRApp(createTabsFixture())
    hydrated.mount(container)
    await settled()
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div dir="ltr" data-orientation="horizontal"><!--[--><div tabindex="0" data-orientation="horizontal" dir="ltr" style="outline:none;" role="tablist" aria-orientation="horizontal"><!--[--><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" data-active="" id="reka-tabs-v-0-trigger-account" role="tab" type="button" aria-selected="true" data-state="active" aria-controls="reka-tabs-v-0-content-account"><!--[-->Account<!--]--></button><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" id="reka-tabs-v-0-trigger-password" role="tab" type="button" aria-selected="false" data-state="inactive" aria-controls="reka-tabs-v-0-content-password"><!--[-->Password<!--]--></button><!--]--></div><div id="reka-tabs-v-0-content-account" role="tabpanel" data-state="active" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style=""><!--[-->Account content<!--]--></div><div id="reka-tabs-v-0-content-password" role="tabpanel" data-state="inactive" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-password" hidden="" tabindex="0" style=""><!--v-if--></div><!--]--></div>"`)
    expect([...warn.mock.calls, ...error.mock.calls]).toEqual([])
    hydrated.unmount()

    const clientContainer = document.createElement('div')
    document.body.append(clientContainer)
    const client = createApp(createTabsFixture())
    client.mount(clientContainer)
    await settled()
    expect(clientContainer.innerHTML).toMatchInlineSnapshot(`"<div dir="ltr" data-orientation="horizontal"><div tabindex="0" data-orientation="horizontal" dir="ltr" style="outline: none;" role="tablist" aria-orientation="horizontal"><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" data-active="" id="reka-tabs-v-0-trigger-account" role="tab" type="button" aria-selected="true" data-state="active" aria-controls="reka-tabs-v-0-content-account">Account</button><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" id="reka-tabs-v-0-trigger-password" role="tab" type="button" aria-selected="false" data-state="inactive" aria-controls="reka-tabs-v-0-content-password">Password</button></div><div id="reka-tabs-v-0-content-account" role="tabpanel" data-state="active" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style="">Account content</div><div id="reka-tabs-v-0-content-password" role="tabpanel" data-state="inactive" data-orientation="horizontal" aria-labelledby="reka-tabs-v-0-trigger-password" hidden="" tabindex="0"><!--v-if--></div></div>"`)
    client.unmount()
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

  it('should render aria-controls matching the TabsContent id', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      template: `
        <TabsRoot default-value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent id="rendered-id" value="tab1">Content 1</TabsContent>
        </TabsRoot>
      `,
    })
    await flushPromises()

    const trigger = wrapper.find('[role="tab"]')
    const content = wrapper.find('[role="tabpanel"]')
    expect(trigger.attributes('aria-controls')).toBe(content.attributes('id'))
  })

  it('should update aria-controls when the TabsContent value changes', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      props: { value: String },
      template: `
        <TabsRoot :default-value="value">
          <TabsList>
            <TabsTrigger :value="value">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent :value="value">Content 1</TabsContent>
        </TabsRoot>
      `,
    }, { props: { value: 'tab1' } })
    await flushPromises()

    await wrapper.setProps({ value: 'tab2' })
    await flushPromises()

    const trigger = wrapper.find('[role="tab"]')
    const content = wrapper.find('[role="tabpanel"]')
    expect(trigger.attributes('aria-controls')).toBe(content.attributes('id'))
  })
})

describe('given a TabsContent whose id changes while mounted', () => {
  it('should keep aria-controls in sync with the id', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      props: { panelId: String },
      template: `
        <TabsRoot default-value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent :id="panelId" value="tab1">Content 1</TabsContent>
        </TabsRoot>
      `,
    }, { props: { panelId: 'x' } })
    await flushPromises()

    const trigger = wrapper.find('[role="tab"]')
    const content = wrapper.find('[role="tabpanel"]')
    expect(content.attributes('id')).toBe('x')
    expect(trigger.attributes('aria-controls')).toBe('x')

    await wrapper.setProps({ panelId: 'y' })
    await flushPromises()

    expect(content.attributes('id')).toBe('y')
    expect(trigger.attributes('aria-controls')).toBe('y')
  })
})

describe('given TabsTrigger with consumer event listeners', () => {
  function mountTabs(triggerListeners: Record<string, (event: Event) => void> = {}) {
    document.body.innerHTML = ''
    const value = ref('one')
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, {
        'modelValue': value.value,
        'onUpdate:modelValue': (next: string) => { value.value = next },
        'activationMode': 'manual',
      }, () => [
        h(TabsList, () => [
          h(TabsTrigger, { value: 'one' }, () => 'One'),
          h(TabsTrigger, { value: 'two', ...triggerListeners }, () => 'Two'),
        ]),
      ]),
    }), { attachTo: document.body })
    return { value, trigger: wrapper.findAll('[role="tab"]')[1] }
  }

  it.each(['Enter', ' '])('should activate on %j keydown', async (key) => {
    const { value, trigger } = mountTabs()
    await trigger.trigger('keydown', { key })
    expect(value.value).toBe('two')
  })

  it.each(['Enter', ' '])('should not activate on %j keydown when the consumer prevents default', async (key) => {
    const { value, trigger } = mountTabs({ onKeydown: event => event.preventDefault() })
    await trigger.trigger('keydown', { key })
    expect(value.value).toBe('one')
  })

  it('should activate on mousedown', async () => {
    const { value, trigger } = mountTabs()
    await trigger.trigger('mousedown', { button: 0, ctrlKey: false })
    expect(value.value).toBe('two')
  })

  it('should not activate on mousedown when the consumer prevents default', async () => {
    const { value, trigger } = mountTabs({ onMousedown: event => event.preventDefault() })
    await trigger.trigger('mousedown', { button: 0, ctrlKey: false })
    expect(value.value).toBe('one')
  })

  it.each([1, 2])('should not activate or take focus on mousedown with button %i', async (button) => {
    const { value, trigger } = mountTabs()
    const event = new MouseEvent('mousedown', { button, bubbles: true, cancelable: true })
    trigger.element.dispatchEvent(event)
    await nextTick()
    expect(value.value).toBe('one')
    expect(event.defaultPrevented).toBe(true)
  })
})
