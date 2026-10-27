import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createShadowHost } from '@/shared/test/shadowDom'
import { resetBodyScrollLock, useBodyScrollLock } from '@/shared/useBodyScrollLock'
import { sleep } from '@/test'
import { DismissableLayerBranch, DismissableLayer as DismissableLayerPrimitive } from '.'
import { branches, resetLayerStack } from './layerStack'
import DismissableLayer from './story/_DismissableLayer.vue'
import { isLayerExist } from './utils'

const OPEN_LABEL = 'Open'
const CLOSE_LABEL = 'Close'
const OUTSIDE_LABEL = 'Outside'

describe('isLayerExist', () => {
  it('should return false for non-Element targets without throwing', () => {
    const layer = document.createElement('div')
    layer.setAttribute('data-dismissable-layer', '')

    expect(isLayerExist(layer, document as any)).toBe(false)
    expect(isLayerExist(layer, document.createTextNode('x') as any)).toBe(false)
  })

  it('should treat the layer root and its unmarked descendants as inside (#2803)', () => {
    // Mirrors `FocusScope > DismissableLayer > PopperContent` rendered `asChild`:
    // the layer root is the popper wrapper, `[data-dismissable-layer]` lands on
    // the content element inside it.
    const root = document.createElement('div')
    const layer = document.createElement('div')
    layer.setAttribute('data-dismissable-layer', '')
    root.appendChild(layer)
    const outside = document.createElement('button')
    document.body.append(root, outside)

    expect(isLayerExist(root, root)).toBe(true)
    expect(isLayerExist(root, layer)).toBe(true)
    expect(isLayerExist(root, outside)).toBe(false)

    root.remove()
    outside.remove()
  })

  it('should recognize a nested layer from another realm as inside (#2949)', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    onTestFinished(() => iframe.remove())
    const iframeDocument = iframe.contentDocument!
    const parentLayer = iframeDocument.createElement('div')
    parentLayer.setAttribute('data-dismissable-layer', '')
    const childLayer = iframeDocument.createElement('div')
    childLayer.setAttribute('data-dismissable-layer', '')
    const item = iframeDocument.createElement('button')
    childLayer.appendChild(item)
    iframeDocument.body.append(parentLayer, childLayer)

    expect(item instanceof Element).toBe(false)
    expect(isLayerExist(parentLayer, item)).toBe(true)
  })
})

describe('given a DismissableLayerBranch', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetLayerStack()
  })

  it('should leave the branch registry empty after unmounting', async () => {
    const wrapper = mount(DismissableLayerBranch, { attachTo: document.body })
    await nextTick()
    const branch = wrapper.element
    expect(branches.includes(branch)).toBe(true)
    expect(branches.length).toBe(1)

    wrapper.unmount()
    await nextTick()
    expect(branches.includes(branch)).toBe(false)
    expect(branches.length).toBe(0)
  })
})

/** Every internal backdrop currently in the document, in DOM order. */
function backdrops() {
  return [...document.querySelectorAll<HTMLElement>('[data-reka-internal-backdrop]')]
}

/** The internal backdrop that sits right below the layer with `testId`. */
function backdropOf(testId: string) {
  const layer = document.querySelector(`[data-testid="${testId}"]`)
  const previous = layer?.previousElementSibling
  return previous?.hasAttribute('data-reka-internal-backdrop') ? previous as HTMLElement : null
}

describe('nested layers with disableOutsidePointerEvents (#2674, #2822)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    resetLayerStack()
  })

  function mountNested() {
    const outerOpen = ref(true)
    const innerOpen = ref(false)
    // Mirrors how a modal Menu drives the prop (`menuContext.open.value`):
    // the layer stays mounted while the prop toggles back to `false`.
    const innerDisable = ref(true)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          outerOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'outer' }, () => 'Outer')
            : null,
          innerOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': innerDisable.value, 'data-testid': 'inner' }, () => 'Inner')
            : null,
        ])
      },
    }), { attachTo: document.body })

    return { wrapper, outerOpen, innerOpen, innerDisable }
  }

  it('should mount one backdrop right below each modal layer and never touch body pointer-events', async () => {
    const { wrapper, innerOpen } = mountNested()
    await sleep(1)
    expect(backdrops()).toHaveLength(1)
    expect(backdropOf('outer')).not.toBeNull()
    expect(document.body.style.pointerEvents).toBe('')

    innerOpen.value = true
    await sleep(1)
    expect(backdrops()).toHaveLength(2)
    expect(backdropOf('inner')).not.toBeNull()
    expect(document.body.style.pointerEvents).toBe('')

    innerOpen.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(1)
    expect(backdropOf('outer')).not.toBeNull()
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
    expect(backdrops()).toHaveLength(0)
  })

  it('should remove only the nested backdrop when the nested layer toggles disableOutsidePointerEvents to false', async () => {
    const { wrapper, innerOpen, innerDisable } = mountNested()
    innerOpen.value = true
    await sleep(1)
    expect(backdrops()).toHaveLength(2)

    // Toggle the prop off without unmounting (a modal Menu closing)
    innerDisable.value = false
    await sleep(1)
    expect(backdropOf('inner')).toBeNull()
    expect(backdropOf('outer')).not.toBeNull()

    innerOpen.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(1)

    wrapper.unmount()
  })

  it('should remove and re-mount the backdrop as the only layer toggles disableOutsidePointerEvents', async () => {
    const disable = ref(true)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': disable.value, 'data-testid': 'only' }, () => 'Only')
      },
    }), { attachTo: document.body })

    await sleep(1)
    expect(backdropOf('only')).not.toBeNull()

    disable.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(0)

    disable.value = true
    await sleep(1)
    expect(backdropOf('only')).not.toBeNull()
    expect(backdrops()).toHaveLength(1)

    wrapper.unmount()
    expect(backdrops()).toHaveLength(0)
  })

  it('should dismiss only the top modal layer on a press on its backdrop', async () => {
    const outerDismiss = vi.fn()
    const innerDismiss = vi.fn()
    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'outer', 'onDismiss': outerDismiss }, () => 'Outer'),
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'inner', 'onDismiss': innerDismiss }, () => 'Inner'),
        ])
      },
    }), { attachTo: document.body })
    await sleep(1)

    await fireEvent.pointerDown(backdropOf('inner')!)
    await sleep(1)
    expect(innerDismiss).toHaveBeenCalledWith(expect.objectContaining({ reason: 'outside-press' }))
    expect(outerDismiss).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})

describe('sibling layers with disableOutsidePointerEvents', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    // Module-level manager state: keep this suite order-independent even if a
    // failing test skipped its unmounts.
    resetLayerStack()
  })

  // The older disabling layer leaves the stack while a newer sibling is still
  // present: the #2784 scenario (a closing animated Popover whose layer
  // unmounts after a Dialog has already opened).
  function mountSiblings() {
    const popoverOpen = ref(true)
    const dialogOpen = ref(false)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          popoverOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'popover' }, () => 'Popover')
            : null,
          dialogOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'dialog' }, () => 'Dialog')
            : null,
        ])
      },
    }), { attachTo: document.body })

    return { wrapper, popoverOpen, dialogOpen }
  }

  it('should keep the newer layer\'s backdrop after the older layer unmounts', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountSiblings()
    await sleep(1)
    expect(backdropOf('popover')).not.toBeNull()

    dialogOpen.value = true
    await sleep(1)
    expect(backdrops()).toHaveLength(2)

    popoverOpen.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(1)
    expect(backdropOf('dialog')).not.toBeNull()

    dialogOpen.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(0)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })

  it('should hand off the backdrop when both change in the same tick', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountSiblings()
    await sleep(1)

    popoverOpen.value = false
    dialogOpen.value = true
    await sleep(1)
    expect(backdrops()).toHaveLength(1)
    expect(backdropOf('dialog')).not.toBeNull()

    dialogOpen.value = false
    await sleep(1)
    expect(backdrops()).toHaveLength(0)

    wrapper.unmount()
  })
})

describe('scroll locks and modal layers are independent (#2784, #2867, #2822)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    resetLayerStack()
    resetBodyScrollLock()
  })

  // Mimics a modal content that holds a page scroll lock while mounted.
  const ScrollLock = defineComponent({
    setup() {
      useBodyScrollLock(true)
      return () => h('div', 'overlay')
    },
  })

  /** Mounts a scroll-lock holder and a modal layer, each toggled by its own ref. */
  function mountLockAndLayer() {
    const lockOpen = ref(false)
    const layerOpen = ref(false)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          lockOpen.value ? h(ScrollLock) : null,
          layerOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'dialog' }, () => 'dialog')
            : null,
        ])
      },
    }), { attachTo: document.body })

    return { wrapper, lockOpen, layerOpen }
  }

  const isScrollLocked = () => getComputedStyle(document.body).overflowY === 'hidden'

  it.each([
    ['the lock', 'the layer'],
    ['the layer', 'the lock'],
  ] as const)('should restore the page once %s and then %s release', async (first) => {
    const { wrapper, lockOpen, layerOpen } = mountLockAndLayer()
    lockOpen.value = true
    layerOpen.value = true
    await sleep(10) // the scroll lock applies a macrotask later
    expect(isScrollLocked()).toBe(true)
    expect(backdrops()).toHaveLength(1)

    if (first === 'the lock')
      lockOpen.value = false
    else
      layerOpen.value = false
    await sleep(10) // the scroll lock applies a macrotask later
    expect(isScrollLocked()).toBe(first !== 'the lock')
    expect(backdrops()).toHaveLength(first === 'the lock' ? 1 : 0)

    lockOpen.value = false
    layerOpen.value = false
    await sleep(10) // the scroll lock applies a macrotask later
    expect(isScrollLocked()).toBe(false)
    expect(backdrops()).toHaveLength(0)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })

  it('should preserve a page-defined body pointer-events value through the whole cycle', async () => {
    document.body.style.pointerEvents = 'auto'
    const { wrapper, lockOpen, layerOpen } = mountLockAndLayer()
    lockOpen.value = true
    layerOpen.value = true
    await sleep(10) // the scroll lock applies a macrotask later
    expect(document.body.style.pointerEvents).toBe('auto')

    lockOpen.value = false
    layerOpen.value = false
    await sleep(10) // the scroll lock applies a macrotask later
    expect(document.body.style.pointerEvents).toBe('auto')

    wrapper.unmount()
  })
})

describe('given a DismissableLayer inside a positioned popper wrapper', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetLayerStack()
  })

  it('should mount the backdrop next to the wrapper, not inside it, and cut the cutout element out', async () => {
    const cutout = document.createElement('button')
    document.body.append(cutout)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { 'data-reka-popper-content-wrapper': '', 'style': 'transform: translate(10px, 10px)' }, [
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'backdropCutout': cutout, 'data-testid': 'content' }, () => 'Content'),
        ])
      },
    }), { attachTo: document.body })
    await sleep(1)

    const popperWrapper = document.querySelector('[data-reka-popper-content-wrapper]')!
    const [backdrop] = backdrops()
    expect(backdrop.nextElementSibling).toBe(popperWrapper)
    expect(backdrop.style.position).toBe('fixed')
    expect(backdrop.getAttribute('role')).toBe('presentation')
    expect(backdrop.style.clipPath).toContain('polygon(')

    wrapper.unmount()
    expect(backdrops()).toHaveLength(0)
  })

  it('should keep the cutout in place as the cutout or the viewport resizes, and stop tracking on unmount', async () => {
    const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('ResizeObserver', class {
      disconnect = vi.fn()
      constructor(public callback: () => void) {
        observers.push(this)
      }

      observe() {}
    })
    onTestFinished(() => vi.unstubAllGlobals())

    const cutout = document.createElement('button')
    document.body.append(cutout)
    let rect = { left: 10, top: 20, right: 110, bottom: 60 }
    vi.spyOn(cutout, 'getBoundingClientRect').mockImplementation(() => ({ ...rect }) as DOMRect)

    const wrapper = mount(defineComponent({
      setup: () => () => h(DismissableLayerPrimitive, { disableOutsidePointerEvents: true, backdropCutout: cutout }, () => 'Content'),
    }), { attachTo: document.body })
    await sleep(1)

    const [backdrop] = backdrops()
    expect(backdrop.style.clipPath).toContain('10px 20px')

    rect = { left: 30, top: 40, right: 130, bottom: 80 }
    observers[0].callback()
    expect(backdrop.style.clipPath).toContain('30px 40px')

    rect = { left: 50, top: 60, right: 150, bottom: 100 }
    window.dispatchEvent(new Event('resize'))
    expect(backdrop.style.clipPath).toContain('50px 60px')

    wrapper.unmount()
    expect(observers[0].disconnect).toHaveBeenCalled()
    rect = { left: 70, top: 80, right: 170, bottom: 120 }
    window.dispatchEvent(new Event('resize'))
    expect(backdrop.style.clipPath).toContain('50px 60px')
  })

  it('should give the backdrop the z-index of the layer, or of the popper wrapper', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => [
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'style': 'position: fixed; z-index: 30', 'data-testid': 'fixed' }, () => 'Fixed'),
          h('div', { 'data-reka-popper-content-wrapper': '', 'style': 'position: fixed' }, [
            h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'style': 'z-index: 50', 'data-testid': 'popper' }, () => 'Popper'),
          ]),
        ]
      },
    }), { attachTo: document.body })
    await sleep(1)

    const zIndexes = backdrops().map(el => el.style.zIndex)
    expect(zIndexes).toEqual(['30', '50'])
    wrapper.unmount()
  })

  it('should mount the backdrop in body, with a hole over the layer, when a transformed ancestor would contain it', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { 'data-testid': 'card', 'style': 'transform: translateX(0)' }, [
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'style': 'position: fixed; z-index: 50', 'data-testid': 'layer' }, () => 'Content'),
        ])
      },
    }), { attachTo: document.body })
    const layer = document.querySelector<HTMLElement>('[data-testid="layer"]')!
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({ left: 5, top: 6, right: 105, bottom: 106 } as DOMRect)
    await sleep(1)
    window.dispatchEvent(new Event('resize'))

    const [backdrop] = backdrops()
    expect(backdrop.parentElement).toBe(document.body)
    expect(document.querySelector('[data-testid="card"]')!.contains(backdrop)).toBe(false)
    expect(backdrop.style.zIndex).toBe('50')
    expect(backdrop.style.clipPath).toContain('5px 6px')

    wrapper.unmount()
    expect(backdrops()).toHaveLength(0)
  })

  it('should mount the backdrop before a fixed container that wraps the layer (scrollable overlay)', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', { 'data-testid': 'overlay', 'style': 'position: fixed; inset: 0; overflow-y: auto' }, [
          h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'content' }, () => 'Content'),
        ])
      },
    }), { attachTo: document.body })
    await sleep(1)

    const [backdrop] = backdrops()
    expect(backdrop.nextElementSibling).toBe(document.querySelector('[data-testid="overlay"]'))

    wrapper.unmount()
    expect(backdrops()).toHaveLength(0)
  })
})

describe('given a default DismissableLayer', () => {
  let wrapper: VueWrapper<InstanceType<typeof DismissableLayer>>
  let trigger: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DismissableLayer, { attachTo: document.body, props: { openLabel: OPEN_LABEL, closeLabel: CLOSE_LABEL, outsideLabel: OUTSIDE_LABEL } })
    trigger = wrapper.find('button')
  })

  it('should render button without content', async () => {
    expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
  })

  describe('after clicking a trigger', () => {
    beforeEach(async () => {
      await fireEvent.click(trigger.element)
      const buttons = wrapper.findAll('button')
      buttons.find(i => i.text() === CLOSE_LABEL)?.element.focus()
    })

    it('should render the content', () => {
      expect(document.body.innerHTML).toContain(CLOSE_LABEL)
    })

    describe('pressing Escape', () => {
      it('should close layer', async () => {
        const layer = wrapper.findComponent('#layer') as VueWrapper
        await fireEvent.keyDown(document.body, { key: 'Escape' })
        expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
        expect(layer.emitted('escapeKeyDown')?.length).toBe(1)
        expect(layer.emitted('dismiss')?.length).toBe(1)
        expect(layer.emitted('dismiss')?.[0][0]).toMatchObject({ reason: 'escape-key' })
      })

      it('should not close layer when prevented', async () => {
        await wrapper.setProps({ preventEscapeKeyDownEvent: true })
        const layer = wrapper.findComponent('#layer') as VueWrapper
        await fireEvent.keyDown(document.body, { key: 'Escape' })
        expect(document.body.innerHTML).toContain(CLOSE_LABEL)
        expect(layer.emitted('escapeKeyDown')?.length).toBe(1)
      })
    })

    describe('focus Outside', () => {
      it('should close layer', async () => {
        const layer = wrapper.findComponent('#layer') as VueWrapper
        const outsideEl = document.getElementById('outside') as HTMLElement
        outsideEl.focus()
        await sleep(1)
        expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
        expect(layer.emitted('dismiss')?.[0][0]).toMatchObject({ reason: 'focus-outside' })
      })

      it('should not close layer when prevented', async () => {
        await wrapper.setProps({ preventFocusOutsideEvent: true })
        const outsideEl = document.getElementById('outside') as HTMLElement
        outsideEl.focus()
        await sleep(1)
        expect(document.body.innerHTML).toContain(CLOSE_LABEL)
      })
    })
  })
})

describe('given a DismissableLayer after a cancelled touch tap outside', () => {
  beforeEach(() => {
    resetLayerStack()
    document.body.innerHTML = ''
  })

  // jsdom has no `PointerEvent`, so `fireEvent.pointerDown` loses `pointerType`
  // and would take the mouse path instead of the deferred touch one.
  function touchPointerDown(target: EventTarget) {
    const event = new MouseEvent('pointerdown', { bubbles: true })
    Object.defineProperty(event, 'pointerType', { value: 'touch' })
    target.dispatchEvent(event)
  }

  // Regression: on touch, `pointerDownOutside` is deferred to the next `click`.
  // When the outside tap turns into a scroll or drag no `click` follows, so the
  // deferred dispatch stays pending. The next tap INSIDE the layer (or a nested
  // layer above it) must drop that stale deferral instead of letting its own
  // `click` dismiss the layer. Mirrors radix-ui/primitives#2171.
  it('should not dismiss on the next tap inside a nested layer', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          h(DismissableLayerPrimitive, { 'data-testid': 'outer' }, () => 'Outer'),
          h(DismissableLayerPrimitive, { 'data-testid': 'inner' }, () => [
            h('button', { 'data-testid': 'inner-button' }, 'Inner'),
          ]),
        ])
      },
    }), { attachTo: document.body })
    await sleep(1)

    const outer = wrapper.findComponent('[data-testid="outer"]') as VueWrapper
    const innerButton = wrapper.find('[data-testid="inner-button"]').element

    // Outside touch that is cancelled: no `click` follows the `pointerdown`.
    touchPointerDown(document.body)
    await sleep(1)

    // Next tap lands inside the nested layer.
    touchPointerDown(innerButton)
    await fireEvent.click(innerButton)
    await sleep(1)

    expect(outer.emitted('pointerDownOutside')).toBeUndefined()
    expect(outer.emitted('dismiss')).toBeUndefined()

    // A completed tap outside still dismisses the outer layer.
    touchPointerDown(document.body)
    await fireEvent.click(document.body)
    await sleep(1)

    expect(outer.emitted('pointerDownOutside')?.length).toBe(1)
    expect(outer.emitted('dismiss')?.length).toBe(1)

    wrapper.unmount()
  })

  it('should not dismiss on the next tap inside the layer itself', async () => {
    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      slots: { default: () => h('button', { 'data-testid': 'inside' }, 'Inside') },
    })
    await sleep(1)

    const inside = wrapper.find('[data-testid="inside"]').element

    touchPointerDown(document.body)
    await sleep(1)

    touchPointerDown(inside)
    await fireEvent.click(inside)
    await sleep(1)

    expect(wrapper.emitted('pointerDownOutside')).toBeUndefined()
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    wrapper.unmount()
  })
})

describe('given a mounted DismissableLayer toggling disableOutsidePointerEvents', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    resetLayerStack()
  })

  // Regression: with `unmountOnHide: false` the layer stays mounted while
  // `disableOutsidePointerEvents` toggles `true` -> `false`. Its backdrop must
  // go away even though the component is never unmounted.
  it('should remove the backdrop when toggled off while staying mounted', async () => {
    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()
    expect(backdrops()).toHaveLength(1)

    await wrapper.setProps({ disableOutsidePointerEvents: false })
    await nextTick()
    expect(backdrops()).toHaveLength(0)
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('should keep the other layer\'s backdrop while it still disables pointer events', async () => {
    const first = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    const second = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()
    expect(backdrops()).toHaveLength(2)

    // Close the second (topmost) layer without unmounting it.
    await second.setProps({ disableOutsidePointerEvents: false })
    await nextTick()
    expect(backdrops()).toHaveLength(1)
    expect(backdrops()[0].nextElementSibling).toBe(first.element)

    await first.setProps({ disableOutsidePointerEvents: false })
    await nextTick()
    expect(backdrops()).toHaveLength(0)
  })
})

describe('given a not-present DismissableLayer (e.g. unmountOnHide hidden)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // Regression: a layer kept mounted while hidden (`present: false`) is out of
  // the layer stack, so its `index` is `-1`. With no visible layer present,
  // `-1 === size - 1` would otherwise make it look like the highest layer and
  // emit `escapeKeyDown` / `dismiss` for a dialog that is already closed.
  it('should not emit escapeKeyDown or dismiss on Escape while not present', async () => {
    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { present: false },
    })
    await nextTick()

    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(wrapper.emitted('escapeKeyDown')).toBeUndefined()
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  // Regression: on touch, `pointerDownOutside` is deferred to the `click` event.
  // A layer listening while not present captures the `pointerdown` of the tap that
  // opens it, and dismisses itself when that tap's `click` arrives.
  it('should not dismiss on the tap that made it present', async () => {
    // jsdom has no `PointerEvent`, so `fireEvent.pointerDown` loses `pointerType`
    // and would take the mouse path instead of the deferred touch one.
    function touchPointerDown() {
      const event = new MouseEvent('pointerdown', { bubbles: true })
      Object.defineProperty(event, 'pointerType', { value: 'touch' })
      document.body.dispatchEvent(event)
    }

    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { present: false },
    })
    await sleep(1)

    touchPointerDown()
    await wrapper.setProps({ present: true })
    await sleep(1) // let the freshly-registered subscriber arm
    await fireEvent.click(document.body)
    await sleep(1)

    expect(wrapper.emitted('pointerDownOutside')).toBeUndefined()
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    // a later tap outside still dismisses it
    touchPointerDown()
    await fireEvent.click(document.body)
    await sleep(1)

    expect(wrapper.emitted('pointerDownOutside')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.[0][0]).toMatchObject({
      reason: 'outside-press',
      event: wrapper.emitted('pointerDownOutside')?.[0][0],
    })

    wrapper.unmount()
  })

  it('should emit escapeKeyDown and dismiss on Escape once present', async () => {
    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { present: true },
    })
    await nextTick()

    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(wrapper.emitted('escapeKeyDown')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.[0][0]).toMatchObject({
      reason: 'escape-key',
      event: wrapper.emitted('escapeKeyDown')?.[0][0],
    })
  })
})

describe('nested layers inside a shadow root', () => {
  beforeEach(() => {
    resetLayerStack()
    document.body.innerHTML = ''
  })

  function pointerDown(target: EventTarget) {
    // `composed` so the event reaches the shared document listener from inside
    // the shadow root (jsdom has no `PointerEvent`; a plain mouse path is fine).
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }))
  }

  // Regression: layer order used to come from a document-wide
  // `querySelectorAll('[data-dismissable-layer]')`, which does not pierce shadow
  // roots. Two layers inside one shadow root both indexed `-1`, so a pointerdown
  // inside the child layer was treated as outside its parent and dismissed it.
  it('should treat a pointerdown inside the child layer as inside the parent, and dismiss only the top layer on outside', async () => {
    const { shadowRoot, mountTarget, cleanup } = createShadowHost()
    const childOpen = ref(false)
    const onParentDismiss = vi.fn()
    const onChildDismiss = vi.fn()

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          h(DismissableLayerPrimitive, { onDismiss: onParentDismiss }, () => 'Parent'),
          childOpen.value
            ? h(DismissableLayerPrimitive, { disableOutsidePointerEvents: true, onDismiss: onChildDismiss }, () => [
                h('button', { 'data-testid': 'child-button' }, 'Child'),
              ])
            : null,
        ])
      },
    }), { attachTo: mountTarget })
    await sleep(1)
    childOpen.value = true
    // Flush the render first: the child's outside subscriber arms on a macrotask
    // scheduled during setup, which would otherwise be queued *after* a `sleep`
    // started on this line and leave the first pointerdown below unarmed.
    await nextTick()
    await sleep(1) // child registered above the parent; its subscriber is armed

    // Neither layer is reachable through the document.
    expect(document.querySelectorAll('[data-dismissable-layer]')).toHaveLength(0)
    expect(shadowRoot.querySelectorAll('[data-dismissable-layer]')).toHaveLength(2)
    const childButton = shadowRoot.querySelector('[data-testid="child-button"]') as HTMLElement

    pointerDown(childButton)
    await sleep(1)
    expect(onParentDismiss).not.toHaveBeenCalled()
    expect(onChildDismiss).not.toHaveBeenCalled()

    // Outside both: only the top (child) layer dismisses; the child disables
    // outside pointer events, so the parent's are off and it stays put.
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    pointerDown(outside)
    await sleep(1)
    expect(onChildDismiss).toHaveBeenCalledOnce()
    expect(onParentDismiss).not.toHaveBeenCalled()

    wrapper.unmount()
    cleanup()
  })
})

describe('stacked layers Escape routing', () => {
  beforeEach(() => {
    resetLayerStack()
    document.body.innerHTML = ''
  })

  it('routes Escape to the top present layer, then falls through after it dismisses', async () => {
    const bottom = mount(DismissableLayerPrimitive, { attachTo: document.body, props: { present: true } })
    const top = mount(DismissableLayerPrimitive, { attachTo: document.body, props: { present: true } })
    await nextTick()

    await fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(top.emitted('escapeKeyDown')?.length).toBe(1)
    expect(bottom.emitted('escapeKeyDown')).toBeUndefined()

    // Top layer closes → leaves the stack; Escape now targets the lower layer.
    top.unmount()
    await nextTick()

    await fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(bottom.emitted('escapeKeyDown')?.length).toBe(1)

    bottom.unmount()
  })
})

describe('given a DismissableLayer rendered inside an iframe (#2949)', () => {
  function mountInIframe() {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const iframeDocument = iframe.contentDocument!
    const outside = iframeDocument.createElement('button')
    iframeDocument.body.appendChild(outside)
    const container = iframeDocument.createElement('div')
    iframeDocument.body.appendChild(container)

    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: container,
      slots: { default: () => h('button', { id: 'inside' }, 'Inside') },
    })
    onTestFinished(() => {
      wrapper.unmount()
      iframe.remove()
    })
    const inside = iframeDocument.getElementById('inside')!
    return { wrapper, iframeDocument, inside, outside }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should dismiss on pointerdown outside within the iframe', async () => {
    const { wrapper, outside } = mountInIframe()
    await sleep(1)

    await fireEvent.pointerDown(outside)
    await sleep(1)

    expect(wrapper.emitted('pointerDownOutside')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.length).toBe(1)
  })

  it('should not dismiss on pointerdown inside the layer', async () => {
    const { wrapper, inside } = mountInIframe()
    await sleep(1)

    await fireEvent.pointerDown(inside)
    await sleep(1)

    expect(wrapper.emitted('pointerDownOutside')).toBeUndefined()
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  it('should dismiss when focus moves outside within the iframe', async () => {
    const { wrapper, inside, outside } = mountInIframe()
    inside.focus()
    await sleep(1)

    outside.focus()
    await sleep(1)

    expect(wrapper.emitted('focusOutside')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.length).toBe(1)
  })

  it('should dismiss on Escape pressed within the iframe', async () => {
    const { wrapper, iframeDocument } = mountInIframe()
    await nextTick()

    await fireEvent.keyDown(iframeDocument.body, { key: 'Escape' })
    await nextTick()

    expect(wrapper.emitted('escapeKeyDown')?.length).toBe(1)
    expect(wrapper.emitted('dismiss')?.length).toBe(1)
  })
})
