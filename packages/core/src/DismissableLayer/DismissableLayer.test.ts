import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { sleep } from '@/test'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
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

describe('given DismissableLayers with escapeKeyBehavior', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function mountStacked(escapeKeyBehavior: 'topmost' | 'focus') {
    const wrapper = mount(defineComponent({
      setup() {
        // `focusOutside` is prevented so that moving focus between layers
        // does not itself dismiss a layer.
        return () => h('div', [
          h(DismissableLayerPrimitive, {
            escapeKeyBehavior,
            onFocusOutside: (event: Event) => event.preventDefault(),
          }, () => h('button', { id: 'lower-btn' }, 'lower')),
          h(DismissableLayerPrimitive, {
            escapeKeyBehavior,
            onFocusOutside: (event: Event) => event.preventDefault(),
          }, () => h('button', { id: 'upper-btn' }, 'upper')),
        ])
      },
    }), { attachTo: document.body })

    const [lower, upper] = wrapper.findAllComponents(DismissableLayerPrimitive)
    return { wrapper, lower, upper }
  }

  it('should route Escape to the topmost layer regardless of focus by default', async () => {
    const { wrapper, lower, upper } = mountStacked('topmost')
    await nextTick()

    // Focus is inside the LOWER layer, but 'topmost' ignores focus.
    document.getElementById('lower-btn')!.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(upper.emitted('escapeKeyDown')?.length).toBe(1)
    expect(lower.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })

  it('should route Escape to the focused layer when behavior is "focus"', async () => {
    const { wrapper, lower, upper } = mountStacked('focus')
    await nextTick()

    // Focus is inside the LOWER layer, which is not the topmost one.
    document.getElementById('lower-btn')!.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(lower.emitted('escapeKeyDown')?.length).toBe(1)
    expect(upper.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })

  it('should not route Escape to any layer when focus is outside every layer', async () => {
    const { wrapper, lower, upper } = mountStacked('focus')
    await nextTick()

    document.body.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(lower.emitted('escapeKeyDown')).toBeUndefined()
    expect(upper.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })

  it('should route Escape to the outer layer when focus is outside the nested one', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus' }, () => [
          h('button', { id: 'outer-btn' }, 'outer'),
          h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus' }, () => h('button', { id: 'inner-btn' }, 'inner')),
        ])
      },
    }), { attachTo: document.body })

    const [outer, inner] = wrapper.findAllComponents(DismissableLayerPrimitive)
    await nextTick()

    document.getElementById('outer-btn')!.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(outer.emitted('escapeKeyDown')?.length).toBe(1)
    expect(inner.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })

  it('should route Escape only to the innermost layer when nested and behavior is "focus"', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus' }, () => [
          h('button', { id: 'outer-btn' }, 'outer'),
          h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus' }, () => h('button', { id: 'inner-btn' }, 'inner')),
        ])
      },
    }), { attachTo: document.body })

    const [outer, inner] = wrapper.findAllComponents(DismissableLayerPrimitive)
    await nextTick()

    // Focus is inside the INNER layer, which is also inside the outer one.
    document.getElementById('inner-btn')!.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(inner.emitted('escapeKeyDown')?.length).toBe(1)
    expect(outer.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })

  it('should route Escape to the innermost layer after an ancestor re-registers', async () => {
    const outerPresent = ref(true)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus', present: outerPresent.value }, () => [
          h('button', { id: 'outer-btn' }, 'outer'),
          h(DismissableLayerPrimitive, { escapeKeyBehavior: 'focus' }, () => h('button', { id: 'inner-btn' }, 'inner')),
        ])
      },
    }), { attachTo: document.body })
    const [outer, inner] = wrapper.findAllComponents(DismissableLayerPrimitive)
    await nextTick()

    // outer leaves and rejoins the stack, moving it to the end of the set
    outerPresent.value = false
    await nextTick()
    outerPresent.value = true
    await nextTick()

    document.getElementById('inner-btn')!.focus()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await nextTick()

    expect(inner.emitted('escapeKeyDown')?.length).toBe(1)
    expect(outer.emitted('escapeKeyDown')).toBeUndefined()

    wrapper.unmount()
  })
})
