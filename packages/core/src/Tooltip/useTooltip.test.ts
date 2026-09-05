import { fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import * as Reka from '../index'
import { useTooltip } from './useTooltip'

function dataAttrKeys(props: Record<string, any>) {
  return Object.keys(props).filter(k => k.startsWith('data-'))
}

// jsdom has no `PointerEvent`; the handlers only read `pointerType`.
function pointerEvent(type: string, pointerType = 'mouse'): PointerEvent {
  return Object.assign(new MouseEvent(type), { pointerType }) as PointerEvent
}

describe('useTooltip — state', () => {
  it('defaults to closed, not delayed, hoverable, enabled and uncontrolled', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(t.open.value).toBe(false)
    expect(t.isDelayed.value).toBe(false)
    expect(t.isControlled.value).toBe(false)
    expect(t.lastChangeDetails.value.reason).toBe('none')
    expect(t.context.disableHoverableContent.value).toBe(false)
    expect(t.context.disableClosingTrigger.value).toBe(false)
    expect(t.context.disabled.value).toBe(false)
    expect(t.context.ignoreNonKeyboardFocus.value).toBe(false)
    expect(t.context.isPointerInTransit.value).toBe(false)
  })

  it('honours defaultOpen and reactive option getters', () => {
    const disabled = ref(false)
    const t = useTooltip({ defaultOpen: true, disabled, disableClosingTrigger: () => true, baseId: 'x' })
    expect(t.open.value).toBe(true)
    expect(t.context.disabled.value).toBe(false)
    expect(t.context.disableClosingTrigger.value).toBe(true)
    disabled.value = true
    expect(t.context.disabled.value).toBe(true)
  })

  it('onOpen / onClose drive the model and report imperative-action by default', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(t.onOpen()).toBe(true)
    expect(t.open.value).toBe(true)
    expect(t.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(t.onOpen()).toBe(false)
    expect(t.onClose()).toBe(true)
    expect(t.open.value).toBe(false)
    expect(t.onClose()).toBe(false)
  })

  it('ref-owned mode writes through the passed ref', () => {
    const open = ref(false)
    const t = useTooltip({ open, baseId: 'x' })
    expect(t.isControlled.value).toBe(true)
    t.onOpen('trigger-focus')
    expect(open.value).toBe(true)
    expect(t.open.value).toBe(true)
    t.onClose('trigger-blur')
    expect(open.value).toBe(false)
  })

  it('controlled getter + emit: emits beforeUpdate:open then update:open with the same details and does not write locally', () => {
    const emit = vi.fn()
    const t = useTooltip({ open: () => false, emit, baseId: 'x' })
    expect(t.isControlled.value).toBe(true)
    const event = new FocusEvent('focus')
    t.trigger.props.value.onFocus(event)
    expect(t.open.value).toBe(false)
    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:open', true, expect.objectContaining({ reason: 'trigger-focus', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:open', true, expect.objectContaining({ reason: 'trigger-focus', event }))
    expect(emit.mock.calls[0][2]).toBe(emit.mock.calls[1][2])
  })

  it('cancel() in onBeforeUpdate vetoes the change and skips onUpdate', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ defaultOpen: true, baseId: 'x', onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    t.trigger.props.value.onBlur(new FocusEvent('blur'))
    expect(t.open.value).toBe(true)
    expect(t.lastChangeDetails.value).toMatchObject({ reason: 'trigger-blur', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(t.trigger.attrs.value['data-state']).toBe('open')
  })
})

describe('useTooltip — ids', () => {
  it('derives the content id from baseId; the label carries it and the open trigger points at it', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(t.context.contentId).toBe('x-content')
    expect(t.label.props.value).toEqual({ id: 'x-content', role: 'tooltip' })
    expect(t.trigger.props.value['aria-describedby']).toBeUndefined()
    t.onOpen()
    expect(t.trigger.props.value['aria-describedby']).toBe('x-content')
  })

  it('two standalone calls without a baseId get different ids', () => {
    const a = useTooltip()
    const b = useTooltip()
    expect(a.context.contentId).toMatch(/^reka-tooltip-\d+-content$/)
    expect(b.context.contentId).toMatch(/^reka-tooltip-\d+-content$/)
    expect(a.context.contentId).not.toBe(b.context.contentId)
  })
})

describe('useTooltip — delayed open', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('onTriggerEnter opens after delayDuration with reason trigger-hover and the arming event, flagged data-delayed', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', delayDuration: 500, onUpdate })
    const event = pointerEvent('pointermove')
    t.onTriggerEnter(event)
    expect(t.open.value).toBe(false)
    expect(t.trigger.attrs.value).toMatchObject({ 'data-state': 'closed' })
    expect(t.trigger.attrs.value['data-delayed']).toBeUndefined()

    vi.advanceTimersByTime(499)
    expect(t.open.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(t.open.value).toBe(true)
    expect(t.isDelayed.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-hover', event, isCanceled: false }))
    // `data-delayed` is the empty-string boolean attribute while delayed (#2823).
    expect(t.trigger.state.value).toEqual({ state: 'open', delayed: true })
    expect(t.trigger.attrs.value).toMatchObject({ 'data-state': 'open', 'data-delayed': '' })
    expect(t.content.state.value).toEqual({ state: 'open', delayed: true })
    expect(t.content.attrs.value).toEqual({ 'data-state': 'open', 'data-delayed': '' })
  })

  it('defaults the delay to 700ms and reads a reactive delayDuration getter', () => {
    const t = useTooltip({ baseId: 'x' })
    t.onTriggerEnter()
    vi.advanceTimersByTime(699)
    expect(t.open.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(t.open.value).toBe(true)

    const delay = ref(100)
    const u = useTooltip({ baseId: 'y', delayDuration: delay })
    delay.value = 50
    u.onTriggerEnter()
    vi.advanceTimersByTime(50)
    expect(u.open.value).toBe(true)
  })

  it('rolls the delayed flag back when the delayed open is cancelled', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    t.onTriggerEnter(pointerEvent('pointermove'))
    vi.advanceTimersByTime(700)
    expect(t.open.value).toBe(false)
    expect(t.isDelayed.value).toBe(false)
    expect(t.lastChangeDetails.value).toMatchObject({ reason: 'trigger-hover', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(t.trigger.attrs.value['data-delayed']).toBeUndefined()
    expect(t.content.attrs.value).toEqual({ 'data-state': 'closed' })
  })

  it('opens instantly, without data-delayed, when isOpenDelayed is false', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', isOpenDelayed: false, onUpdate })
    const event = pointerEvent('pointermove')
    t.onTriggerEnter(event)
    expect(t.open.value).toBe(true)
    expect(t.isDelayed.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-hover', event }))
    expect(t.trigger.attrs.value).toEqual(expect.objectContaining({ 'data-state': 'open' }))
    expect(t.trigger.attrs.value['data-delayed']).toBeUndefined()
  })

  it('onOpen cancels a pending delayed open and is never flagged delayed', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', onUpdate })
    t.onTriggerEnter()
    expect(t.onOpen('trigger-focus')).toBe(true)
    expect(t.isDelayed.value).toBe(false)
    vi.advanceTimersByTime(700)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-focus' }))
  })

  it('onTriggerLeave only cancels the pending open while content is hoverable', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', onUpdate })
    t.onTriggerEnter()
    t.onTriggerLeave(pointerEvent('pointerleave'))
    vi.advanceTimersByTime(700)
    expect(t.open.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()

    // An open tooltip stays open: the pointer may travel onto the content.
    t.onOpen()
    t.onTriggerLeave(pointerEvent('pointerleave'))
    expect(t.open.value).toBe(true)
  })

  it('onTriggerLeave closes with reason trigger-leave when hoverable content is disabled', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', disableHoverableContent: true, onUpdate })
    t.onTriggerEnter()
    vi.advanceTimersByTime(700)
    expect(t.open.value).toBe(true)
    const event = pointerEvent('pointerleave')
    t.onTriggerLeave(event)
    expect(t.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-leave', event }))
  })

  it('forgets a delayed open once closed: a later ref-driven open carries no data-delayed', async () => {
    const open = ref(false)
    const t = useTooltip({ open, baseId: 'x' })
    t.onTriggerEnter()
    vi.advanceTimersByTime(700)
    expect(open.value).toBe(true)
    expect(t.trigger.attrs.value['data-delayed']).toBe('')

    open.value = false
    await nextTick()
    expect(t.trigger.attrs.value).toEqual(expect.objectContaining({ 'data-state': 'closed' }))
    open.value = true
    expect(t.isDelayed.value).toBe(false)
    expect(t.trigger.attrs.value['data-state']).toBe('open')
    expect(t.trigger.attrs.value['data-delayed']).toBeUndefined()
  })
})

describe('useTooltip — trigger surface', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('props expose aria-describedby, the grace-area selector and the listeners; data-state lives in attrs', () => {
    const t = useTooltip({ baseId: 'x' })
    const props = t.trigger.props.value
    expect(props['aria-describedby']).toBeUndefined()
    // The only `data-*` in props is the functional selector `useGraceArea` scopes with.
    expect(props['data-grace-area-trigger']).toBe('')
    expect(dataAttrKeys(props)).toEqual(['data-grace-area-trigger'])
    for (const name of ['onClick', 'onFocus', 'onPointermove', 'onPointerleave', 'onPointerdown', 'onBlur'])
      expect(typeof props[name]).toBe('function')
    expect(t.trigger.state.value).toEqual({ state: 'closed', delayed: false })
    expect(t.trigger.attrs.value).toMatchObject({ 'data-state': 'closed', 'data-grace-area-trigger': '' })
    expect(t.trigger.attrs.value['data-delayed']).toBeUndefined()
  })

  it('renders no listeners while disabled', () => {
    const disabled = ref(true)
    const t = useTooltip({ baseId: 'x', disabled })
    expect(Object.keys(t.trigger.props.value)).toEqual(['aria-describedby', 'data-grace-area-trigger'])
    disabled.value = false
    expect(typeof t.trigger.props.value.onFocus).toBe('function')
  })

  it('onFocus opens with trigger-focus and onBlur closes with trigger-blur', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', onUpdate })
    const focus = new FocusEvent('focus')
    t.trigger.props.value.onFocus(focus)
    expect(t.open.value).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-focus', event: focus }))
    expect(t.trigger.props.value['aria-describedby']).toBe('x-content')
    const blur = new FocusEvent('blur')
    t.trigger.props.value.onBlur(blur)
    expect(t.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-blur', event: blur }))
  })

  it('ignores the focus that follows a pointerdown until 1ms after pointerup', () => {
    const t = useTooltip({ baseId: 'x' })
    t.trigger.props.value.onPointerdown(pointerEvent('pointerdown'))
    t.trigger.props.value.onFocus(new FocusEvent('focus'))
    expect(t.open.value).toBe(false)

    document.dispatchEvent(new Event('pointerup'))
    t.trigger.props.value.onFocus(new FocusEvent('focus'))
    expect(t.open.value).toBe(false)
    vi.advanceTimersByTime(1)
    t.trigger.props.value.onFocus(new FocusEvent('focus'))
    expect(t.open.value).toBe(true)
  })

  it('with ignoreNonKeyboardFocus, focus opens only when the target matches :focus-visible', () => {
    const t = useTooltip({ baseId: 'x', ignoreNonKeyboardFocus: true })
    const el = document.createElement('button')
    el.addEventListener('focus', t.trigger.props.value.onFocus)
    el.matches = () => false
    el.dispatchEvent(new FocusEvent('focus'))
    expect(t.open.value).toBe(false)
    el.matches = (selector: string) => selector === ':focus-visible'
    el.dispatchEvent(new FocusEvent('focus'))
    expect(t.open.value).toBe(true)
  })

  it('onPointerdown and onClick close an open tooltip with trigger-press unless disableClosingTrigger', () => {
    const onUpdate = vi.fn()
    const t = useTooltip({ baseId: 'x', defaultOpen: true, onUpdate })
    const down = pointerEvent('pointerdown')
    t.trigger.props.value.onPointerdown(down)
    expect(t.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press', event: down }))

    t.onOpen()
    const click = new MouseEvent('click')
    t.trigger.props.value.onClick(click)
    expect(t.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press', event: click }))

    const u = useTooltip({ baseId: 'y', defaultOpen: true, disableClosingTrigger: true })
    u.trigger.props.value.onPointerdown(pointerEvent('pointerdown'))
    u.trigger.props.value.onClick(new MouseEvent('click'))
    expect(u.open.value).toBe(true)
  })

  it('onPointermove enters once per hover, never for touch nor while the pointer is in transit', () => {
    const transit = ref(false)
    const t = useTooltip({ baseId: 'x', isPointerInTransit: transit })
    const enter = vi.spyOn(t.context, 'onTriggerEnter')

    t.trigger.props.value.onPointermove(pointerEvent('pointermove', 'touch'))
    expect(enter).not.toHaveBeenCalled()

    transit.value = true
    t.trigger.props.value.onPointermove(pointerEvent('pointermove'))
    expect(enter).not.toHaveBeenCalled()

    transit.value = false
    const move = pointerEvent('pointermove')
    t.trigger.props.value.onPointermove(move)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith(move)
    // Subsequent moves over the same hover do not re-arm the timer …
    t.trigger.props.value.onPointermove(pointerEvent('pointermove'))
    expect(enter).toHaveBeenCalledTimes(1)
    // … until the pointer has left.
    const leave = vi.spyOn(t.context, 'onTriggerLeave')
    const leaveEvent = pointerEvent('pointerleave')
    t.trigger.props.value.onPointerleave(leaveEvent)
    expect(leave).toHaveBeenCalledWith(leaveEvent)
    t.trigger.props.value.onPointermove(pointerEvent('pointermove'))
    expect(enter).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(700)
    expect(t.open.value).toBe(true)
    expect(t.trigger.attrs.value['data-delayed']).toBe('')
  })
})

describe('useTooltip — content & label surfaces', () => {
  it('content is state-only: data-state plus data-delayed while delayed', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(t.content.props.value).toEqual({})
    expect(t.content.state.value).toEqual({ state: 'closed', delayed: false })
    expect(t.content.attrs.value).toEqual({ 'data-state': 'closed' })
    t.onOpen()
    expect(t.content.attrs.value).toEqual({ 'data-state': 'open' })
  })

  it('label carries the content id and role="tooltip" with no state', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(t.label.state.value).toEqual({})
    expect(t.label.attrs.value).toEqual({ id: 'x-content', role: 'tooltip' })
  })
})

describe('useTooltip — context', () => {
  it('exposes the TooltipContext shape the shell provides', () => {
    const t = useTooltip({ baseId: 'x' })
    expect(Object.keys(t.context).sort()).toEqual([
      'contentId',
      'disableClosingTrigger',
      'disableHoverableContent',
      'disabled',
      'ignoreNonKeyboardFocus',
      'isDelayed',
      'isPointerInTransit',
      'onClose',
      'onOpen',
      'onTriggerChange',
      'onTriggerEnter',
      'onTriggerLeave',
      'open',
      'stateAttribute',
      'trigger',
    ])
    expect(t.context.open).toBe(t.open)
    expect(t.context.isDelayed).toBe(t.isDelayed)
    expect(t.context.onOpen).toBe(t.onOpen)
    expect(t.context.onClose).toBe(t.onClose)
    expect(t.context.stateAttribute.value).toBe('closed')
    expect(t.context.trigger.value).toBeUndefined()
    const el = document.createElement('button')
    t.context.onTriggerChange(el)
    expect(t.context.trigger.value).toBe(el)
    // Dismissal reasons arrive through `onClose` from the layer the consumer composes.
    t.onOpen()
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(t.context.onClose('escape-key', event)).toBe(true)
    expect(t.context.stateAttribute.value).toBe('closed')
    expect(t.lastChangeDetails.value).toMatchObject({ reason: 'escape-key', event })
  })
})

describe('useTooltip — rendered surfaces', () => {
  // A standalone consumer binding the surfaces to plain elements, without the
  // Popper / Presence / DismissableLayer wrappers: the aria wiring alone has to
  // satisfy axe, closed and open.
  const Fixture = defineComponent({
    setup() {
      const t = useTooltip({ baseId: 'fixture' })
      return { t }
    },
    template: `
      <button v-bind="t.trigger.attrs.value">Hover</button>
      <div v-if="t.open.value" v-bind="t.content.attrs.value">
        Body
        <span v-bind="t.label.attrs.value">Add to library</span>
      </div>
    `,
  })

  it('wires trigger, content and label together and passes axe, closed and open', async () => {
    const { container, getByRole, getByText, queryByRole } = render(Fixture)
    const trigger = getByText('Hover')
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(trigger.hasAttribute('data-delayed')).toBe(false)
    expect(trigger.hasAttribute('data-grace-area-trigger')).toBe(true)
    expect(queryByRole('tooltip')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.focus(trigger)
    const label = getByRole('tooltip')
    expect(label.id).toBe('fixture-content')
    expect(trigger.getAttribute('aria-describedby')).toBe(label.id)
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(getByText('Body', { exact: false }).getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.blur(trigger)
    expect(queryByRole('tooltip')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
    expect(trigger.getAttribute('data-state')).toBe('closed')
  })
})

describe('useTooltip — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useTooltip).toBe('function')
    expect('createTooltipTriggerSurface' in Reka).toBe(false)
    expect('getTooltipContentSurface' in Reka).toBe(false)
    expect('getTooltipLabelSurface' in Reka).toBe(false)
  })
})
