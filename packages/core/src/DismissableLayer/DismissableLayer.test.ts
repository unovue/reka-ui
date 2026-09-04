import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createShadowHost } from '@/shared/test/shadowDom'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'
import { sleep } from '@/test'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
import { resetLayerStack } from './layerStack'
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
})

describe('nested layers with disableOutsidePointerEvents (#2674)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
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

  it('should keep body pointer-events none after a nested layer closes while outer stays open', async () => {
    const { wrapper, innerOpen } = mountNested()
    await sleep(1)

    // Outer (dialog) open -> body locked
    expect(document.body.style.pointerEvents).toBe('none')

    // Open inner (menu) layer
    innerOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Close inner layer while outer is still open
    innerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should keep body pointer-events none when a nested layer toggles disableOutsidePointerEvents to false while mounted', async () => {
    const { wrapper, innerOpen, innerDisable } = mountNested()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Open inner layer (still disabling outside pointer events)
    innerOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Toggle the prop off without unmounting (a modal Menu closing)
    innerDisable.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Now unmount the inner layer entirely; outer still open
    innerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should restore and re-lock body pointer-events as the only layer toggles disableOutsidePointerEvents', async () => {
    const disable = ref(true)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { disableOutsidePointerEvents: disable.value }, () => 'Only')
      },
    }), { attachTo: document.body })

    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Toggle off -> body restored, and the layer must leave the tracking set
    disable.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    // Toggle back on -> body must lock again (would stay '' if a stale entry
    // remained in the set, making `size === 0` false on re-add)
    disable.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should restore body pointer-events after the last layer closes', async () => {
    const { wrapper, outerOpen } = mountNested()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    outerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

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

  // The mirrored direction of the #2674 tests above: the OLDER disabling
  // layer leaves the stack while a NEWER sibling is still present. This is the
  // layer-registry half of the #2784 scenario (a closing animated Popover
  // whose layer unmounts after a Dialog has already opened).
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

  it('should keep body pointer-events none after the older layer unmounts while a newer one is open', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountSiblings()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Dialog mounts while the popover is still animating out (still mounted)
    dialogOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Popover's exit animation ends -> its layer unmounts; dialog still open
    popoverOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Closing the dialog restores the body
    dialogOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })

  it('should keep body pointer-events none when the handoff happens in the same tick', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountSiblings()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // "Pick" action: close the popover and open the dialog in the same tick
    popoverOpen.value = false
    dialogOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    dialogOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })
})

describe('scroll-lock handoff to a modal layer without its own scroll lock (#2784)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    resetLayerStack()
  })

  // Mimics `PopoverContentModal`: a modal layer that also holds a body scroll
  // lock, released when the content unmounts (for an animated popover that is
  // the end of the exit animation).
  const ModalLayerWithScrollLock = defineComponent({
    setup() {
      useBodyScrollLock(true)
      return () => h(DismissableLayerPrimitive, { disableOutsidePointerEvents: true }, () => 'popover')
    },
  })

  // Mimics an overlay-less modal `DialogContent`: disables outside pointer
  // events but registers no scroll lock (that lives on `DialogOverlayImpl`).
  function mountHandoff() {
    const popoverOpen = ref(false)
    const dialogOpen = ref(false)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          popoverOpen.value ? h(ModalLayerWithScrollLock) : null,
          dialogOpen.value
            ? h(DismissableLayerPrimitive, { disableOutsidePointerEvents: true }, () => 'dialog')
            : null,
        ])
      },
    }), { attachTo: document.body })

    return { wrapper, popoverOpen, dialogOpen }
  }

  it('should keep body pointer-events none when the scroll-lock holder unmounts while a modal layer remains open', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountHandoff()

    // Modal popover opens: dismissable layer + scroll lock
    popoverOpen.value = true
    await nextTick() // scroll lock applies its own pointer-events on next tick
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Modal dialog (no overlay -> no scroll lock) opens while the popover
    // is still mounted (e.g. animating out)
    dialogOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Popover unmounts: the last scroll lock releases and must not clear the
    // body pointer-events still owned by the dialog's dismissable layer
    popoverOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Closing the dialog restores the body
    dialogOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })

  it('should keep body pointer-events none when a scroll-locking layer opens and closes over a modal layer', async () => {
    const { wrapper, popoverOpen, dialogOpen } = mountHandoff()

    // Overlay-less modal dialog open first
    dialogOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // A modal popover (scroll-lock holder) opens on top, then closes
    popoverOpen.value = true
    await nextTick()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    popoverOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    dialogOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
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
        const outsideEl = document.getElementById('outside') as HTMLElement
        outsideEl.focus()
        await sleep(1)
        expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
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
  })

  // Regression: with `unmountOnHide: false` the layer stays mounted while
  // `disableOutsidePointerEvents` toggles `true` -> `false`. The body pointer-events
  // must be restored even though the component is never unmounted.
  it('should restore body pointer-events when toggled off while staying mounted', async () => {
    const wrapper = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')

    await wrapper.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('')
  })

  it('should keep body locked while another layer still disables pointer events', async () => {
    const first = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    const second = mount(DismissableLayerPrimitive, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')

    // Close the second (topmost) layer without unmounting it.
    await second.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    // First layer is still open, so the body stays locked.
    expect(document.body.style.pointerEvents).toBe('none')

    await first.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('')
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
