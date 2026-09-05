import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
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
    await t2.trigger('mousedown')
    await flushPromises()
    expect(t2.attributes('data-state')).toBe('checked')
    expect(t2.attributes('id')).toBe(idBefore)
    wrapper.unmount()
  })

  it('automatic activation: focusing a trigger activates its tab', async () => {
    const wrapper = mount(twoTabFixture, { attachTo: document.body })
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

  it('chains a consumer mousedown listener with the internal activation', async () => {
    const spy = vi.fn()
    const wrapper = mount({
      components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
      setup() {
        return { spy }
      },
      template: `
        <TabsRoot default-value="tab1">
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
    await t2.trigger('mousedown')
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
        'onBeforeUpdate:modelValue': (_value: string, details: { cancel: () => void }) => details.cancel(),
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

    await t2.trigger('mousedown')
    await flushPromises()
    expect(value.value).toBe('tab1')
    expect(t1.attributes('data-state')).toBe('checked')
    expect(t2.attributes('data-state')).toBe('unchecked')

    cancelNext.value = false
    await t2.trigger('mousedown')
    await flushPromises()
    expect(value.value).toBe('tab2')
    expect(t2.attributes('data-state')).toBe('checked')
    wrapper.unmount()
  })
})
