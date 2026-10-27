import type { SliderChangeReason } from './useSlider'
import type { ChangeEventDetails } from '@/shared'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, mergeProps, nextTick, ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'
import * as Reka from '../index'
import { useSlider } from './useSlider'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.setPointerCapture = vi.fn()

function key(name: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent('keydown', { key: name, cancelable: true, ...init })
}

describe('useSlider — model', () => {
  it('defaults to [0] in 0..100, uncontrolled', () => {
    const s = useSlider()
    expect(s.modelValue.value).toEqual([0])
    expect(s.isControlled.value).toBe(false)
    expect(s.lastChangeDetails.value.reason).toBe('none')
  })

  it('keyboard steps report reason "keyboard" with the native event', () => {
    const onUpdate = vi.fn()
    const s = useSlider({ defaultValue: [50], onUpdate })
    const event = key('ArrowRight')
    s.root.props.value.onKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(s.modelValue.value).toEqual([51])
    expect(onUpdate).toHaveBeenCalledWith([51], expect.objectContaining({ reason: 'keyboard', event }))
    s.root.props.value.onKeydown(key('PageDown'))
    expect(s.modelValue.value).toEqual([41])
    s.root.props.value.onKeydown(key('ArrowUp', { shiftKey: true }))
    expect(s.modelValue.value).toEqual([51])
    s.root.props.value.onKeydown(key('Home'))
    expect(s.modelValue.value).toEqual([0])
    s.root.props.value.onKeydown(key('End'))
    expect(s.modelValue.value).toEqual([100])
    expect(onUpdate.mock.calls.map(call => call[1].reason)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard', 'keyboard'])
  })

  it('reverses the step keys when inverted or right-to-left', () => {
    const inverted = useSlider({ defaultValue: [50], inverted: true })
    inverted.root.props.value.onKeydown(key('ArrowRight'))
    expect(inverted.modelValue.value).toEqual([49])
    const rtl = useSlider({ defaultValue: [50], dir: 'rtl' })
    rtl.root.props.value.onKeydown(key('ArrowRight'))
    expect(rtl.modelValue.value).toEqual([49])
    const vertical = useSlider({ defaultValue: [50], orientation: 'vertical', inverted: true })
    vertical.root.props.value.onKeydown(key('ArrowUp'))
    expect(vertical.modelValue.value).toEqual([49])
  })

  it('pointer slides report "track-press" then "drag"; endSlide commits a changed drag', () => {
    const emit = vi.fn()
    const s = useSlider({ defaultValue: [20, 80], emit })
    s.root.props.value.onPointerdown()
    s.startSlide(70, new PointerEvent('pointerdown'))
    expect(s.modelValue.value).toEqual([20, 70])
    s.moveSlide(60, new PointerEvent('pointermove'))
    expect(s.modelValue.value).toEqual([20, 60])
    s.endSlide()
    const updates = emit.mock.calls.filter(call => call[0] === 'update:modelValue')
    expect(updates.map(call => call[2].reason)).toEqual(['track-press', 'drag'])
    expect(emit.mock.calls.at(-1)).toEqual(['valueCommit', [20, 60]])
  })

  it('a bare updateValues() reports "imperative-action" and snaps to the step', () => {
    const onUpdate = vi.fn()
    const s = useSlider({ defaultValue: [0], step: 5, onUpdate })
    expect(s.updateValues(12, 0)).toBe(true)
    expect(s.modelValue.value).toEqual([10])
    expect(onUpdate.mock.calls[0][1].reason).toBe('imperative-action')
  })

  it('emits nothing when the value does not change', () => {
    const emit = vi.fn()
    const s = useSlider({ defaultValue: [100], emit })
    s.root.props.value.onKeydown(key('End'))
    s.root.props.value.onKeydown(key('ArrowRight'))
    expect(emit).not.toHaveBeenCalled()
    expect(s.updateValues(100, 0)).toBe(false)
  })

  it('a keyboard step emits beforeUpdate, then valueCommit, then update (v2 order)', () => {
    const emit = vi.fn()
    const s = useSlider({ defaultValue: [50], emit })
    s.root.props.value.onKeydown(key('ArrowLeft'))
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue', 'valueCommit', 'update:modelValue'])
    expect(emit.mock.calls[1]).toEqual(['valueCommit', [49]])
  })

  it('cancel() in beforeUpdate vetoes the change, the valueCommit and the focus move', () => {
    const emit = vi.fn((event: string, _value: unknown, details?: ChangeEventDetails<SliderChangeReason>) => {
      if (event === 'beforeUpdate:modelValue')
        details!.cancel()
    })
    const onValueCommit = vi.fn()
    const s = useSlider({ defaultValue: [50], emit, onValueCommit })
    const thumb = document.createElement('span')
    thumb.tabIndex = 0
    document.body.append(thumb)
    s.thumbElements.value.push(thumb)
    s.root.props.value.onKeydown(key('ArrowRight'))
    expect(s.modelValue.value).toEqual([50])
    expect(s.lastChangeDetails.value).toMatchObject({ reason: 'keyboard', isCanceled: true })
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue'])
    expect(onValueCommit).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(thumb)
    thumb.remove()
  })

  it('a cancelled keyboard step that would cross another thumb keeps driving the original thumb', () => {
    let veto = true
    const s = useSlider({
      defaultValue: [50, 51],
      onBeforeUpdate: (_value, details) => {
        if (veto)
          details.cancel()
      },
    })
    expect(s.valueIndexToChangeRef.value).toBe(0)
    // Shift+ArrowRight on thumb 0 would land on 60, past thumb 1 → cancelled.
    s.root.props.value.onKeydown(key('ArrowRight', { shiftKey: true }))
    expect(s.modelValue.value).toEqual([50, 51])
    expect(s.valueIndexToChangeRef.value).toBe(0)
    veto = false
    s.root.props.value.onKeydown(key('ArrowLeft'))
    expect(s.modelValue.value).toEqual([49, 51])
  })

  it('a cancelled drag that would cross another thumb keeps dragging the original thumb', () => {
    let veto = false
    const s = useSlider({
      defaultValue: [20, 80],
      onBeforeUpdate: (_value, details) => {
        if (veto)
          details.cancel()
      },
    })
    s.startSlide(10) // closest thumb is 0
    expect(s.modelValue.value).toEqual([10, 80])
    veto = true
    s.moveSlide(90) // would cross thumb 1 → cancelled
    expect(s.modelValue.value).toEqual([10, 80])
    expect(s.valueIndexToChangeRef.value).toBe(0)
    veto = false
    s.moveSlide(30)
    expect(s.modelValue.value).toEqual([30, 80])
  })

  it('onBeforeUpdate can cancel too', () => {
    const onUpdate = vi.fn()
    const s = useSlider({ defaultValue: [50], onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    s.startSlide(10)
    expect(s.modelValue.value).toEqual([50])
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('controlled with onUpdate does not write; the parent does', () => {
    const model = ref([30])
    const onUpdate = vi.fn()
    const onValueCommit = vi.fn()
    const s = useSlider({ modelValue: model, onUpdate, onValueCommit })
    expect(s.isControlled.value).toBe(true)
    s.root.props.value.onKeydown(key('ArrowRight'))
    expect(model.value).toEqual([30])
    expect(s.modelValue.value).toEqual([30])
    expect(onUpdate).toHaveBeenCalledWith([31], expect.objectContaining({ reason: 'keyboard' }))
    // valueCommit fires from the update phase, before `onUpdate`.
    expect(onValueCommit.mock.invocationCallOrder[0]).toBeLessThan(onUpdate.mock.invocationCallOrder[0])
    model.value = [31]
    expect(s.modelValue.value).toEqual([31])
  })

  it('a writable ref alone is ref-owned and written back', () => {
    const model = ref<number[] | undefined>([30])
    const onValueCommit = vi.fn()
    const s = useSlider({ modelValue: model, onValueCommit })
    s.root.props.value.onKeydown(key('ArrowRight'))
    expect(model.value).toEqual([31])
    expect(onValueCommit).toHaveBeenCalledWith([31])
  })

  it('does nothing while disabled but still prevents the key default', () => {
    const emit = vi.fn()
    const s = useSlider({ defaultValue: [50], disabled: true, emit })
    const event = key('ArrowRight')
    s.root.props.value.onKeydown(event)
    s.startSlide(10)
    expect(event.defaultPrevented).toBe(true)
    expect(s.modelValue.value).toEqual([50])
    expect(emit).not.toHaveBeenCalled()
  })
})

describe('useSlider — part surfaces', () => {
  it('root/track/range carry data-orientation and data-disabled from state', () => {
    const s = useSlider({ defaultValue: [20, 80], disabled: true })
    expect(s.root.attrs.value).toMatchObject({ 'aria-disabled': true, 'data-disabled': '', 'data-orientation': 'horizontal' })
    expect(Object.keys(s.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(s.track.attrs.value).toEqual({ 'data-disabled': '', 'data-orientation': 'horizontal' })
    expect(s.range.attrs.value.style).toEqual({ left: '20%', right: '20%' })
  })

  it('thumb surfaces carry aria values, a generated label and the position', () => {
    const s = useSlider({ defaultValue: [20, 80], orientation: 'vertical' })
    const min = s.getThumbSurface({ index: 0 })
    const max = s.getThumbSurface({ index: 1, ariaLabel: 'Upper' })
    expect(min.attrs.value).toMatchObject({
      'role': 'slider',
      'tabindex': 0,
      'aria-label': 'Minimum',
      'aria-valuenow': 20,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-orientation': 'vertical',
      'data-orientation': 'vertical',
    })
    expect(min.attrs.value.style).toMatchObject({ bottom: 'calc(20% + 0px)' })
    expect(max.props.value['aria-label']).toBe('Upper')
    max.props.value.onFocus()
    expect(s.valueIndexToChangeRef.value).toBe(1)
  })
})

describe('useSlider — standalone render', () => {
  const Standalone = defineComponent({
    props: { onUpdate: Function, onBeforeUpdate: Function },
    setup(props) {
      const s = useSlider({
        defaultValue: [40],
        onUpdate: props.onUpdate as any,
        onBeforeUpdate: props.onBeforeUpdate as any,
      })
      const thumb = s.getThumbSurface({ index: 0, ariaLabel: 'Volume' })
      return () => h('span', mergeProps(s.root.attrs.value, { 'data-testid': 'root' }), [
        h('span', s.track.attrs.value, [h('span', s.range.attrs.value)]),
        h('span', mergeProps(thumb.attrs.value, {
          ref: (el: any) => {
            if (el && !s.thumbElements.value.includes(el))
              s.thumbElements.value.push(el)
          },
        })),
      ])
    },
  })

  it('renders an accessible slider and steps with the keyboard', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(Standalone, { props: { onUpdate }, attachTo: document.body })
    expect(await axe(wrapper.element)).toHaveNoViolations()
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-valuenow')).toBe('40')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(thumb.attributes('aria-valuenow')).toBe('41')
    expect(onUpdate.mock.calls[0][1].reason).toBe('keyboard')
    expect(document.activeElement).toBe(thumb.element)
    wrapper.unmount()
  })

  it('a cancelled standalone step leaves the value alone', async () => {
    const wrapper = mount(Standalone, { props: { onBeforeUpdate: (_: unknown, details: ChangeEventDetails) => details.cancel() } })
    const thumb = wrapper.find('[role="slider"]')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(thumb.attributes('aria-valuenow')).toBe('40')
  })
})

describe('sliderRoot — change details', () => {
  function render(props: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup() {
        return () => h(SliderRoot, { defaultValue: [50], ...props }, () => [
          h(SliderTrack, () => h(SliderRange)),
          h(SliderThumb),
        ])
      },
    }), { attachTo: document.body })
  }

  it('emits update:modelValue(value, details) with the reason', async () => {
    const onUpdate = vi.fn()
    const wrapper = render({ 'onUpdate:modelValue': onUpdate })
    await nextTick()
    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(onUpdate).toHaveBeenCalledWith([51], expect.objectContaining({ reason: 'keyboard' }))
    const impl = wrapper.find('[data-slider-impl]')
    await fireEvent.pointerDown(impl.element, { clientX: 10, pointerId: 1 })
    await fireEvent.pointerMove(impl.element, { clientX: 50, pointerId: 1 })
    expect(onUpdate.mock.calls.slice(1).map(call => call[1].reason)).toContain('track-press')
    wrapper.unmount()
  })

  it('beforeUpdate:modelValue cancels the step and its valueCommit', async () => {
    const onUpdate = vi.fn()
    const onValueCommit = vi.fn()
    const wrapper = render({
      'onBeforeUpdate:modelValue': (_: number[], details: ChangeEventDetails) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
      onValueCommit,
    })
    await nextTick()
    const thumb = wrapper.find('[role="slider"]')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(thumb.attributes('aria-valuenow')).toBe('50')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onValueCommit).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('a consumer style overrides the thumb-transform variable; component aria-disabled still wins', async () => {
    const wrapper = render({ 'style': '--reka-slider-thumb-transform: rotate(1deg); color: red', 'aria-disabled': 'nope' })
    await nextTick()
    const root = wrapper.find('[data-slider-impl]').element as HTMLElement
    expect(root.style.getPropertyValue('--reka-slider-thumb-transform')).toBe('rotate(1deg)')
    expect(root.style.color).toBe('red')
    expect(root.getAttribute('aria-disabled')).toBe('false')
    wrapper.unmount()
  })

  it('a controlled root renders the parent value until the parent accepts the update', async () => {
    const onUpdate = vi.fn()
    const wrapper = render({ 'modelValue': [10], 'onUpdate:modelValue': onUpdate })
    await nextTick()
    const thumb = wrapper.find('[role="slider"]')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(onUpdate.mock.calls[0][0]).toEqual([11])
    expect(thumb.attributes('aria-valuenow')).toBe('10')
    wrapper.unmount()
  })
})

describe('useSlider — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useSlider).toBe('function')
  })
})
