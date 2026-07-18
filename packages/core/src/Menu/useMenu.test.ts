import type { MenuContentContext } from './MenuContentImpl.vue'
import type { MenuContext, MenuRootContext } from './MenuRoot.vue'
import type { UseMenuContentReturn, UseMenuRootReturn } from './useMenu'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { getMenuItemBaseSurface, getMenuItemSelectSurface, useMenuContent, useMenuRoot } from './useMenu'

// Minimal fakes — the builders only touch a handful of context fields.
function mockContentContext(overrides: Partial<MenuContentContext> = {}): MenuContentContext {
  return {
    highlightedElement: ref<HTMLElement | undefined>(undefined),
    searchRef: ref(''),
    onItemEnter: vi.fn(() => false),
    onItemLeave: vi.fn(() => false),
    onTriggerLeave: vi.fn(() => false),
    ...overrides,
  } as unknown as MenuContentContext
}

function mockRootContext(overrides: Partial<MenuRootContext> = {}): MenuRootContext {
  return {
    onClose: vi.fn(),
    dir: ref('ltr'),
    isUsingKeyboardRef: ref(false),
    modal: ref(true),
    ...overrides,
  } as unknown as MenuRootContext
}

function mockMenuContext(open = true): MenuContext {
  return {
    open: ref(open),
    onOpenChange: vi.fn(),
    content: ref<HTMLElement | undefined>(undefined),
    onContentChange: vi.fn(),
  } as unknown as MenuContext
}

describe('useMenuRoot — state-only overlay root', () => {
  function harness() {
    let api!: UseMenuRootReturn
    mount(defineComponent({
      setup() {
        api = useMenuRoot()
        return () => null
      },
    }))
    return api
  }

  it('returns the two context objects, no PartSurface', () => {
    const api = harness()
    expect(api.menuContext).toBeDefined()
    expect(api.menuRootContext).toBeDefined()
    expect('root' in api).toBe(false)
    expect('props' in api).toBe(false)
  })

  it('defaults: closed, modal, ltr', () => {
    const api = harness()
    expect(api.open.value).toBe(false)
    expect(api.menuRootContext.modal.value).toBe(true)
    expect(api.menuRootContext.dir.value).toBe('ltr')
  })

  it('onOpenChange/onClose drive the shared open ref (context sees it)', () => {
    const api = harness()
    api.onOpenChange(true)
    expect(api.open.value).toBe(true)
    expect(api.menuContext.open.value).toBe(true)
    api.onClose()
    expect(api.open.value).toBe(false)
  })

  it('onContentChange writes the content ref', () => {
    const api = harness()
    const el = document.createElement('div')
    api.menuContext.onContentChange(el)
    expect(api.menuContext.content.value).toBe(el)
  })
})

describe('getMenuItemBaseSurface — the item render surface', () => {
  it('props expose role/tabindex/aria-disabled and NO data-*; state is semantic', () => {
    const surface = getMenuItemBaseSurface(mockContentContext(), { currentElement: ref(), disabled: true })
    expect(surface.props.value).toMatchObject({ 'role': 'menuitem', 'tabindex': -1, 'aria-disabled': true })
    expect(Object.keys(surface.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(surface.state.value).toEqual({ disabled: true, highlighted: false })
  })

  it('isHighlighted tracks the content highlightedElement by element identity', () => {
    const ctx = mockContentContext()
    const el = document.createElement('div')
    const surface = getMenuItemBaseSurface(ctx, { currentElement: ref(el), disabled: false })
    expect(surface.isHighlighted.value).toBe(false)
    ctx.highlightedElement.value = el
    expect(surface.isHighlighted.value).toBe(true)
    expect(surface.state.value.highlighted).toBe(true)
  })

  it('pointermove enters + claims the highlight for an enabled item', async () => {
    const ctx = mockContentContext()
    const el = document.createElement('div')
    const surface = getMenuItemBaseSurface(ctx, { currentElement: ref(el), disabled: false })
    const evt = { defaultPrevented: false, pointerType: 'mouse', currentTarget: el } as unknown as PointerEvent
    await surface.props.value.onPointermove(evt)
    expect(ctx.onItemEnter).toHaveBeenCalled()
    expect(ctx.highlightedElement.value).toBe(el)
  })

  it('pointermove on a disabled item leaves instead of highlighting', async () => {
    const ctx = mockContentContext()
    const surface = getMenuItemBaseSurface(ctx, { currentElement: ref(), disabled: true })
    const evt = { defaultPrevented: false, pointerType: 'mouse', currentTarget: document.createElement('div') } as unknown as PointerEvent
    await surface.props.value.onPointermove(evt)
    expect(ctx.onItemLeave).toHaveBeenCalled()
    expect(ctx.highlightedElement.value).toBeUndefined()
  })
})

describe('getMenuItemSelectSurface — the select protocol', () => {
  it('click emits a cancelable select token and closes when not prevented', async () => {
    const rootContext = mockRootContext()
    const onSelect = vi.fn()
    const select = getMenuItemSelectSurface(rootContext, {
      currentElement: ref(document.createElement('div')),
      onSelect,
      searchRef: ref(''),
      disabled: false,
    })
    await select.props.value.onClick()
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0][0] as Event).cancelable).toBe(true)
    expect(rootContext.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when the consumer prevents the select token', async () => {
    const rootContext = mockRootContext()
    const select = getMenuItemSelectSurface(rootContext, {
      currentElement: ref(document.createElement('div')),
      onSelect: (e: Event) => e.preventDefault(),
      searchRef: ref(''),
      disabled: false,
    })
    await select.props.value.onClick()
    expect(rootContext.onClose).not.toHaveBeenCalled()
  })

  it('does not select a disabled item', async () => {
    const rootContext = mockRootContext()
    const onSelect = vi.fn()
    const select = getMenuItemSelectSurface(rootContext, {
      currentElement: ref(document.createElement('div')),
      onSelect,
      searchRef: ref(''),
      disabled: true,
    })
    await select.props.value.onClick()
    expect(onSelect).not.toHaveBeenCalled()
    expect(rootContext.onClose).not.toHaveBeenCalled()
  })

  it('keydown on a selection key clicks the item and preventsDefault', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.fn()
    el.click = clickSpy
    const select = getMenuItemSelectSurface(mockRootContext(), {
      currentElement: ref(el),
      onSelect: vi.fn(),
      searchRef: ref(''),
      disabled: false,
    })
    const evt = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    Object.defineProperty(evt, 'currentTarget', { value: el })
    await select.props.value.onKeydown(evt)
    expect(clickSpy).toHaveBeenCalled()
    expect(evt.defaultPrevented).toBe(true)
  })

  it('keydown Space is ignored while typing ahead', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.fn()
    el.click = clickSpy
    const select = getMenuItemSelectSurface(mockRootContext(), {
      currentElement: ref(el),
      onSelect: vi.fn(),
      searchRef: ref('foo'),
      disabled: false,
    })
    const evt = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    Object.defineProperty(evt, 'currentTarget', { value: el })
    await select.props.value.onKeydown(evt)
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('pointerup dispatches a click only when pointer moved between items', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.fn()
    el.click = clickSpy
    const select = getMenuItemSelectSurface(mockRootContext(), {
      currentElement: ref(el),
      onSelect: vi.fn(),
      searchRef: ref(''),
      disabled: false,
    })
    // No preceding pointerdown on THIS item (pointer moved from another) → click.
    const evt = { defaultPrevented: false, currentTarget: el } as unknown as PointerEvent
    await select.props.value.onPointerup(evt)
    await nextTick()
    expect(clickSpy).toHaveBeenCalled()

    // pointerdown on this item first → no synthetic click on pointerup.
    clickSpy.mockClear()
    select.props.value.onPointerdown()
    await select.props.value.onPointerup(evt)
    await nextTick()
    expect(clickSpy).not.toHaveBeenCalled()
  })
})

describe('useMenuContent — the overlay brain', () => {
  function harness(overrides: Partial<Parameters<typeof useMenuContent>[0]> = {}) {
    let api!: UseMenuContentReturn
    const contentEl = document.createElement('div')
    const contentElement = ref<HTMLElement | undefined>(contentEl)
    mount(defineComponent({
      setup() {
        api = useMenuContent({
          menuContext: mockMenuContext(true),
          rootContext: mockRootContext(),
          contentElement,
          getItems: () => [],
          ...overrides,
        })
        return () => null
      },
    }))
    return { api, contentEl }
  }

  it('content.props is the role=menu surface incl. the functional data-reka-menu-content selector', () => {
    const { api } = harness()
    expect(api.content.props.value).toMatchObject({
      'role': 'menu',
      'aria-orientation': 'vertical',
      'data-reka-menu-content': '',
      'dir': 'ltr',
    })
    expect(typeof api.content.props.value.onKeydown).toBe('function')
    expect(typeof api.content.props.value.onPointermove).toBe('function')
  })

  it('content.state maps the open state to data-state', () => {
    expect(harness().api.content.state.value.state).toBe('open')
  })

  it('provides the pointer-grace closure trio + the shared highlight/search refs', () => {
    const { api } = harness()
    expect(typeof api.contentContext.onItemEnter).toBe('function')
    expect(typeof api.contentContext.onItemLeave).toBe('function')
    expect(typeof api.contentContext.onTriggerLeave).toBe('function')
    expect(api.contentContext.searchRef).toBe(api.searchRef)
    expect(api.contentContext.highlightedElement).toBe(api.highlightedElement)
  })

  it('onItemLeave (not moving to a submenu) refocuses content and clears currentItemId', () => {
    const { api, contentEl } = harness()
    const focusSpy = vi.spyOn(contentEl, 'focus')
    api.currentItemId.value = 'x'
    const movingToSubmenu = api.contentContext.onItemLeave({} as PointerEvent)
    expect(movingToSubmenu).toBe(false)
    expect(focusSpy).toHaveBeenCalled()
    expect(api.currentItemId.value).toBe(null)
  })

  it('handleMountAutoFocus focuses content, and the openAutoFocus veto suppresses it', () => {
    const onOpenAutoFocus = vi.fn()
    const open = harness({ onOpenAutoFocus })
    const openFocus = vi.spyOn(open.contentEl, 'focus')
    const evt = new Event('focus', { cancelable: true })
    open.api.handleMountAutoFocus(evt)
    expect(onOpenAutoFocus).toHaveBeenCalledWith(evt)
    expect(openFocus).toHaveBeenCalled()

    const vetoed = harness({ onOpenAutoFocus: (e: Event) => e.preventDefault() })
    const vetoedFocus = vi.spyOn(vetoed.contentEl, 'focus')
    vetoed.api.handleMountAutoFocus(new Event('focus', { cancelable: true }))
    expect(vetoedFocus).not.toHaveBeenCalled()
  })
})
