import type { GlobalToastManager, ToastObject, UseToastManagerReturn } from '.'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import {
  createToastManager,
  ToastAction,
  ToastArrow,
  ToastClose,
  ToastDescription,
  ToastPositioner,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from '.'

function renderToast(toast: ToastObject) {
  return h(ToastRoot, { 'key': toast.id, toast, 'data-testid': toast.id }, () => [
    h(ToastTitle),
    h(ToastDescription),
    h(ToastAction),
    h(ToastClose, null, () => 'Close'),
  ])
}

function mountToaster(options: {
  toastManager?: GlobalToastManager
  limit?: number
  duration?: number
  render?: (toast: ToastObject) => ReturnType<typeof h>
} = {}) {
  let api!: UseToastManagerReturn
  const Toaster = defineComponent({
    setup() {
      api = useToastManager()
      return () => api.toasts.value.map(options.render ?? renderToast)
    },
  })

  const wrapper = mount(defineComponent({
    render: () => h(ToastProvider, {
      toastManager: options.toastManager,
      limit: options.limit,
      duration: options.duration,
    }, () => [h(Toaster), h(ToastViewport)]),
  }), { attachTo: document.body })

  return { wrapper, get api() { return api } }
}

const getToast = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

async function flush() {
  await nextTick()
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToastManager', () => {
  it('adds a toast and renders its title and description', async () => {
    const { api, wrapper } = mountToaster()
    const id = api.add({ title: 'Saved', description: 'Your changes are saved.' })
    await flush()

    const toast = getToast(id)!
    expect(toast).toBeTruthy()
    expect(toast.textContent).toContain('Saved')
    expect(toast.textContent).toContain('Your changes are saved.')
    expect(api.toasts.value).toHaveLength(1)
    // No `actionProps` and no slot content, so no action is rendered.
    expect(toast.querySelectorAll('button')).toHaveLength(1)
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('does not render a title element when the toast has no title', async () => {
    const { api } = mountToaster({
      render: toast => h(ToastRoot, { 'key': toast.id, toast, 'data-testid': toast.id }, () => [
        h(ToastTitle, { class: 'title' }),
        h(ToastDescription, { class: 'description' }),
      ]),
    })
    const id = api.add({ description: 'Only a description' })
    await flush()

    expect(getToast(id)!.querySelector('.title')).toBeNull()
    expect(getToast(id)!.querySelector('.description')).toBeTruthy()
  })

  it('closes, then removes the toast and calls onClose and onRemove', async () => {
    const onClose = vi.fn()
    const onRemove = vi.fn()
    const { api } = mountToaster()
    const id = api.add({ title: 'Bye', onClose, onRemove })
    await flush()

    api.close(id)
    await flush()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(api.toasts.value).toHaveLength(0)
    expect(getToast(id)).toBeNull()
  })

  it('closes every toast when close is called without an id', async () => {
    const { api } = mountToaster()
    api.add({ title: 'One' })
    api.add({ title: 'Two' })
    await flush()

    api.close()
    await flush()
    expect(api.toasts.value).toHaveLength(0)
  })

  it('removes a toast when ToastClose is clicked', async () => {
    const { api } = mountToaster()
    const id = api.add({ title: 'Closable' })
    await flush()

    await fireEvent.click(getToast(id)!.querySelector('button')!)
    await flush()
    expect(api.toasts.value).toHaveLength(0)
  })

  it('removes a toast that is closed before it mounts', async () => {
    const onRemove = vi.fn()
    const { api } = mountToaster()
    const id = api.add({ title: 'Never seen', onRemove })
    api.close(id)
    await flush()

    expect(api.toasts.value).toHaveLength(0)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('updates an open toast and ignores updates once it is closing', async () => {
    const { api } = mountToaster()
    const id = api.add({ title: 'Uploading' })
    await flush()

    api.update(id, prev => ({ title: `${prev.title} 50%` }))
    await flush()
    expect(getToast(id)!.textContent).toContain('Uploading 50%')
    expect(api.toasts.value[0].updateKey).toBe(1)

    const onRemove = vi.fn()
    api.update(id, { onRemove })
    api.close(id)
    api.update(id, { title: 'Too late' })
    await flush()
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(api.toasts.value).toHaveLength(0)
  })

  it('updates the toast in place and restarts its timer when added again with the same id', async () => {
    vi.useFakeTimers()
    const { api } = mountToaster({ duration: 1000 })
    api.add({ id: 'sync', title: 'Syncing 1' })
    await flush()

    vi.advanceTimersByTime(800)
    api.add({ id: 'sync', title: 'Syncing 2' })
    await flush()
    expect(api.toasts.value).toHaveLength(1)
    expect(getToast('sync')!.textContent).toContain('Syncing 2')

    // Without the restart, the toast would close 200ms from now.
    vi.advanceTimersByTime(500)
    await flush()
    expect(api.toasts.value[0].open).toBe(true)

    vi.advanceTimersByTime(600)
    await flush()
    expect(api.toasts.value).toHaveLength(0)
  })

  it('does not restart the timer on a plain update', async () => {
    vi.useFakeTimers()
    const { api } = mountToaster({ duration: 1000 })
    const id = api.add({ title: 'Syncing' })
    await flush()

    vi.advanceTimersByTime(800)
    api.update(id, { title: 'Still syncing' })
    await flush()
    vi.advanceTimersByTime(300)
    await flush()
    expect(api.toasts.value).toHaveLength(0)
  })

  it('shows a loading toast that turns into a success toast', async () => {
    vi.useFakeTimers()
    const { api } = mountToaster({ duration: 1000 })
    let resolve!: (value: string) => void
    const result = api.promise(new Promise<string>((r) => {
      resolve = r
    }), {
      loading: 'Saving…',
      success: name => `Saved ${name}`,
      error: 'Could not save',
    })
    await flush()

    const id = api.toasts.value[0].id
    expect(getToast(id)!.dataset.status).toBe('loading')

    // Loading toasts are never dismissed automatically.
    vi.advanceTimersByTime(5000)
    await flush()
    expect(api.toasts.value[0].open).toBe(true)

    resolve('report.pdf')
    await expect(result).resolves.toBe('report.pdf')
    await flush()
    expect(getToast(id)!.dataset.status).toBe('success')
    expect(getToast(id)!.textContent).toContain('Saved report.pdf')

    vi.advanceTimersByTime(1100)
    await flush()
    expect(api.toasts.value).toHaveLength(0)
  })

  it('shows an error toast and rejects when the promise rejects', async () => {
    const { api } = mountToaster()
    const error = new Error('offline')
    const result = api.promise(Promise.reject(error), {
      loading: 'Saving…',
      success: 'Saved',
      error: err => ({ title: 'Failed', description: err.message }),
    })

    await expect(result).rejects.toBe(error)
    await flush()
    const toast = getToast(api.toasts.value[0].id)!
    expect(toast.dataset.status).toBe('error')
    expect(toast.textContent).toContain('Failed')
    expect(toast.textContent).toContain('offline')
  })

  it('announces a toast again when it is updated', async () => {
    const { api } = mountToaster()
    const id = api.add({ description: 'Saving…', status: 'loading' })
    await flush()
    api.update(id, { description: 'Saved', status: 'success' })
    await flush()

    // Announce text renders after two animation frames.
    await new Promise(resolve => setTimeout(resolve, 50))
    await flush()
    const alert = document.querySelector('[role="alert"]')!
    expect(alert.textContent).toContain('Saved')
    expect(alert.textContent).not.toContain('Saving')
  })

  it('renders actionProps and calls onClick', async () => {
    const onClick = vi.fn()
    const { api } = mountToaster()
    const id = api.add({
      title: 'Archived',
      actionProps: { label: 'Undo', altText: 'Undo archive', onClick },
    })
    await flush()

    const action = [...getToast(id)!.querySelectorAll('button')].find(button => button.textContent === 'Undo')!
    expect(action).toBeTruthy()
    await fireEvent.click(action)
    await flush()

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(api.toasts.value).toHaveLength(0)
  })

  it('keeps the toast open when actionProps.closeOnClick is false', async () => {
    const { api } = mountToaster()
    const id = api.add({
      title: 'Archived',
      actionProps: { label: 'Undo', altText: 'Undo archive', closeOnClick: false },
    })
    await flush()

    const action = [...getToast(id)!.querySelectorAll('button')].find(button => button.textContent === 'Undo')!
    await fireEvent.click(action)
    await flush()
    expect(api.toasts.value[0].open).toBe(true)
  })

  it('uses the toast type for the announcement politeness', async () => {
    const { api } = mountToaster()
    api.add({ title: 'Background sync', type: 'background' })
    await flush()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.querySelector('[role="alert"]')!.getAttribute('aria-live')).toBe('polite')
  })
})

describe('createToastManager', () => {
  it('adds toasts from outside components, including before the provider mounts', async () => {
    const manager = createToastManager()
    const early = manager.add({ title: 'Early' })

    const { api } = mountToaster({ toastManager: manager })
    await flush()
    expect(getToast(early)).toBeTruthy()

    const late = manager.add({ title: 'Late' })
    await flush()
    expect(api.toasts.value.map(toast => toast.id)).toEqual([late, early])

    manager.update(late, { title: 'Late (updated)' })
    manager.close(early)
    await flush()
    expect(getToast(late)!.textContent).toContain('Late (updated)')
    expect(api.toasts.value).toHaveLength(1)
  })

  it('stops listening when the provider unmounts', async () => {
    const manager = createToastManager()
    const { wrapper } = mountToaster({ toastManager: manager })
    await flush()
    wrapper.unmount()

    // Queued for the next provider instead of being sent to the unmounted one.
    const id = manager.add({ title: 'Queued' })
    mountToaster({ toastManager: manager })
    await flush()
    expect(getToast(id)).toBeTruthy()
  })

  it('resolves promise toasts', async () => {
    const manager = createToastManager()
    const { api } = mountToaster({ toastManager: manager })
    await flush()

    await expect(manager.promise(Promise.resolve(42), {
      loading: 'Counting…',
      success: value => `Counted ${value}`,
      error: 'Failed',
    })).resolves.toBe(42)
    await flush()
    expect(getToast(api.toasts.value[0].id)!.textContent).toContain('Counted 42')
  })
})

describe('stacking', () => {
  it('exposes the stack index and marks toasts beyond the limit', async () => {
    const { api } = mountToaster({ limit: 2 })
    const first = api.add({ title: 'First' })
    await flush()
    const second = api.add({ title: 'Second' })
    await flush()
    const third = api.add({ title: 'Third' })
    await flush()

    expect(getToast(third)!.style.getPropertyValue('--reka-toast-index')).toBe('0')
    expect(getToast(second)!.style.getPropertyValue('--reka-toast-index')).toBe('1')
    expect(getToast(first)!.style.getPropertyValue('--reka-toast-index')).toBe('2')

    expect(getToast(first)!.hasAttribute('data-limited')).toBe(true)
    expect(getToast(first)!.hasAttribute('inert')).toBe(true)
    expect(getToast(second)!.hasAttribute('data-limited')).toBe(false)

    // Closing the newest one brings the oldest back within the limit.
    api.close(third)
    await flush()
    expect(getToast(first)!.hasAttribute('data-limited')).toBe(false)
    expect(getToast(first)!.style.getPropertyValue('--reka-toast-index')).toBe('1')
  })

  it('applies to toasts rendered without the manager too', async () => {
    const wrapper = mount(defineComponent({
      render: () => h(ToastProvider, { limit: 1 }, () => [
        h(ToastRoot, { 'data-testid': 'a' }, () => 'A'),
        h(ToastRoot, { 'data-testid': 'b' }, () => 'B'),
        h(ToastViewport),
      ]),
    }), { attachTo: document.body })
    await flush()

    expect(getToast('b')!.style.getPropertyValue('--reka-toast-index')).toBe('0')
    expect(getToast('a')!.hasAttribute('data-limited')).toBe(true)
    wrapper.unmount()
  })

  it('sets data-expanded while the pointer is over the viewport', async () => {
    const { api } = mountToaster()
    const id = api.add({ title: 'Hover me' })
    await flush()

    const viewport = document.querySelector('ol')!
    expect(viewport.hasAttribute('data-expanded')).toBe(false)

    await fireEvent.pointerMove(viewport)
    await flush()
    expect(viewport.hasAttribute('data-expanded')).toBe(true)
    expect(getToast(id)!.hasAttribute('data-expanded')).toBe(true)

    await fireEvent.pointerLeave(viewport)
    await flush()
    expect(viewport.hasAttribute('data-expanded')).toBe(false)
  })
})

describe('toastPositioner', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  it('renders an anchored toast inside the positioner instead of the viewport list', async () => {
    const anchor = document.createElement('button')
    document.body.appendChild(anchor)

    const { api } = mountToaster({
      render: toast => h(ToastPositioner, { key: toast.id, toast, class: 'positioner' }, () =>
        h(ToastRoot, { 'toast': toast, 'data-testid': toast.id }, () => [h(ToastArrow), h(ToastTitle)])),
    })
    const id = api.add({ title: 'Copied', positionerProps: { anchor, side: 'bottom' } })
    await flush()

    const toast = getToast(id)!
    expect(toast.closest('.positioner')).toBeTruthy()
    expect(toast.closest('ol')).toBeNull()
    expect(toast.closest('.positioner')!.getAttribute('data-side')).toBe('bottom')
    expect(toast.querySelector('svg')).toBeTruthy()
  })

  it('works inside the viewport, as in the docs example', async () => {
    const anchor = document.createElement('button')
    document.body.appendChild(anchor)

    let api!: UseToastManagerReturn
    const AnchoredToaster = defineComponent({
      setup() {
        api = useToastManager()
        return () => h(ToastViewport, { as: 'div' }, () => api.toasts.value.map(toast =>
          h(ToastPositioner, { key: toast.id, toast, sideOffset: 8, class: 'positioner' }, () =>
            h(ToastRoot, { 'toast': toast, 'as': 'div', 'data-testid': toast.id }, () => [h(ToastTitle), h(ToastArrow)]))))
      },
    })
    const wrapper = mount(defineComponent({
      render: () => h(ToastProvider, null, () => h(AnchoredToaster)),
    }), { attachTo: document.body })

    const id = api.add({ title: 'Copied', positionerProps: { anchor } })
    await flush()

    const toast = getToast(id)!
    expect(toast.textContent).toContain('Copied')
    expect(toast.closest('.positioner')!.getAttribute('data-side')).toBe('top')
    expect(await axe(wrapper.element)).toHaveNoViolations()

    api.close(id)
    await flush()
    expect(api.toasts.value).toHaveLength(0)
    expect(document.querySelector('.positioner')).toBeNull()
  })
})
