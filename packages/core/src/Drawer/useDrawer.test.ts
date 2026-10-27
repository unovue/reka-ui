import type { DrawerOpenChangeDetails } from './DrawerRoot.vue'
import type { DrawerSnapPoint } from './utils'
import { fireEvent, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle } from '.'
import * as Reka from '../index'
import { useDrawer } from './useDrawer'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).filter(k => k !== 'data-drawer-viewport').every(k => !k.startsWith('data-'))
}

describe('useDrawer — state', () => {
  it('defaults to closed, modal, swipe down, uncontrolled', () => {
    const d = useDrawer()
    expect(d.open.value).toBe(false)
    expect(d.modal.value).toBe(true)
    expect(d.swipeDirection.value).toBe('down')
    expect(d.activeSnapPoint.value).toBeNull()
  })

  it('honours defaultOpen / modal / swipeDirection / defaultSnapPoint', () => {
    const modal = ref<boolean | 'trap-focus'>('trap-focus')
    const d = useDrawer({ defaultOpen: true, modal, swipeDirection: () => 'left', defaultSnapPoint: 0.5 })
    expect(d.open.value).toBe(true)
    expect(d.modal.value).toBe('trap-focus')
    expect(d.context.modal.value).toBe('trap-focus')
    expect(d.swipeDirection.value).toBe('left')
    expect(d.activeSnapPoint.value).toBe(0.5)
    modal.value = false
    expect(d.context.modal.value).toBe(false)
  })

  it('onOpenChange / onOpenToggle drive the uncontrolled model; unchanged is a no-op that reports true', () => {
    const onOpenChange = vi.fn()
    const d = useDrawer({ onUpdate: onOpenChange })
    expect(d.onOpenChange(true)).toBe(true)
    expect(d.open.value).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'imperative-action', isCanceled: false }))
    // Base UI parity: an unchanged request returns true and emits nothing.
    expect(d.onOpenChange(true)).toBe(true)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    d.onOpenToggle()
    expect(d.open.value).toBe(false)
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }))
  })

  it('details.cancel() inside onBeforeUpdate vetoes the change', () => {
    const d = useDrawer({
      defaultOpen: true,
      onBeforeUpdate: (_value, details) => details.cancel(),
    })
    expect(d.close.props.value.onClick()).toBe(false)
    expect(d.open.value).toBe(true)
    expect(d.trigger.attrs.value['data-state']).toBe('open')
  })

  it('controlled: reads the prop and reports the request without moving off it', () => {
    const open = ref(false)
    const onOpenChange = vi.fn((value: boolean, _details: DrawerOpenChangeDetails) => {
      open.value = value
    })
    const d = useDrawer({ open, onUpdate: onOpenChange })
    d.trigger.props.value.onClick()
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    expect(d.open.value).toBe(true)

    // A parent that ignores the request keeps the drawer where it is.
    const ignored = useDrawer({ open: () => false, onUpdate: vi.fn() })
    ignored.onOpenToggle()
    expect(ignored.open.value).toBe(false)
  })

  it('setActiveSnapPoint writes a passed snap-point ref (ref-owned)', () => {
    const snap = ref<DrawerSnapPoint | null | undefined>(null)
    const d = useDrawer({ snapPoint: snap })
    expect(d.context.setActiveSnapPoint(0.3, 'swipe')).toBe(true)
    expect(snap.value).toBe(0.3)
    expect(d.activeSnapPoint.value).toBe(0.3)
  })

  it('snap point: beforeUpdate can cancel, update reports the committed change (#2789)', () => {
    const onBeforeSnapPointUpdate = vi.fn()
    const onSnapPointUpdate = vi.fn()
    const d = useDrawer({ snapPoints: [0.5, 1], defaultSnapPoint: 0.5, onBeforeSnapPointUpdate, onSnapPointUpdate })
    expect(d.setActiveSnapPoint(1, 'swipe')).toBe(true)
    expect(d.activeSnapPoint.value).toBe(1)
    expect(onSnapPointUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'swipe' }))
    // An unchanged point reports `true` and emits nothing.
    expect(d.setActiveSnapPoint(1)).toBe(true)
    expect(onBeforeSnapPointUpdate).toHaveBeenCalledTimes(1)
    onBeforeSnapPointUpdate.mockImplementation((_v, details) => details.cancel())
    expect(d.setActiveSnapPoint(0.5, 'swipe')).toBe(false)
    expect(d.activeSnapPoint.value).toBe(1)
  })

  it('snap point: controlled mode latches and only reports the request', () => {
    const onSnapPointUpdate = vi.fn()
    const d = useDrawer({ snapPoints: [0.5, 1], snapPoint: () => 0.5, onSnapPointUpdate })
    d.setActiveSnapPoint(1, 'swipe')
    expect(onSnapPointUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'swipe' }))
    expect(d.activeSnapPoint.value).toBe(0.5)
  })

  it('a close a controlled parent ignores keeps the snap point', async () => {
    const onSnapPointUpdate = vi.fn()
    const d = useDrawer({ open: () => true, snapPoints: [0.5, 1], defaultSnapPoint: 0.5, onSnapPointUpdate })
    d.setActiveSnapPoint(1, 'swipe')
    expect(d.onOpenChange(false, 'escape-key')).toBe(true)
    await nextTick()
    expect(d.open.value).toBe(true)
    expect(d.activeSnapPoint.value).toBe(1)
    expect(onSnapPointUpdate).toHaveBeenCalledTimes(1)
  })

  it('a close resets the snap point to the default, as Base UI does', () => {
    const onSnapPointUpdate = vi.fn()
    const d = useDrawer({ defaultOpen: true, snapPoints: [0.5, 1], defaultSnapPoint: 0.5, onSnapPointUpdate })
    d.setActiveSnapPoint(1, 'swipe')
    d.onOpenChange(false, 'escape-key')
    expect(d.activeSnapPoint.value).toBe(0.5)
    expect(onSnapPointUpdate).toHaveBeenLastCalledWith(0.5, expect.objectContaining({ reason: 'escape-key' }))
  })

  it('notifies the parent and provider contexts for nested drawers', () => {
    const parent = useDrawer()
    const set = vi.fn()
    const child = useDrawer({
      parentContext: parent.context,
      providerContext: { active: ref(false), setDrawerOpen: vi.fn(), removeDrawer: vi.fn(), visualStateStore: { getSnapshot: vi.fn(), set, subscribe: vi.fn() } },
    })
    child.context.notifyParentHasNestedDrawer?.(true)
    expect(parent.context.hasNestedDrawer.value).toBe(true)
    expect(parent.context.nestedOpenDrawerCount.value).toBe(1)
    child.context.onPopupHeightChange(120)
    expect(set).toHaveBeenCalledWith({ frontmostHeight: 120 })
    child.context.onNestedSwipeProgressChange(0.4)
    expect(set).toHaveBeenCalledWith({ swipeProgress: 0.4 })
  })
})

describe('useDrawer — ids and surfaces', () => {
  it('derives content/title/description ids from baseId; standalone calls are unique', () => {
    const d = useDrawer({ baseId: 'x' })
    expect(d.context.contentId).toBe('x-content')
    expect(d.title.attrs.value).toEqual({ id: 'x-title' })
    expect(d.description.attrs.value).toEqual({ id: 'x-description' })
    expect(useDrawer().context.contentId).not.toBe(useDrawer().context.contentId)
  })

  it('props carry no data-* (except the viewport selector); attrs derive them from state', () => {
    const d = useDrawer({ baseId: 'x' })
    for (const part of [d.trigger, d.close, d.title, d.description, d.grabber, d.viewport, d.overlay, d.content])
      expect(noDataAttrs(part.props.value)).toBe(true)

    expect(d.trigger.attrs.value).toMatchObject({ 'aria-haspopup': 'dialog', 'aria-expanded': false, 'data-state': 'closed' })
    expect(d.trigger.attrs.value['aria-controls']).toBeUndefined()
    expect(d.grabber.attrs.value).toEqual({ 'aria-hidden': 'true', 'data-state': 'closed' })
    expect(d.viewport.attrs.value).toEqual({ 'data-drawer-viewport': '', 'data-state': 'closed' })
    expect(d.overlay.attrs.value).toEqual({ 'data-state': 'closed', 'data-swipe-direction': 'down' })
    expect(d.content.attrs.value).toEqual({
      'id': 'x-content',
      'role': 'dialog',
      'aria-describedby': 'x-description',
      'aria-labelledby': 'x-title',
      'data-state': 'closed',
      'data-swipe-direction': 'down',
    })

    d.onOpenToggle()
    d.context.onSwipingChange(true)
    d.context.onNestedDrawerPresenceChange(true)
    expect(d.trigger.attrs.value['aria-controls']).toBe('x-content')
    expect(d.overlay.attrs.value).toEqual({ 'data-state': 'open', 'data-swipe-direction': 'down', 'data-swiping': '' })
    // The content's `data-swiping` follows the popup's own gesture, not the root flag.
    expect(d.content.attrs.value['data-swiping']).toBeUndefined()
    expect(d.content.attrs.value['data-nested-drawer-open']).toBe('')
  })
})

describe('useDrawer — reasons through the shell', () => {
  let unmount: (() => void) | undefined
  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  function mountDrawer(onUpdate: (value: boolean, details: DrawerOpenChangeDetails) => void, event = 'update:open') {
    const result = render(defineComponent({
      components: { DrawerRoot, DrawerPortal, DrawerContent, DrawerTitle },
      setup: () => ({ onUpdate, event }),
      template: `
        <DrawerRoot :default-open="true" v-on="{ [event]: onUpdate }">
          <DrawerPortal>
            <DrawerContent><DrawerTitle>Title</DrawerTitle></DrawerContent>
          </DrawerPortal>
        </DrawerRoot>
      `,
    }))
    unmount = result.unmount
    return result
  }

  it('reports escape-key, and cancel() keeps the drawer open', async () => {
    const onUpdate = vi.fn((_v: boolean, details: DrawerOpenChangeDetails) => details.cancel())
    const { getByRole } = mountDrawer(onUpdate, 'beforeUpdate:open')
    await nextTick()
    await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape-key' }))
    await nextTick()
    expect(getByRole('dialog')).toBeTruthy()
  })

  it('reports outside-press', async () => {
    const onUpdate = vi.fn()
    mountDrawer(onUpdate)
    // Outside-pointerdown listeners arm a macrotask after mount; retry until armed.
    await vi.waitFor(async () => {
      await fireEvent.pointerDown(document.body)
      expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'outside-press' }))
    })
  })
})

describe('useDrawer — rendered surfaces', () => {
  const Fixture = defineComponent({
    setup() {
      const d = useDrawer({ defaultOpen: true, baseId: 'fixture' })
      return { d }
    },
    template: `
      <button v-bind="d.trigger.attrs.value">Open</button>
      <div v-if="d.open.value" v-bind="d.content.attrs.value">
        <h2 v-bind="d.title.attrs.value">Title</h2>
        <p v-bind="d.description.attrs.value">Description</p>
        <button v-bind="d.close.attrs.value">Close</button>
      </div>
    `,
  })

  it('wires trigger/content/title/description together and passes axe, open and closed', async () => {
    const { container, getByRole, getByText, queryByRole } = render(Fixture)
    const trigger = getByText('Open')
    const dialog = getByRole('dialog')
    expect(dialog.id).toBe('fixture-content')
    expect(dialog.getAttribute('aria-labelledby')).toBe(getByText('Title').id)
    expect(dialog.getAttribute('aria-describedby')).toBe(getByText('Description').id)
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(getByText('Close'))
    expect(queryByRole('dialog')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(trigger)
    expect(getByRole('dialog').id).toBe('fixture-content')
  })
})

describe('useDrawer — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useDrawer).toBe('function')
    expect(typeof Reka.useDrawerContent).toBe('function')
    expect(typeof Reka.useDrawerSwipeArea).toBe('function')
    expect('getDrawerTriggerSurface' in Reka).toBe(false)
  })
})
