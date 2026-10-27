import type { ToastOpenChangeReason } from './useToast'
import type { ChangeEventDetails } from '@/shared'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
  useToastManager,
  useToastProvider,
  useToastRoot,
  useToastSwipe,
  useToastTimer,
} from '.'

type Details = ChangeEventDetails<ToastOpenChangeReason>

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToastRoot — model', () => {
  it('defaults to open and uncontrolled, and reports imperative-action', () => {
    const onUpdate = vi.fn()
    const toast = useToastRoot({ onUpdate })
    expect(toast.open.value).toBe(true)
    expect(toast.isControlled.value).toBe(false)
    expect(toast.type.value).toBe('foreground')
    expect(toast.close()).toBe(true)
    expect(toast.open.value).toBe(false)
    // Already closed: no second emit.
    expect(toast.close('timeout')).toBe(false)
    expect(onUpdate.mock.calls.map(([value, d]) => [value, d.reason])).toEqual([[false, 'imperative-action']])
  })

  it('emits beforeUpdate:open and update:open with the same details when controlled', () => {
    const emit = vi.fn()
    const toast = useToastRoot({ open: () => true, emit })
    const event = new MouseEvent('click')
    expect(toast.close('close-press', event)).toBe(true)
    // Controlled: the parent owns the value.
    expect(toast.open.value).toBe(true)
    expect(emit.mock.calls.map(([name, value, d]) => [name, value, d.reason, d.event])).toEqual([
      ['beforeUpdate:open', false, 'close-press', event],
      ['update:open', false, 'close-press', event],
    ])
  })

  it('keeps the toast open when beforeUpdate cancels', () => {
    const onUpdate = vi.fn()
    const toast = useToastRoot({ onBeforeUpdate: (_, d) => d.cancel(), onUpdate })
    expect(toast.close('timeout')).toBe(false)
    expect(toast.open.value).toBe(true)
    expect(toast.lastChangeDetails.value).toMatchObject({ reason: 'timeout', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('reads a managed toast and writes a committed close back to the store', () => {
    const store = { commitClose: vi.fn(), registerCloseRequest: vi.fn(() => () => {}) }
    const managed = ref({ id: 't1', open: true, updateKey: 0, type: 'background' as const, status: 'loading' })
    const cancel = ref(false)
    const toast = useToastRoot({
      toast: managed,
      toastStore: store,
      duration: 1000,
      onBeforeUpdate: (_, d) => cancel.value && d.cancel(),
    })
    expect(toast.isControlled.value).toBe(true)
    expect(toast.type.value).toBe('background')
    expect(toast.duration.value).toBe(Number.POSITIVE_INFINITY)

    cancel.value = true
    expect(toast.close('close-press')).toBe(false)
    expect(store.commitClose).not.toHaveBeenCalled()

    cancel.value = false
    expect(toast.close('close-press')).toBe(true)
    expect(store.commitClose).toHaveBeenCalledWith('t1', expect.objectContaining({ reason: 'close-press' }))
    // Outside a scope it does not register with the store.
    expect(store.registerCloseRequest).not.toHaveBeenCalled()
  })
})

describe('useToastTimer', () => {
  function setup(onTimeout: () => boolean, duration = 1000) {
    const open = ref(true)
    const scope = effectScope()
    const timer = scope.run(() => useToastTimer({ open, duration, onTimeout }))!
    return { open, timer, scope }
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('calls onTimeout after the duration, and not before', () => {
    const onTimeout = vi.fn(() => true)
    const { scope } = setup(onTimeout)
    vi.advanceTimersByTime(999)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('pauses and resumes with the time left', () => {
    const onTimeout = vi.fn(() => true)
    const { timer, scope } = setup(onTimeout)
    vi.advanceTimersByTime(400)
    timer.pause()
    vi.advanceTimersByTime(5000)
    expect(onTimeout).not.toHaveBeenCalled()
    timer.resume()
    vi.advanceTimersByTime(599)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('re-arms a full duration when the toast stays open after a timeout', () => {
    // The close was cancelled (or a controlled parent ignored it): `open` is still true.
    const onTimeout = vi.fn(() => false)
    const { timer, scope } = setup(onTimeout)
    vi.advanceTimersByTime(1000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(999)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(2)
    expect(timer.remaining.value).toBeGreaterThan(0)
    scope.stop()
  })

  it('pauses and resumes the re-armed timer', () => {
    const onTimeout = vi.fn(() => false)
    const onResume = vi.fn()
    const open = ref(true)
    const scope = effectScope()
    const timer = scope.run(() => useToastTimer({ open, duration: 1000, onTimeout, onResume }))!
    vi.advanceTimersByTime(1000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(300)
    timer.pause()
    vi.advanceTimersByTime(10_000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    timer.resume()
    expect(onResume).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(699)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('does not re-arm once the toast has closed, and drops a pending timeout on close', async () => {
    const open = ref(true)
    const onTimeout = vi.fn(() => {
      open.value = false
      return true
    })
    const scope = effectScope()
    scope.run(() => useToastTimer({ open, duration: 1000, onTimeout }))
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(5000)
    expect(onTimeout).toHaveBeenCalledTimes(1)

    // Reopened, then closed by something else before the time is up: no late timeout.
    open.value = true
    await nextTick()
    vi.advanceTimersByTime(500)
    open.value = false
    await nextTick()
    vi.advanceTimersByTime(5000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('never times out with an infinite duration', () => {
    const onTimeout = vi.fn(() => true)
    const { scope } = setup(onTimeout, Number.POSITIVE_INFINITY)
    vi.advanceTimersByTime(60_000)
    expect(onTimeout).not.toHaveBeenCalled()
    scope.stop()
  })

  it('clears the pending timeout when its scope is disposed', () => {
    const onTimeout = vi.fn(() => true)
    const { scope } = setup(onTimeout)
    scope.stop()
    vi.advanceTimersByTime(2000)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})

describe('useToast — standalone', () => {
  // A consumer composing the toast composables on plain elements.
  const Standalone = defineComponent({
    setup() {
      const { context } = useToastProvider({ swipeDirection: 'right' })
      const { open, close } = useToastRoot({ defaultOpen: true })
      const { remaining } = useToastTimer({ open, duration: 4000, onTimeout: () => close('timeout') })
      const { swipe } = useToastSwipe({
        swipeDirection: context.swipeDirection,
        swipeThreshold: context.swipeThreshold,
        onSwipeEnd: event => close('swipe', event),
      })
      return () => h('section', { 'role': 'region', 'aria-label': 'Notifications' }, h('ol', open.value
        ? [h('li', { ...swipe.attrs.value, 'data-testid': 'toast', 'data-remaining': remaining.value }, [
            h('span', 'Saved'),
            h('button', { type: 'button', onClick: (e: MouseEvent) => close('close-press', e) }, 'Dismiss'),
          ])]
        : []))
    },
  })

  it('renders, closes and passes axe', async () => {
    const wrapper = mount(Standalone, { attachTo: document.body })
    expect(wrapper.get('[data-testid="toast"]').attributes('style')).toContain('touch-action: none')
    expect(await axe(wrapper.element)).toHaveNoViolations()
    await wrapper.get('button').trigger('click')
    expect(wrapper.find('[data-testid="toast"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

interface ToastFixtureOptions {
  open?: ReturnType<typeof ref<boolean>>
  writeBack?: boolean
  duration?: number
  onBeforeUpdate?: (value: boolean, details: Details) => void
}

function mountToast(options: ToastFixtureOptions = {}) {
  // Third entry: `Date.now()` when emitted (faked along with the timers).
  const updates: Array<[boolean, Details, number]> = []
  const befores: Array<[boolean, Details, number]> = []
  const slot = { remaining: -1 }
  const wrapper = mount(defineComponent({
    setup: () => () => h(ToastProvider, { duration: options.duration ?? 1000 }, () => [
      h(ToastRoot, {
        ...(options.open ? { open: options.open.value } : {}),
        'data-testid': 'toast',
        'onBeforeUpdate:open': (value: boolean, details: Details) => {
          befores.push([value, details, Date.now()])
          options.onBeforeUpdate?.(value, details)
        },
        'onUpdate:open': (value: boolean, details: Details) => {
          updates.push([value, details, Date.now()])
          if (options.open && options.writeBack !== false)
            options.open.value = value
        },
      }, {
        default: ({ remaining }: { remaining: number }) => {
          slot.remaining = remaining
          return [
            h(ToastTitle, () => 'Saved'),
            h(ToastDescription, () => 'Your changes are saved'),
            h(ToastAction, { 'altText': 'Undo the change', 'data-testid': 'action' }, () => 'Undo'),
            h(ToastClose, { 'aria-label': 'Close', 'data-testid': 'close' }, () => '×'),
          ]
        },
      }),
      h(ToastViewport, { 'data-testid': 'viewport' }),
    ]),
  }), { attachTo: document.body })
  const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { wrapper, updates, befores, slot, byTestId, reasons: () => updates.map(([, d]) => d.reason) }
}

describe('toastRoot — reasons', () => {
  it('reports timeout when the duration elapses', async () => {
    vi.useFakeTimers()
    const { byTestId, reasons } = mountToast()
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await vi.advanceTimersByTimeAsync(1000)
    expect(reasons()).toEqual(['timeout'])
  })

  it('reports close-press for ToastClose', async () => {
    const { byTestId, updates } = mountToast()
    await vi.waitFor(() => expect(byTestId('close')).not.toBeNull())
    byTestId('close')!.click()
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([[false, 'close-press']])
    expect(updates[0][1].event).toBeInstanceOf(MouseEvent)
  })

  it('reports action-press for ToastAction', async () => {
    const { byTestId, reasons } = mountToast()
    await vi.waitFor(() => expect(byTestId('action')).not.toBeNull())
    byTestId('action')!.click()
    expect(reasons()).toEqual(['action-press'])
  })

  it('reports escape-key', async () => {
    const { byTestId, reasons } = mountToast()
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(reasons()).toEqual(['escape-key'])
  })

  it('reports close-press for a managed toast and closes it in the manager', async () => {
    const updates: Details[] = []
    const Managed = defineComponent({
      setup() {
        const manager = useToastManager()
        manager.add({ id: 'saved', title: 'Saved' })
        return () => manager.toasts.value.map(toast => h(ToastRoot, {
          'key': toast.id,
          toast,
          'data-testid': 'managed',
          'onUpdate:open': (_: boolean, d: Details) => updates.push(d),
        }, () => [h(ToastTitle), h(ToastClose, { 'aria-label': 'Close', 'data-testid': 'managed-close' }, () => '×')]))
      },
    })
    let toasts: ReturnType<typeof useToastManager>['toasts'] | undefined
    const Spy = defineComponent({
      setup() {
        toasts = useToastManager().toasts
        return () => null
      },
    })
    mount(defineComponent({
      setup: () => () => h(ToastProvider, () => [h(Managed), h(Spy), h(ToastViewport)]),
    }), { attachTo: document.body })
    await vi.waitFor(() => expect(document.querySelector('[data-testid="managed-close"]')).not.toBeNull())
    document.querySelector<HTMLElement>('[data-testid="managed-close"]')!.click()
    expect(updates.map(d => d.reason)).toEqual(['close-press'])
    await vi.waitFor(() => expect(toasts!.value).toHaveLength(0))
  })
})

describe('toastRoot — cancellation', () => {
  it('keeps the toast open when its timeout close is cancelled, and asks again a full duration later', async () => {
    vi.useFakeTimers()
    const { byTestId, updates, befores, slot } = mountToast({ onBeforeUpdate: (_, d) => d.cancel() })
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await vi.advanceTimersByTimeAsync(1000)
    expect(befores.map(([, d]) => d.reason)).toEqual(['timeout'])
    expect(updates).toHaveLength(0)
    expect(byTestId('toast')!.getAttribute('data-state')).toBe('open')

    // The timer re-armed with the full duration, counted from the first timeout.
    const sinceTimeout = Date.now() - befores[0][2]
    await vi.advanceTimersByTimeAsync(999 - sinceTimeout)
    expect(slot.remaining).toBeGreaterThan(0)
    expect(befores).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(befores.map(([, d]) => d.reason)).toEqual(['timeout', 'timeout'])

    // A manual close still works.
    byTestId('close')!.click()
    expect(befores.map(([, d]) => d.reason)).toEqual(['timeout', 'timeout', 'close-press'])
  })

  it('[docs: keeping a toast open] closes on the first timeout after the upload finishes, with pause/resume', async () => {
    vi.useFakeTimers()
    const uploading = ref(true)
    const { byTestId, updates, befores } = mountToast({
      onBeforeUpdate: (value, d) => {
        if (!value && d.reason === 'timeout' && uploading.value)
          d.cancel()
      },
    })
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await vi.advanceTimersByTimeAsync(1000)
    expect(befores).toHaveLength(1)
    expect(updates).toHaveLength(0)

    uploading.value = false
    // Hovering the viewport pauses the re-armed timer; leaving resumes it.
    const viewport = byTestId('viewport')!
    await vi.advanceTimersByTimeAsync(400 - (Date.now() - befores[0][2]))
    viewport.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(5000)
    expect(updates).toHaveLength(0)
    viewport.dispatchEvent(new MouseEvent('pointerleave'))
    await vi.advanceTimersByTimeAsync(599)
    expect(updates).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([[false, 'timeout']])
  })

  it('keeps the toast open and focus in place when a keyboard close is cancelled', async () => {
    const { byTestId, updates } = mountToast({ onBeforeUpdate: (_, d) => d.cancel() })
    await vi.waitFor(() => expect(byTestId('close')).not.toBeNull())
    const close = byTestId('close')!
    close.focus()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'pointerType', { value: '' })
    close.dispatchEvent(event)
    await nextTick()
    expect(updates).toHaveLength(0)
    expect(byTestId('toast')!.getAttribute('data-state')).toBe('open')
    expect(document.activeElement).toBe(close)
  })

  it('keeps the toast open when an Escape close is cancelled', async () => {
    const { byTestId, updates } = mountToast({ onBeforeUpdate: (_, d) => d.cancel() })
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(updates).toHaveLength(0)
    expect(byTestId('toast')!.getAttribute('data-state')).toBe('open')
  })
})

describe('toastRoot — controlled and uncontrolled', () => {
  it('closes an uncontrolled toast', async () => {
    const { byTestId, updates } = mountToast()
    await vi.waitFor(() => expect(byTestId('close')).not.toBeNull())
    byTestId('close')!.click()
    await vi.waitFor(() => expect(byTestId('toast')).toBeNull())
    expect(updates).toHaveLength(1)
  })

  it('keeps a controlled toast open when the parent ignores the update', async () => {
    const open = ref(true)
    const { byTestId, updates } = mountToast({ open, writeBack: false })
    await vi.waitFor(() => expect(byTestId('close')).not.toBeNull())
    byTestId('close')!.click()
    await nextTick()
    expect(updates.map(([value]) => value)).toEqual([false])
    expect(byTestId('toast')!.getAttribute('data-state')).toBe('open')
  })

  it('asks again a full duration later when a controlled parent ignores a timeout', async () => {
    vi.useFakeTimers()
    const open = ref(true)
    const { byTestId, updates } = mountToast({ open, writeBack: false })
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await vi.advanceTimersByTimeAsync(1000)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([[false, 'timeout']])
    expect(byTestId('toast')!.getAttribute('data-state')).toBe('open')
    await vi.advanceTimersByTimeAsync(999 - (Date.now() - updates[0][2]))
    expect(updates).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([[false, 'timeout'], [false, 'timeout']])
  })

  it('follows the parent and emits once when the toast is closed and then times out', async () => {
    vi.useFakeTimers()
    const open = ref(true)
    const { byTestId, updates } = mountToast({ open })
    await vi.waitFor(() => expect(byTestId('close')).not.toBeNull())
    byTestId('close')!.click()
    await vi.advanceTimersByTimeAsync(2000)
    expect(updates.map(([value, d]) => [value, d.reason])).toEqual([[false, 'close-press']])

    open.value = true
    await vi.waitFor(() => expect(byTestId('toast')?.getAttribute('data-state')).toBe('open'))
  })
})

function mountManaged(onBeforeUpdate?: (value: boolean, details: Details, id: string) => void) {
  const updates: Details[] = []
  let manager: ReturnType<typeof useToastManager> | undefined
  const Managed = defineComponent({
    setup() {
      manager = useToastManager()
      return () => manager!.toasts.value.map(toast => h(ToastRoot, {
        'key': toast.id,
        toast,
        'data-testid': toast.id,
        'onBeforeUpdate:open': (value: boolean, d: Details) => onBeforeUpdate?.(value, d, toast.id),
        'onUpdate:open': (_: boolean, d: Details) => updates.push(d),
      }, () => [h(ToastTitle), h(ToastClose, { 'aria-label': 'Close', 'data-testid': `${toast.id}-close` }, () => '×')]))
    },
  })
  mount(defineComponent({
    setup: () => () => h(ToastProvider, { duration: 1000 }, () => [h(Managed), h(ToastViewport)]),
  }), { attachTo: document.body })
  return { updates, manager: () => manager! }
}

describe('toast manager — close details', () => {
  it('passes the close details to onClose', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { manager } = mountManaged()
    manager().add({ id: 'a', title: 'A', onClose })
    manager().add({ id: 'b', title: 'B', onClose, duration: 5000 })
    await vi.waitFor(() => expect(document.querySelector('[data-testid="b-close"]')).not.toBeNull())
    document.querySelector<HTMLElement>('[data-testid="b-close"]')!.click()
    await vi.advanceTimersByTimeAsync(1000)
    expect(onClose.mock.calls.map(([d]) => d.reason)).toEqual(['close-press', 'timeout'])
    expect(onClose.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
  })

  it('closes a rendered toast through its ToastRoot with imperative-action', async () => {
    const onClose = vi.fn()
    const { manager, updates } = mountManaged()
    manager().add({ id: 'a', title: 'A', onClose })
    await vi.waitFor(() => expect(document.querySelector('[data-testid="a"]')).not.toBeNull())
    manager().close('a')
    expect(updates.map(d => d.reason)).toEqual(['imperative-action'])
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toBe(updates[0])
    expect(manager().toasts.value[0].open).toBe(false)
  })

  it('lets beforeUpdate:open cancel manager.close(id), per toast for close()', async () => {
    const onClose = vi.fn()
    const { manager, updates } = mountManaged((_, d, id) => {
      if (d.reason === 'imperative-action' && id === 'keep')
        d.cancel()
    })
    manager().add({ id: 'keep', title: 'Keep', onClose })
    manager().add({ id: 'go', title: 'Go' })
    await vi.waitFor(() => expect(document.querySelector('[data-testid="keep"]')).not.toBeNull())
    manager().close('keep')
    expect(updates).toHaveLength(0)
    expect(onClose).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="keep"]')!.getAttribute('data-state')).toBe('open')

    // `close()` asks each toast: the cancelled one stays open, the other closes.
    manager().close()
    expect(updates.map(d => d.reason)).toEqual(['imperative-action'])
    expect(manager().toasts.value.map(t => [t.id, t.open])).toEqual([['go', false], ['keep', true]])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes a toast that is not rendered directly, with imperative-action', () => {
    const onClose = vi.fn()
    let manager: ReturnType<typeof useToastManager> | undefined
    mount(defineComponent({
      setup: () => () => h(ToastProvider, () => h(defineComponent({
        setup() {
          manager = useToastManager()
          return () => null
        },
      }))),
    }))
    manager!.add({ id: 'x', title: 'X', onClose })
    manager!.close()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0].reason).toBe('imperative-action')
    expect(manager!.toasts.value[0].open).toBe(false)
  })
})

describe('toastViewport', () => {
  it('focuses the viewport on the hotkey', async () => {
    const { byTestId } = mountToast()
    await vi.waitFor(() => expect(byTestId('toast')).not.toBeNull())
    await fireEvent.keyDown(window, { key: 'F8' })
    expect(document.activeElement).toBe(byTestId('viewport'))
    expect(byTestId('viewport')!.closest('[role="region"]')!.getAttribute('aria-label')).toBe('Notifications (F8)')
  })
})
