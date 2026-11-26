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

/** A `click` with the given `detail`: 1 for a pointer click, 0 for a keyboard one (VTU's `trigger` cannot set it). */
async function click(wrapper: { element: Element }, detail: number) {
  wrapper.element.dispatchEvent(new MouseEvent('click', { detail, bubbles: true, cancelable: true }))
  await nextTick()
}

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

  // TODO(v3-port): #3362 pre-mount RovingFocus tab stop (RovingFocus resolved to v3)
  it.skip('makes the active trigger the tab stop in the server HTML, then hands it to the list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(TabsHydrationFixture))
    document.body.innerHTML = ''
    document.body.append(container)

    const tabindexes = () => [
      container.querySelector('[role="tablist"]')?.getAttribute('tabindex'),
      ...Array.from(container.querySelectorAll('[role="tab"]'), tab => tab.getAttribute('tabindex')),
    ]
    // before hydration the active trigger is the only stop
    expect(tabindexes()).toEqual(['-1', '0', '-1'])

    createSSRApp(TabsHydrationFixture).mount(container)
    await nextTick()

    // after mount the list is the stop again and forwards focus to the active trigger
    expect(tabindexes()).toEqual(['0', '-1', '-1'])
    expect(warn.mock.calls.flat().join('\n')).not.toContain('Hydration attribute mismatch')
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
    const panels = () => Array.from(container.querySelectorAll('[role="tabpanel"]'))
    // Hydration keeps the ids of the server render. v3 renders only the active panel, and a
    // trigger references its panel only while the panel is rendered.
    expect(panels().map(panel => panel.id)).toEqual(serverPanelIds)
    expect(triggers.map(trigger => trigger.getAttribute('aria-controls'))).toEqual([serverPanelIds[0], null])
    expect(panels().map(panel => panel.getAttribute('aria-labelledby'))).toEqual([triggers[0].id])

    triggers[1].dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    await flushPromises()
    expect(triggers[1].getAttribute('aria-selected')).toBe('true')
    // The newly rendered panel is the client's; every reference still resolves.
    const controlled = triggers[1].getAttribute('aria-controls')
    expect(controlled && container.querySelector(`#${controlled}`)?.getAttribute('aria-labelledby')).toBe(triggers[1].id)
    expect(triggers[0].getAttribute('aria-controls')).toBeNull()

    app.unmount()
  })

  // Inline snapshots regenerated for v3 (checked/unchecked, inactive content unmounted).
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
    expect(server).toMatchInlineSnapshot(`"<div data-orientation="horizontal" dir="ltr"><!--[--><div tabindex="-1" data-orientation="horizontal" dir="ltr" style="outline:none;" role="tablist" aria-orientation="horizontal"><!--[--><button data-reka-collection-item tabindex="-1" data-orientation="horizontal" data-active type="button" data-state="checked" id="reka-tabs-v-0-trigger-account" role="tab" aria-selected="true"><!--[-->Account<!--]--></button><button data-reka-collection-item tabindex="-1" data-orientation="horizontal" type="button" data-state="unchecked" id="reka-tabs-v-0-trigger-password" role="tab" aria-selected="false"><!--[-->Password<!--]--></button><!--]--></div><div data-state="checked" data-orientation="horizontal" id="reka-tabs-v-0-content-account" role="tabpanel" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style="animation-duration:0s;"><!--[-->Account content<!--]--></div><!----><!--]--></div>"`)

    const container = document.createElement('div')
    container.innerHTML = server
    document.body.innerHTML = ''
    document.body.append(container)
    const hydrated = createSSRApp(createTabsFixture())
    hydrated.mount(container)
    await settled()
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div data-orientation="horizontal" dir="ltr"><!--[--><div tabindex="0" data-orientation="horizontal" dir="ltr" style="outline:none;" role="tablist" aria-orientation="horizontal"><!--[--><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" data-active="" type="button" data-state="checked" id="reka-tabs-v-0-trigger-account" role="tab" aria-selected="true" aria-controls="reka-tabs-v-0-content-account"><!--[-->Account<!--]--></button><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" type="button" data-state="unchecked" id="reka-tabs-v-0-trigger-password" role="tab" aria-selected="false"><!--[-->Password<!--]--></button><!--]--></div><div data-state="checked" data-orientation="horizontal" id="reka-tabs-v-0-content-account" role="tabpanel" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style=""><!--[-->Account content<!--]--></div><!----><!--]--></div>"`)
    expect([...warn.mock.calls, ...error.mock.calls]).toEqual([])
    hydrated.unmount()

    const clientContainer = document.createElement('div')
    document.body.append(clientContainer)
    const client = createApp(createTabsFixture())
    client.mount(clientContainer)
    await settled()
    expect(clientContainer.innerHTML).toMatchInlineSnapshot(`"<div data-orientation="horizontal" dir="ltr"><div tabindex="0" data-orientation="horizontal" dir="ltr" style="outline: none;" role="tablist" aria-orientation="horizontal"><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" data-active="" type="button" data-state="checked" id="reka-tabs-v-0-trigger-account" role="tab" aria-selected="true" aria-controls="reka-tabs-v-0-content-account">Account</button><button data-reka-collection-item="" tabindex="-1" data-orientation="horizontal" type="button" data-state="unchecked" id="reka-tabs-v-0-trigger-password" role="tab" aria-selected="false">Password</button></div><div data-state="checked" data-orientation="horizontal" id="reka-tabs-v-0-content-account" role="tabpanel" aria-labelledby="reka-tabs-v-0-trigger-account" tabindex="0" style="">Account content</div><!----></div>"`)
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

    // Manual activation by default (#842); focus alone selects nothing.
    it('should keep the current content until the tab is activated', async () => {
      expect(wrapper.findAll('[role=tabpanel]')).toHaveLength(1)
      expect(wrapper.html()).toContain('Make changes')
      expect(wrapper.html()).not.toContain('Change your password')

      await wrapper.findAll('button')[1].trigger('keydown', { key: 'Enter' })
      expect(wrapper.findAll('[role=tabpanel]')).toHaveLength(1)
      expect(wrapper.html()).toContain('Change your password')
    })
  })
})

describe('activation defaults (#842)', () => {
  function mountTabs(props: Record<string, unknown> = {}) {
    return mount(TabsRoot, {
      props: { defaultValue: 'tab1', ...props },
      slots: {
        default: () => [
          h(TabsList, () => [
            h(TabsTrigger, { value: 'tab1' }, () => 'Tab 1'),
            h(TabsTrigger, { value: 'tab2' }, () => 'Tab 2'),
          ]),
        ],
      },
      attachTo: document.body,
    })
  }

  it('defaults to manual activation: focusing a tab does not select it', async () => {
    const wrapper = mountTabs()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    await t2.trigger('focus')
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('selects on click, not on mousedown', async () => {
    const wrapper = mountTabs()
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await t2.trigger('mousedown', { button: 0 })
    expect(t2.attributes('data-state')).toBe('unchecked')

    await t2.trigger('mouseup', { button: 0 })
    await click(t2, 1)
    expect(t2.attributes('data-state')).toBe('checked')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('tab2')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[1]).toMatchObject({ reason: 'trigger-press' })
    wrapper.unmount()
  })

  it('selects on a click without a press (`element.click()`), in either mode', async () => {
    for (const activationMode of ['manual', 'automatic']) {
      const wrapper = mountTabs({ activationMode })
      const t2 = wrapper.findAll('[role="tab"]')[1];
      (t2.element as HTMLElement).click()
      await nextTick()
      expect(t2.attributes('data-state')).toBe('checked')
      wrapper.unmount()
    }
  })

  it('automatic activation selects on the press, and its click asks for no second change', async () => {
    const onBeforeUpdate = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
    const wrapper = mountTabs({ 'activationMode': 'automatic', 'onBeforeUpdate:modelValue': onBeforeUpdate })
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await t2.trigger('mousedown', { button: 0 })
    await click(t2, 1)
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdate.mock.calls[0][1]).toMatchObject({ reason: 'trigger-press' })
    wrapper.unmount()
  })

  it('an Enter/Space keydown and its keyboard click ask for one change', async () => {
    const onBeforeUpdate = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
    const wrapper = mountTabs({ 'onBeforeUpdate:modelValue': onBeforeUpdate })
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await t2.trigger('keydown', { key: 'Enter' })
    await click(t2, 0)
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdate.mock.calls[0][1]).toMatchObject({ reason: 'trigger-keydown' })

    // A later pointer click is a new attempt.
    await t2.trigger('mousedown', { button: 0 })
    await click(t2, 1)
    expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('a click after a keydown that no keyboard click followed is a new attempt', async () => {
    vi.useFakeTimers()
    try {
      const onBeforeUpdate = vi.fn((_value: unknown, details: { cancel: () => void }) => details.cancel())
      const wrapper = mountTabs({ 'onBeforeUpdate:modelValue': onBeforeUpdate })
      const t2 = wrapper.findAll('[role="tab"]')[1]
      await t2.trigger('keydown', { key: 'Enter' })
      await t2.trigger('keyup', { key: 'Enter' })
      vi.runAllTimers()
      expect(onBeforeUpdate).toHaveBeenCalledTimes(1)

      await click(t2, 0)
      expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
      expect(onBeforeUpdate.mock.calls[1][1]).toMatchObject({ reason: 'trigger-press' })
      wrapper.unmount()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('does not select a disabled tab on click', async () => {
    const wrapper = mount(TabsRoot, {
      props: { defaultValue: 'tab1' },
      slots: {
        default: () => h(TabsList, () => [
          h(TabsTrigger, { value: 'tab1' }, () => 'Tab 1'),
          h(TabsTrigger, { value: 'tab2', disabled: true, as: 'div' }, () => 'Tab 2'),
        ]),
      },
      attachTo: document.body,
    })
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await click(t2, 1)
    expect(t2.attributes('data-state')).toBe('unchecked')
    wrapper.unmount()
  })
})

describe('content mounting defaults (#2476)', () => {
  function mountTabs(props: Record<string, unknown> = {}) {
    return mount(TabsRoot, {
      props: { defaultValue: 'tab1', ...props },
      slots: {
        default: () => [
          h(TabsList, () => [
            h(TabsTrigger, { value: 'tab1' }, () => 'Tab 1'),
            h(TabsTrigger, { value: 'tab2' }, () => 'Tab 2'),
          ]),
          h(TabsContent, { value: 'tab1', class: 'flex' }, () => 'Content 1'),
          h(TabsContent, { value: 'tab2', class: 'flex' }, () => 'Content 2'),
        ],
      },
      attachTo: document.body,
    })
  }

  it('renders no element for an inactive panel', async () => {
    const wrapper = mountTabs()
    await flushPromises()
    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels).toHaveLength(1)
    expect(panels[0].text()).toBe('Content 1')
    expect(panels[0].attributes('hidden')).toBeUndefined()

    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="tabpanel"]').map(panel => panel.text())).toEqual(['Content 2'])
    wrapper.unmount()
  })

  it('points aria-controls only at a panel in the DOM', async () => {
    const wrapper = mountTabs()
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    expect(t1.attributes('aria-controls')).toBe(wrapper.find('[role="tabpanel"]').attributes('id'))
    expect(t2.attributes('aria-controls')).toBeUndefined()

    await t2.trigger('click')
    await flushPromises()
    expect(t1.attributes('aria-controls')).toBeUndefined()
    expect(t2.attributes('aria-controls')).toBe(wrapper.find('[role="tabpanel"]').attributes('id'))
    wrapper.unmount()
  })

  it('with `unmountOnHide` off, keeps every panel mounted, inactive ones `hidden`', async () => {
    const wrapper = mountTabs({ unmountOnHide: false })
    await flushPromises()
    const [p1, p2] = wrapper.findAll('[role="tabpanel"]')
    expect(p1.attributes('hidden')).toBeUndefined()
    expect(p2.attributes('hidden')).toBeDefined()
    expect(p2.text()).toBe('Content 2')
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    expect(t1.attributes('aria-controls')).toBe(p1.attributes('id'))
    expect(t2.attributes('aria-controls')).toBe(p2.attributes('id'))
    wrapper.unmount()
  })

  it('moves aria-controls along when a rendered panel changes `value`', async () => {
    const panelValue = ref('tab1')
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'tab1', unmountOnHide: false }, () => [
        h(TabsList, () => [
          h(TabsTrigger, { value: 'tab1' }, () => 'Tab 1'),
          h(TabsTrigger, { value: 'tab2' }, () => 'Tab 2'),
        ]),
        h(TabsContent, { value: panelValue.value }, () => 'Content'),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    expect(t1.attributes('aria-controls')).toBe(wrapper.find('[role="tabpanel"]').attributes('id'))

    panelValue.value = 'tab2'
    await flushPromises()
    expect(t1.attributes('aria-controls')).toBeUndefined()
    expect(t2.attributes('aria-controls')).toBe(wrapper.find('[role="tabpanel"]').attributes('id'))
    wrapper.unmount()
  })

  it('a `forceMount` panel stays rendered while inactive', async () => {
    const wrapper = mount(TabsRoot, {
      props: { defaultValue: 'tab1' },
      slots: {
        default: () => [
          h(TabsContent, { value: 'tab1' }, () => 'Content 1'),
          h(TabsContent, { value: 'tab2', forceMount: true }, () => 'Content 2'),
        ],
      },
      attachTo: document.body,
    })
    await flushPromises()
    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels.map(panel => panel.text())).toEqual(['Content 1', 'Content 2'])
    expect(panels[1].attributes('data-state')).toBe('unchecked')
    wrapper.unmount()
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

// Characterization tests: lock the real contract the thin suite above misses
// (id/aria wiring, data-state, activation mode, consumer-listener chaining,
// orientation, disabled) against the UNMODIFIED Tabs, so the useTabs refactor
// fails HERE on any parity gap instead of shipping. See #2723 recipe step 1.
describe('tabs characterization (pre-refactor contract)', () => {
  const twoTabFixture = {
    components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
    props: ['activationMode'],
    template: `
      <TabsRoot default-value="tab1" :activation-mode="activationMode">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </TabsRoot>
    `,
  }

  it('wires aria-controls/aria-labelledby to the matching trigger/content id pair', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body })
    await flushPromises()
    const trigger = wrapper.find('[role="tab"]')
    const panel = wrapper.find('[role="tabpanel"]')
    expect(trigger.attributes('id')).toMatch(/-trigger-tab1$/)
    expect(panel.attributes('id')).toMatch(/-content-tab1$/)
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(trigger.attributes('id'))
    wrapper.unmount()
  })

  it('marks the selected trigger checked and others unchecked (data-state + aria-selected)', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t1.attributes('aria-selected')).toBe('true')
    expect(t2.attributes('data-state')).toBe('unchecked')
    expect(t2.attributes('aria-selected')).toBe('false')
    wrapper.unmount()
  })

  it('keeps the trigger id stable across selection changes', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body })
    await flushPromises()
    const t2 = wrapper.findAll('[role="tab"]')[1]
    const idBefore = t2.attributes('id')
    await t2.trigger('click')
    await flushPromises()
    expect(t2.attributes('data-state')).toBe('checked')
    expect(t2.attributes('id')).toBe(idBefore)
    wrapper.unmount()
  })

  it('automatic activation: focusing a trigger activates its tab', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body, props: { activationMode: 'automatic' } })
    await flushPromises()
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await t2.trigger('focus')
    await flushPromises()
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })

  it('manual activation: focus does not activate, but Enter/Space does', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body, props: { activationMode: 'manual' } })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    await t2.trigger('focus')
    await flushPromises()
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')
    await t2.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })

  it('reflects orientation as data-orientation on triggers and panels', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      template: `
        <TabsRoot default-value="tab1" orientation="vertical">
          <TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </TabsRoot>`,
    }, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[role="tab"]').attributes('data-orientation')).toBe('vertical')
    expect(wrapper.find('[role="tabpanel"]').attributes('data-orientation')).toBe('vertical')
    wrapper.unmount()
  })

  it('chains a consumer mousedown listener with the automatic activation', async () => {
    const spy = vi.fn()
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      setup() {
        return { spy }
      },
      template: `
        <TabsRoot default-value="tab1" activation-mode="automatic">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" @mousedown="spy">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsRoot>`,
    }, { attachTo: document.body })
    await flushPromises()
    const t2 = wrapper.findAll('[role="tab"]')[1]
    await t2.trigger('mousedown')
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })

  it('marks a disabled trigger with data-disabled and the disabled attribute', async () => {
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      template: `
        <TabsRoot default-value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
        </TabsRoot>`,
    }, { attachTo: document.body })
    await flushPromises()
    const t2 = wrapper.findAll('[role="tab"]')[1]
    expect(t2.attributes('data-disabled')).toBe('')
    expect(t2.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('v-model (foundation contract)', () => {
  const twoTabs = () => [
    h(TabsList, () => [
      h(TabsTrigger, { value: 'tab1' }, () => 'Tab 1'),
      h(TabsTrigger, { value: 'tab2' }, () => 'Tab 2'),
    ]),
    h(TabsContent, { value: 'tab1' }, () => 'Content 1'),
    h(TabsContent, { value: 'tab2' }, () => 'Content 2'),
  ]

  it('controlled: emits update:modelValue as [value, details] and waits for the parent', async () => {
    const wrapper = mount(TabsRoot, {
      props: { modelValue: 'tab1' },
      slots: { default: twoTabs },
      attachTo: document.body,
    })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')
    await t2.trigger('click')
    await flushPromises()

    const before = wrapper.emitted('beforeUpdate:modelValue')
    const updated = wrapper.emitted('update:modelValue')
    expect(before?.[0]?.[0]).toBe('tab2')
    expect(updated?.[0]?.[0]).toBe('tab2')
    expect(updated?.[0]?.[1]).toMatchObject({ reason: 'trigger-press', isCanceled: false })
    expect((updated?.[0]?.[1] as { event?: Event }).event).toBeInstanceOf(MouseEvent)
    // Controlled: nothing changes until the parent writes the new value back.
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')

    await wrapper.setProps({ modelValue: 'tab2' })
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })

  it('a cancelled trigger-press prevents default so automatic activation cannot re-select on focus', async () => {
    const wrapper = mount(TabsRoot, {
      props: {
        'modelValue': 'tab1',
        'activationMode': 'automatic',
        'onBeforeUpdate:modelValue': (_value: unknown, details: { cancel: () => void }) => details.cancel(),
      },
      slots: { default: twoTabs },
      attachTo: document.body,
    })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')

    const press = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true })
    t2.element.dispatchEvent(press)
    await flushPromises()
    expect(press.defaultPrevented).toBe(true)
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)

    // jsdom never moves focus on mousedown; mimic the browser, which focuses
    // the target only when the mousedown default was NOT prevented.
    if (!press.defaultPrevented)
      (t2.element as HTMLElement).focus()
    await flushPromises()
    // No second (`trigger-focus`) attempt, and nothing was applied.
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')
    wrapper.unmount()
  })

  it('v-model + onBeforeUpdate:modelValue cancel keeps the current tab', async () => {
    const value = ref('tab1')
    const cancelNext = ref(true)
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      setup() {
        const onBeforeUpdate = (_value: string, details: { cancel: () => void }) => {
          if (cancelNext.value)
            details.cancel()
        }
        return { value, onBeforeUpdate }
      },
      template: `
        <TabsRoot v-model="value" @before-update:model-value="onBeforeUpdate">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsRoot>`,
    }, { attachTo: document.body })
    await flushPromises()
    const [t1, t2] = wrapper.findAll('[role="tab"]')

    await t2.trigger('click')
    await flushPromises()
    expect(value.value).toBe('tab1')
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')

    cancelNext.value = false
    await t2.trigger('click')
    await flushPromises()
    expect(value.value).toBe('tab2')
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })
})

describe('given TabsTrigger with consumer event listeners', () => {
  function mountTabs(triggerListeners: Record<string, (event: Event) => void> = {}) {
    document.body.innerHTML = ''
    const value = ref('one')
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot<string>, {
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

  it('should activate on click, not on mousedown', async () => {
    const { value, trigger } = mountTabs()
    await trigger.trigger('mousedown', { button: 0, ctrlKey: false })
    expect(value.value).toBe('one')
    await click(trigger, 1)
    expect(value.value).toBe('two')
  })

  it('should not activate on click when the consumer prevents default', async () => {
    const { value, trigger } = mountTabs({ onClick: event => event.preventDefault() })
    await click(trigger, 1)
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

describe('given a part whose value is undefined', () => {
  it('should mount a trigger and a content without a value', () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, () => [
        h(TabsList, () => h(TabsTrigger, { value: undefined as unknown as string }, () => 'Tab')),
        h(TabsContent, { value: undefined as unknown as string }, () => 'Panel'),
      ]),
    }))
    expect(wrapper.find('[role="tab"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
