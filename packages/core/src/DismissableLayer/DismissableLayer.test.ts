import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { sleep } from '@/test'
import { DismissableLayerBranch, DismissableLayer as DismissableLayerPrimitive } from '.'
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

describe('shadow DOM', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function createLightContainer(parent: Element = document.body): HTMLElement {
    const el = document.createElement('div')
    parent.appendChild(el)
    return el
  }

  function createShadowHost(parent: Element = document.body, mode: 'open' | 'closed' = 'open') {
    const host = document.createElement('div')
    parent.appendChild(host)
    const root = host.attachShadow({ mode })
    const mountPoint = document.createElement('div')
    root.appendChild(mountPoint)
    return { host, root, mountPoint }
  }

  function mountLayerWithButton(container: Element, testId: string) {
    return mount(DismissableLayerPrimitive, {
      attachTo: container,
      slots: { default: `<button data-testid="${testId}">${testId}</button>` },
    })
  }

  // Every row is a real, physically-constructed DOM (no mocking `getRootNode`/
  // `composedPath`) — the ancestor ("outer", e.g. a Dialog) and the nested
  // layer ("inner", e.g. a Popover/Menu opened from inside it) each get their
  // own container per the topology, mirroring how the inner layer's content
  // would actually be teleported relative to the outer one.
  const topologies: { name: string, build: () => { outerContainer: Element, innerContainer: Element } }[] = [
    {
      name: 'light DOM ancestor, light DOM nested (regression baseline)',
      build: () => ({ outerContainer: createLightContainer(), innerContainer: createLightContainer() }),
    },
    {
      name: 'same shadow root (the originally reported Popover-in-Dialog bug)',
      build: () => {
        const { mountPoint } = createShadowHost()
        return { outerContainer: mountPoint, innerContainer: mountPoint }
      },
    },
    {
      name: 'ancestor in light DOM, nested layer teleported into a shadow root',
      build: () => ({ outerContainer: createLightContainer(), innerContainer: createShadowHost().mountPoint }),
    },
    {
      name: 'ancestor in a shadow root, nested layer teleported out to light DOM',
      build: () => ({ outerContainer: createShadowHost().mountPoint, innerContainer: createLightContainer() }),
    },
    {
      name: 'two levels of shadow nesting (inner layer in a shadow root nested inside the outer\'s)',
      build: () => {
        const { mountPoint: rootA } = createShadowHost()
        const { mountPoint: rootB } = createShadowHost(rootA)
        return { outerContainer: rootA, innerContainer: rootB }
      },
    },
  ]

  for (const topology of topologies) {
    describe(topology.name, () => {
      it('pointerdown inside the nested layer must not dismiss the ancestor layer', async () => {
        const { outerContainer, innerContainer } = topology.build()
        const outer = mountLayerWithButton(outerContainer, 'outer')
        const inner = mountLayerWithButton(innerContainer, 'inner')
        // Outside-pointerdown listeners register after a `setTimeout(0)`.
        await sleep(1)

        const innerButton = innerContainer.querySelector('[data-testid="inner"]') as HTMLElement
        await fireEvent.pointerDown(innerButton)
        await nextTick()

        expect(outer.emitted('pointerDownOutside')).toBeUndefined()
        expect(outer.emitted('dismiss')).toBeUndefined()

        outer.unmount()
        inner.unmount()
      })

      it('a genuinely outside pointerdown still dismisses the ancestor layer', async () => {
        const { outerContainer, innerContainer } = topology.build()
        const outer = mountLayerWithButton(outerContainer, 'outer')
        const inner = mountLayerWithButton(innerContainer, 'inner')
        await sleep(1)

        const trulyOutside = createLightContainer()
        await fireEvent.pointerDown(trulyOutside)
        await nextTick()

        expect(outer.emitted('pointerDownOutside')?.length).toBe(1)
        expect(outer.emitted('dismiss')?.length).toBe(1)

        outer.unmount()
        inner.unmount()
      })

      it('focusing inside the nested layer must not dismiss the ancestor layer', async () => {
        const { outerContainer, innerContainer } = topology.build()
        const outer = mountLayerWithButton(outerContainer, 'outer')
        const inner = mountLayerWithButton(innerContainer, 'inner')
        await sleep(1)

        const innerButton = innerContainer.querySelector('[data-testid="inner"]') as HTMLElement
        innerButton.focus()
        await sleep(1)

        expect(outer.emitted('focusOutside')).toBeUndefined()
        expect(outer.emitted('dismiss')).toBeUndefined()

        outer.unmount()
        inner.unmount()
      })

      it('escape while interacting with the nested layer dismisses only that layer, not the ancestor', async () => {
        const { outerContainer, innerContainer } = topology.build()
        const outer = mountLayerWithButton(outerContainer, 'outer')
        const inner = mountLayerWithButton(innerContainer, 'inner')
        await nextTick()

        const innerButton = innerContainer.querySelector('[data-testid="inner"]') as HTMLElement
        await fireEvent.keyDown(innerButton, { key: 'Escape' })
        await nextTick()

        expect(inner.emitted('dismiss')?.length).toBe(1)
        expect(outer.emitted('dismiss')).toBeUndefined()

        outer.unmount()
        inner.unmount()
      })
    })
  }

  it('two unrelated shadow roots do not interfere with each other on Escape', async () => {
    const { mountPoint: rootA } = createShadowHost()
    const { mountPoint: rootB } = createShadowHost()

    // Mount B after A, so under a flat/global "topmost wins" rule (the
    // pre-fix behavior) only B — unrelated to A — would ever react to Escape.
    const layerA = mountLayerWithButton(rootA, 'layer-a')
    const layerB = mountLayerWithButton(rootB, 'layer-b')
    await nextTick()

    const buttonA = rootA.querySelector('[data-testid="layer-a"]') as HTMLElement
    await fireEvent.keyDown(buttonA, { key: 'Escape' })
    await nextTick()

    expect(layerA.emitted('dismiss')?.length).toBe(1)
    expect(layerB.emitted('dismiss')).toBeUndefined()

    layerA.unmount()
    layerB.unmount()
  })

  it('documents the accepted limitation: a closed shadow root cannot be seen through', async () => {
    const { mountPoint } = createShadowHost(document.body, 'closed')
    const outer = mountLayerWithButton(mountPoint, 'outer')
    const inner = mountLayerWithButton(mountPoint, 'inner')
    await sleep(1)

    const innerButton = mountPoint.querySelector('[data-testid="inner"]') as HTMLElement
    await fireEvent.pointerDown(innerButton)
    await nextTick()

    // `composedPath()` stops at a closed shadow root's host, so the real
    // target can't be recovered here — this is a known, accepted gap, not a
    // silent regression. If this ever starts passing, tighten the assertion.
    expect(outer.emitted('dismiss')?.length).toBe(1)

    outer.unmount()
    inner.unmount()
  })

  it('dismissableLayerBranch exempts an interaction even when the branch and the layer are in different roots', async () => {
    const outerContainer = createLightContainer()
    const outer = mountLayerWithButton(outerContainer, 'outer')
    await sleep(1)

    const { mountPoint: branchRoot } = createShadowHost()
    const branch = mount(DismissableLayerBranch, {
      attachTo: branchRoot,
      slots: { default: '<button data-testid="branch-btn">Branch</button>' },
    })

    const branchButton = branchRoot.querySelector('[data-testid="branch-btn"]') as HTMLElement
    await fireEvent.pointerDown(branchButton)
    await nextTick()

    expect(outer.emitted('pointerDownOutside')).toBeUndefined()
    expect(outer.emitted('dismiss')).toBeUndefined()

    outer.unmount()
    branch.unmount()
  })

  it('a modal (disableOutsidePointerEvents) nested layer stays interactive while the shadow-rooted ancestor is inert', async () => {
    const { mountPoint } = createShadowHost()
    const outer = mount(DismissableLayerPrimitive, {
      attachTo: mountPoint,
      props: { disableOutsidePointerEvents: true },
      slots: { default: '<div data-testid="outer">Outer</div>' },
    })
    await nextTick()
    const inner = mount(DismissableLayerPrimitive, {
      attachTo: mountPoint,
      props: { disableOutsidePointerEvents: true },
      slots: { default: '<div data-testid="inner">Inner</div>' },
    })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')
    // The topmost (inner) modal layer must remain interactive itself.
    expect((inner.element as HTMLElement).style.pointerEvents).not.toBe('none')

    inner.unmount()
    outer.unmount()
    await nextTick()
    expect(document.body.style.pointerEvents).toBe('')
  })
})
