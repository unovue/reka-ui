import { fireEvent, render } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import * as Reka from '../index'
import { useHoverCard } from './useHoverCard'

// jsdom has no reliable `PointerEvent`; a `MouseEvent` with `pointerType`
// assigned is all `excludeTouch` and the touch toggle read.
function pointerEvent(type: string, pointerType: 'mouse' | 'touch' = 'mouse'): PointerEvent {
  return Object.assign(new MouseEvent(type), { pointerType }) as PointerEvent
}

describe('useHoverCard — state', () => {
  it('defaults to closed, uncontrolled, touch disabled', () => {
    const h = useHoverCard()
    expect(h.open.value).toBe(false)
    expect(h.isControlled.value).toBe(false)
    expect(h.context.enableTouch.value).toBe(false)
    expect(h.lastChangeDetails.value.reason).toBe('none')
  })

  it('honours defaultOpen and a reactive enableTouch getter', () => {
    const enableTouch = ref(false)
    const h = useHoverCard({ defaultOpen: true, enableTouch: () => enableTouch.value })
    expect(h.open.value).toBe(true)
    expect(h.context.enableTouch.value).toBe(false)
    enableTouch.value = true
    expect(h.context.enableTouch.value).toBe(true)
  })

  it('onOpenChange() sets the state immediately and reports imperative-action by default', () => {
    const h = useHoverCard()
    expect(h.onOpenChange(true)).toBe(true)
    expect(h.open.value).toBe(true)
    expect(h.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(h.onOpenChange(true)).toBe(false)
    expect(h.onOpenChange(false)).toBe(true)
    expect(h.open.value).toBe(false)
  })

  it('ref-owned mode writes through the passed ref', () => {
    const open = ref(false)
    const h = useHoverCard({ open })
    expect(h.isControlled.value).toBe(true)
    h.onOpenChange(true, 'trigger-press')
    expect(open.value).toBe(true)
    expect(h.open.value).toBe(true)
  })

  it('controlled getter + emit: emits beforeUpdate/update with the same details and does not write locally', () => {
    const emit = vi.fn()
    const h = useHoverCard({ open: () => false, emit })
    expect(h.isControlled.value).toBe(true)
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    h.onOpenChange(true, 'trigger-press', event)
    expect(h.open.value).toBe(false)
    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:open', true, expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:open', true, expect.objectContaining({ reason: 'trigger-press', event }))
    const [, , beforeDetails] = emit.mock.calls[0]
    const [, , details] = emit.mock.calls[1]
    expect(beforeDetails).toBe(details)
  })

  it('cancel() in onBeforeUpdate vetoes the change and skips onUpdate', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    expect(h.onOpenChange(true, 'trigger-press')).toBe(false)
    expect(h.open.value).toBe(false)
    expect(h.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('useHoverCard — timers', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('onOpen() opens after openDelay (default 700) carrying reason + event', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onUpdate })
    const event = pointerEvent('pointerenter')
    h.onOpen('trigger-hover', event)
    vi.advanceTimersByTime(699)
    expect(h.open.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(h.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-hover', event, isCanceled: false }))
    expect(h.lastChangeDetails.value.reason).toBe('trigger-hover')
  })

  it('onClose() closes after closeDelay (default 300) carrying reason + event', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ defaultOpen: true, onUpdate })
    const event = new FocusEvent('blur')
    h.onClose('trigger-blur', event)
    vi.advanceTimersByTime(299)
    expect(h.open.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(h.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'trigger-blur', event }))
  })

  it('reads openDelay / closeDelay through getters at scheduling time', () => {
    const openDelay = ref(100)
    const h = useHoverCard({ openDelay, closeDelay: () => 50 })
    h.onOpen()
    vi.advanceTimersByTime(100)
    expect(h.open.value).toBe(true)
    h.onClose()
    vi.advanceTimersByTime(50)
    expect(h.open.value).toBe(false)

    openDelay.value = 10
    h.onOpen()
    vi.advanceTimersByTime(10)
    expect(h.open.value).toBe(true)
  })

  it('onClose() cancels a pending open', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onUpdate })
    h.onOpen('trigger-hover')
    vi.advanceTimersByTime(500)
    h.onClose('trigger-leave')
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)
    // The scheduled `setState(false)` on an already-closed card is a no-op.
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('onOpen() cancels a pending close', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ defaultOpen: true, onUpdate })
    h.onClose('trigger-leave')
    vi.advanceTimersByTime(200)
    h.onOpen('content-hover')
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('hasSelectionRef / isPointerDownOnContentRef block the delayed close but still cancel a pending open', () => {
    const h = useHoverCard({ defaultOpen: true })
    h.context.hasSelectionRef.value = true
    h.onClose('content-leave')
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(true)

    h.context.hasSelectionRef.value = false
    h.context.isPointerDownOnContentRef.value = true
    h.onClose('content-leave')
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(true)

    // A pending open is still cancelled while the close is withheld.
    h.onOpenChange(false)
    h.onOpen('trigger-hover')
    h.onClose('trigger-leave')
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)

    h.context.isPointerDownOnContentRef.value = false
    h.onOpenChange(true)
    h.onClose('content-leave')
    vi.advanceTimersByTime(300)
    expect(h.open.value).toBe(false)
  })

  it('onDismiss() closes immediately, cancels a pending open and returns false when already closed', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ defaultOpen: true, onUpdate })
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(h.onDismiss('escape-key', event)).toBe(true)
    expect(h.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape-key', event }))

    // Already closed → no-op.
    expect(h.onDismiss('outside-press')).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)

    // A pending open does not survive a dismiss.
    h.onOpen('trigger-focus')
    expect(h.onDismiss('trigger-press')).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

describe('useHoverCard — trigger surface', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('props expose the grace-area selector and the listeners but no semantic data-*', () => {
    const h = useHoverCard()
    const props = h.trigger.props.value
    // `data-grace-area-trigger` is a functional selector `useGraceArea` queries,
    // not state — the one `data-*` allowed in `props`.
    expect(props['data-grace-area-trigger']).toBe('')
    expect(props['data-state']).toBeUndefined()
    expect(Object.keys(props).filter(k => k.startsWith('data-'))).toEqual(['data-grace-area-trigger'])
    for (const key of ['onPointerenter', 'onPointerleave', 'onPointerup', 'onFocus', 'onBlur'])
      expect(typeof props[key]).toBe('function')
  })

  it('attrs merge props with the data-state derived from state', () => {
    const h = useHoverCard()
    expect(h.trigger.state.value).toEqual({ state: 'closed' })
    expect(h.trigger.attrs.value).toMatchObject({ 'data-state': 'closed', 'data-grace-area-trigger': '' })
    h.onOpenChange(true)
    expect(h.trigger.state.value).toEqual({ state: 'open' })
    expect(h.trigger.attrs.value['data-state']).toBe('open')
  })

  it('onPointerenter schedules a trigger-hover open; touch pointers are ignored', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onUpdate })
    h.trigger.props.value.onPointerenter(pointerEvent('pointerenter', 'touch'))
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)

    const event = pointerEvent('pointerenter')
    h.trigger.props.value.onPointerenter(event)
    expect(h.open.value).toBe(false)
    vi.advanceTimersByTime(700)
    expect(h.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-hover', event }))
  })

  it('onPointerleave only cancels a pending open (a tick later); open cards are left to the grace area', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onUpdate })
    h.trigger.props.value.onPointerenter(pointerEvent('pointerenter'))
    h.trigger.props.value.onPointerleave(pointerEvent('pointerleave'))
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()

    // Touch leave is ignored: the pending open survives.
    h.trigger.props.value.onPointerenter(pointerEvent('pointerenter'))
    h.trigger.props.value.onPointerleave(pointerEvent('pointerleave', 'touch'))
    vi.advanceTimersByTime(700)
    expect(h.open.value).toBe(true)

    // While open, leaving the trigger schedules nothing.
    h.trigger.props.value.onPointerleave(pointerEvent('pointerleave'))
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledTimes(1)

    // While in transit towards the content, a leave is also ignored.
    h.onOpenChange(false)
    h.trigger.props.value.onPointerenter(pointerEvent('pointerenter'))
    h.context.isPointerInTransitRef.value = true
    h.trigger.props.value.onPointerleave(pointerEvent('pointerleave'))
    vi.advanceTimersByTime(700)
    expect(h.open.value).toBe(true)
  })

  it('onPointerup toggles immediately on touch only when enableTouch is set', () => {
    const onUpdate = vi.fn()
    const enableTouch = ref(false)
    const h = useHoverCard({ enableTouch, onUpdate })
    h.trigger.props.value.onPointerup(pointerEvent('pointerup', 'touch'))
    expect(h.open.value).toBe(false)

    enableTouch.value = true
    // Non-touch pointers never toggle.
    h.trigger.props.value.onPointerup(pointerEvent('pointerup', 'mouse'))
    expect(h.open.value).toBe(false)

    const tap = pointerEvent('pointerup', 'touch')
    h.trigger.props.value.onPointerup(tap)
    expect(h.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event: tap }))

    // Closing on tap is a dismiss: immediate, and it drops a pending focus open.
    h.trigger.props.value.onFocus(new FocusEvent('focus'))
    h.trigger.props.value.onPointerup(pointerEvent('pointerup', 'touch'))
    expect(h.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }))
    vi.advanceTimersByTime(1000)
    expect(h.open.value).toBe(false)
  })

  it('onFocus / onBlur schedule the delayed open / close with their reasons', () => {
    const onUpdate = vi.fn()
    const h = useHoverCard({ onUpdate })
    const focus = new FocusEvent('focus')
    h.trigger.props.value.onFocus(focus)
    vi.advanceTimersByTime(700)
    expect(h.open.value).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-focus', event: focus }))

    const blur = new FocusEvent('blur')
    h.trigger.props.value.onBlur(blur)
    vi.advanceTimersByTime(300)
    expect(h.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-blur', event: blur }))
  })
})

describe('useHoverCard — content surface', () => {
  it('is state-only: no props, data-state in attrs', () => {
    const h = useHoverCard()
    expect(h.content.props.value).toEqual({})
    expect(h.content.state.value).toEqual({ state: 'closed' })
    expect(h.content.attrs.value).toEqual({ 'data-state': 'closed' })
    h.onOpenChange(true)
    expect(h.content.attrs.value).toEqual({ 'data-state': 'open' })
  })
})

describe('useHoverCard — context', () => {
  it('exposes the frozen-shape HoverCardRootContext', () => {
    const h = useHoverCard()
    expect(Object.keys(h.context).sort()).toEqual([
      'enableTouch',
      'hasSelectionRef',
      'isPointerDownOnContentRef',
      'isPointerInTransitRef',
      'onClose',
      'onDismiss',
      'onOpen',
      'onOpenChange',
      'open',
      'triggerElement',
    ])
    expect(h.context.open).toBe(h.open)
    expect(h.context.onOpenChange).toBe(h.onOpenChange)
    expect(h.context.onOpen).toBe(h.onOpen)
    expect(h.context.onClose).toBe(h.onClose)
    expect(h.context.onDismiss).toBe(h.onDismiss)
    expect(h.context.triggerElement.value).toBeUndefined()
    expect(h.context.hasSelectionRef.value).toBe(false)
    expect(h.context.isPointerDownOnContentRef.value).toBe(false)
    expect(h.context.isPointerInTransitRef.value).toBe(false)
    expect(h.context.onOpenChange(true, 'trigger-press')).toBe(true)
    expect(h.open.value).toBe(true)
    // Dismissal reasons arrive through `onDismiss` from the layer the consumer composes.
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(h.context.onDismiss('escape-key', event)).toBe(true)
    expect(h.lastChangeDetails.value).toMatchObject({ reason: 'escape-key', event })
  })
})

describe('useHoverCard — rendered surfaces', () => {
  // A standalone consumer binding the surfaces to plain elements, without the
  // Popper / Presence / DismissableLayer wrappers or the grace area: the
  // trigger wiring alone has to satisfy axe, closed and open. Zero delays so
  // the timers resolve on the next macrotask.
  const Fixture = defineComponent({
    setup() {
      const h = useHoverCard({ openDelay: 0, closeDelay: 0 })
      return { h }
    },
    template: `
      <a href="#" v-bind="h.trigger.attrs.value">Trigger</a>
      <div v-if="h.open.value" v-bind="h.content.attrs.value">
        <p>Body</p>
      </div>
    `,
  })

  it('wires trigger and content together and passes axe, closed and open', async () => {
    const { container, getByText, queryByText } = render(Fixture)
    const trigger = getByText('Trigger')
    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(trigger.hasAttribute('data-grace-area-trigger')).toBe(true)
    expect(queryByText('Body')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.focus(trigger)
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('open'))
    const content = getByText('Body').parentElement!
    expect(content.getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.blur(trigger)
    await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'))
    expect(queryByText('Body')).toBeNull()
  })
})

describe('useHoverCard — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useHoverCard).toBe('function')
    expect('getHoverCardTriggerSurface' in Reka).toBe(false)
    expect('getHoverCardContentSurface' in Reka).toBe(false)
  })
})
