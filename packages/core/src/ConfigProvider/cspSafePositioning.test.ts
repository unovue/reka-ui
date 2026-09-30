import { renderToString } from '@vue/server-renderer'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, h, nextTick } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxRoot } from '@/Combobox'
import { ConfigProvider } from '@/ConfigProvider'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { HoverCardContent, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import { PopoverArrow, PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SelectContent, SelectItem, SelectItemText, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'

// Consumers pass their own inline styles (CSS variables, layout) through `PopperContent`,
// `DismissableLayer` and friends, so the flag must hold for the full component, not only
// the bare `Popper` parts. See issue #2732.
function select(position: 'item-aligned' | 'popper') {
  return h(SelectRoot, { open: true, modelValue: 'a' }, () => [
    h(SelectTrigger, null, () => 'trigger'),
    h(SelectContent, { position }, () =>
      h(SelectViewport, null, () =>
        h(SelectItem, { value: 'a' }, () => h(SelectItemText, null, () => 'a')))),
  ])
}

function combobox(position: 'inline' | 'popper') {
  return h(ComboboxRoot, { open: true }, () => [
    h(ComboboxAnchor, null, () => h(ComboboxInput)),
    h(ComboboxContent, { position }, () => h(ComboboxItem, { value: 'a' }, () => 'a')),
  ])
}

const components = {
  popover: () => h(PopoverRoot, { open: true }, () => [
    h(PopoverTrigger, null, () => 'trigger'),
    h(PopoverContent, null, () => ['content', h(PopoverArrow)]),
  ]),
  hoverCard: () => h(HoverCardRoot, { open: true }, () => [
    h(HoverCardTrigger, null, () => 'trigger'),
    h(HoverCardContent, null, () => 'content'),
  ]),
  dropdownMenu: () => h(DropdownMenuRoot, { open: true }, () => [
    h(DropdownMenuTrigger, null, () => 'trigger'),
    h(DropdownMenuContent, null, () => h(DropdownMenuItem, null, () => 'item')),
  ]),
  selectItemAligned: () => select('item-aligned'),
  selectPopper: () => select('popper'),
  comboboxInline: () => combobox('inline'),
  comboboxPopper: () => combobox('popper'),
}

function withConfig(render: () => any, cspSafePositioning: boolean) {
  return () => h(ConfigProvider, { cspSafePositioning }, () => h('div', render()))
}

describe('configProvider cspSafePositioning', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })
  afterAll(() => vi.unstubAllGlobals())

  describe.each(Object.entries(components))('%s', (_, render) => {
    it('emits inline styles during SSR by default', async () => {
      const html = await renderToString(createSSRApp({ render: withConfig(render, false) }))
      expect(html).toContain('style=')
    })

    it('emits no style attribute during SSR when enabled', async () => {
      const html = await renderToString(createSSRApp({ render: withConfig(render, true) }))
      expect(html).not.toContain('style=')
    })
  })

  it('hydrates without mismatch and applies styles after mount', async () => {
    const render = withConfig(components.popover, true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = await renderToString(createSSRApp({ render }))

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp({ render })
    app.mount(container)
    await nextTick()

    const mismatch = [...warn.mock.calls, ...error.mock.calls].filter(args => String(args[0]).includes('mismatch'))
    warn.mockRestore()
    error.mockRestore()
    expect(mismatch).toEqual([])

    const wrapper = container.querySelector<HTMLElement>('[data-reka-popper-content-wrapper]')!
    expect(wrapper.style.position).toBe('fixed')
    const content = container.querySelector<HTMLElement>('[role="dialog"]')!
    expect(content.style.getPropertyValue('--reka-popover-content-transform-origin')).toBe('var(--reka-popper-transform-origin)')
    app.unmount()
  })

  it('applies consumer styles after mount on a client-only render', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({ render: withConfig(components.comboboxPopper, true) })
    app.mount(container)
    await nextTick()

    const content = container.querySelector<HTMLElement>('[role="listbox"]')!
    expect(content.style.boxSizing).toBe('border-box')
    expect(content.style.display).toBe('flex')
    app.unmount()
  })

  it('keeps a consumer style overriding SelectContent defaults', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({
      render: () => h(SelectRoot, { open: true, modelValue: 'a' }, () => [
        h(SelectTrigger, null, () => 'trigger'),
        h(SelectContent, { style: { maxHeight: '50px' } }, () =>
          h(SelectViewport, null, () =>
            h(SelectItem, { value: 'a' }, () => h(SelectItemText, null, () => 'a')))),
      ]),
    })
    app.mount(container)
    await nextTick()

    const content = container.querySelector<HTMLElement>('[role="listbox"]')!
    expect(content.style.maxHeight).toBe('50px')
    app.unmount()
  })
})
