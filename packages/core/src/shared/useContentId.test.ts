import type { Ref, VNode } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, ref, useId } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger } from '@/NavigationMenu'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'

interface Family {
  /** Whether the first content starts open (or selected). */
  open: boolean
  /** `open` is toggled by the test; `contentProps` are spread on the first content. */
  render: (open: Ref<boolean>, contentProps?: Record<string, unknown>) => VNode
}

function selection(open: Ref<boolean>, closed: string) {
  return {
    'modelValue': open.value ? 'a' : closed,
    'onUpdate:modelValue': (value: unknown) => { open.value = value === 'a' },
  }
}

function collapsible(open: Ref<boolean>, contentProps?: Record<string, unknown>) {
  return h(CollapsibleRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }, () => [
    h(CollapsibleTrigger, () => 'Trigger'),
    h(CollapsibleContent, contentProps, () => 'Content'),
  ])
}

const families: Record<string, Family> = {
  'Collapsible (open)': { open: true, render: collapsible },
  'Collapsible (closed)': { open: false, render: collapsible },
  'Accordion': {
    open: true,
    render: (open, contentProps) => h(AccordionRoot, { type: 'single', collapsible: true, ...selection(open, 'b') }, () => [
      h(AccordionItem, { value: 'a' }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => 'A')), h(AccordionContent, contentProps, () => 'Content A')]),
      h(AccordionItem, { value: 'b' }, () => [h(AccordionHeader, () => h(AccordionTrigger, () => 'B')), h(AccordionContent, () => 'Content B')]),
    ]),
  },
  'NavigationMenu (forceMount)': {
    open: true,
    render: (open, contentProps) => h(NavigationMenuRoot, selection(open, ''), () => h(NavigationMenuList, () => [
      h(NavigationMenuItem, { value: 'a' }, () => [h(NavigationMenuTrigger, () => 'A'), h(NavigationMenuContent, { forceMount: true, ...contentProps }, () => 'Content A')]),
      h(NavigationMenuItem, { value: 'b' }, () => [h(NavigationMenuTrigger, () => 'B'), h(NavigationMenuContent, { forceMount: true }, () => 'Content B')]),
    ])),
  },
  'Tabs': {
    open: true,
    render: (open, contentProps) => h(TabsRoot, selection(open, 'b'), () => [
      h(TabsList, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B')]),
      h(TabsContent, { value: 'a', ...contentProps }, () => 'Content A'),
      h(TabsContent, { value: 'b' }, () => 'Content B'),
    ]),
  },
}

// `usedIds` stands for whatever else consumed ids before the family rendered: when the
// server and the client disagree on it, every generated id differs between the two.
function createFixture(family: Family, open: Ref<boolean>, usedIds = 0, contentProps?: Ref<Record<string, unknown>>) {
  return defineComponent({
    setup() {
      for (let i = 0; i < usedIds; i++)
        useId()
      return () => family.render(open, contentProps?.value)
    },
  })
}

/** Every id reference of the family, with whether an element carries that id. */
function references(root: ParentNode) {
  return ['aria-controls', 'aria-labelledby'].flatMap(attribute =>
    Array.from(root.querySelectorAll(`[${attribute}]`), (element) => {
      const id = element.getAttribute(attribute)!
      return { attribute, id, resolves: !!id && !!root.querySelector(`[id="${id}"]`) }
    }))
}

function expectResolvedReferences(root: ParentNode, count: { controls: number }) {
  const all = references(root)
  expect(all.filter(reference => !reference.resolves)).toEqual([])
  expect(all.filter(reference => reference.attribute === 'aria-controls')).toHaveLength(count.controls)
}

async function settle() {
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 20))
  await flushPromises()
}

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe.each(Object.entries(families))('%s', (name, family) => {
  // One `aria-controls` per trigger.
  const controls = name.startsWith('Collapsible') ? 1 : 2

  it('never renders an empty aria-controls', async () => {
    const server = await renderToString(createSSRApp(createFixture(family, ref(family.open))))
    expect(server).not.toContain('aria-controls=""')

    const wrapper = mount(createFixture(family, ref(family.open)), { attachTo: document.body })
    expect(wrapper.html()).not.toContain('aria-controls=""')
    wrapper.unmount()
  })

  it('references the content from its trigger before any interaction', async () => {
    const wrapper = mount(createFixture(family, ref(family.open)), { attachTo: document.body })
    await settle()

    expectResolvedReferences(document.body, { controls })
    wrapper.unmount()
  })

  it('keeps the references resolvable when server and client ids diverge', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(family, ref(family.open), 5)))
    document.body.append(container)

    const open = ref(family.open)
    const app = createSSRApp(createFixture(family, open))
    app.mount(container)
    await settle()
    expectResolvedReferences(container, { controls })

    open.value = !open.value
    await settle()
    expectResolvedReferences(container, { controls })

    open.value = !open.value
    await settle()
    expectResolvedReferences(container, { controls })

    app.unmount()
  })

  it('follows an id the consumer passes to the content', async () => {
    const contentProps = ref<Record<string, unknown>>({ id: 'consumer-content' })
    const wrapper = mount(createFixture(family, ref(family.open), 0, contentProps), { attachTo: document.body })
    await settle()

    expect(document.getElementById('consumer-content')).not.toBeNull()
    expect(wrapper.find('[aria-controls]').attributes('aria-controls')).toBe('consumer-content')
    expectResolvedReferences(document.body, { controls })

    contentProps.value = { id: 'changed-content' }
    await settle()

    expect(document.getElementById('changed-content')).not.toBeNull()
    expect(wrapper.find('[aria-controls]').attributes('aria-controls')).toBe('changed-content')
    expectResolvedReferences(document.body, { controls })
    wrapper.unmount()
  })
})

describe('given a NavigationMenu rendered on the server', () => {
  it('renders the trigger id its content is labelled by', async () => {
    const family = families['NavigationMenu (forceMount)']
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture(family, ref(true))))

    const labelledBy = Array.from(container.querySelectorAll('[aria-labelledby]'), element => element.getAttribute('aria-labelledby'))
    expect(labelledBy).toHaveLength(2)
    expect(Array.from(container.querySelectorAll('[data-navigation-menu-trigger]'), element => element.id)).toEqual(labelledBy)
  })
})
