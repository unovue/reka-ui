import type { ShallowRef } from 'vue'
import type { ToastAddOptions, ToastManager, ToastObject, ToastUpdateOptions } from './createToastManager'
import type { ToastOpenChangeReason } from './useToast'
import type { ChangeEventDetails } from '@/shared'
import { reactive, shallowRef } from 'vue'
import { createChangeEventDetails } from '@/shared'
import { generateToastId, runToastPromise } from './createToastManager'

export interface ToastStore extends ToastManager {
  /** Toasts in the list, newest first. */
  toasts: ShallowRef<ToastObject[]>
  /** Removes a closed toast from the list, after its exit animation. */
  remove: (id: string) => void
  /** Increments when a toast is added again with the same `id`, to restart its dismiss timer. */
  getRestartKey: (id: string) => number
  /**
   * Marks a toast closed and calls its `onClose(details)`. Called by the
   * `ToastRoot` rendering the toast once its close has committed (after
   * `beforeUpdate:open` / `update:open`).
   * @internal
   */
  commitClose: (id: string, details: ChangeEventDetails<ToastOpenChangeReason>) => void
  /**
   * Registers the close request of the `ToastRoot` rendering a toast, so
   * `close(id)` asks that root (`beforeUpdate:open`, cancellable, then
   * `update:open` with `'imperative-action'`) instead of closing the toast
   * behind its back. Returns the unregister function.
   * @internal
   */
  registerCloseRequest: (id: string, request: (reason: 'imperative-action') => boolean) => () => void
}

export function useToastStore(): ToastStore {
  const toasts = shallowRef<ToastObject[]>([])
  const restartKeys = reactive(new Map<string, number>())
  const closeRequests = new Map<string, (reason: 'imperative-action') => boolean>()

  function find(id: string) {
    return toasts.value.find(toast => toast.id === id)
  }

  function replace(id: string, next: ToastObject) {
    toasts.value = toasts.value.map(toast => toast.id === id ? next : toast)
  }

  function remove(id: string) {
    const toast = find(id)
    if (!toast || toast.open)
      return

    toasts.value = toasts.value.filter(item => item.id !== id)
    restartKeys.delete(id)
    toast.onRemove?.()
  }

  function add(options: ToastAddOptions): string {
    const id = options.id ?? generateToastId()
    const existing = find(id)

    if (existing?.open) {
      const { id: _id, ...updates } = options
      replace(id, { ...existing, ...updates, updateKey: existing.updateKey + 1 })
      restartKeys.set(id, (restartKeys.get(id) ?? 0) + 1)
      return id
    }

    // A closing toast that is added again starts a new lifecycle at the front of the list.
    const rest = existing ? toasts.value.filter(toast => toast.id !== id) : toasts.value
    toasts.value = [{ ...options, id, open: true, updateKey: 0 }, ...rest]
    return id
  }

  function commitClose(id: string, details: ChangeEventDetails<ToastOpenChangeReason>) {
    const toast = find(id)
    if (!toast?.open)
      return
    replace(id, { ...toast, open: false })
    toast.onClose?.(details)
  }

  function close(id?: string) {
    const closing = toasts.value.filter(toast => toast.open && (id === undefined || toast.id === id))
    closing.forEach((toast) => {
      const request = closeRequests.get(toast.id)
      // A rendered toast closes through its `ToastRoot`, which may cancel it;
      // one that is not rendered (yet) closes directly.
      if (request)
        request('imperative-action')
      else
        commitClose(toast.id, createChangeEventDetails<ToastOpenChangeReason>('imperative-action'))
    })
  }

  function registerCloseRequest(id: string, request: (reason: 'imperative-action') => boolean) {
    closeRequests.set(id, request)
    return () => {
      if (closeRequests.get(id) === request)
        closeRequests.delete(id)
    }
  }

  function update(id: string, updates: ToastUpdateOptions | ((prevToast: ToastObject) => ToastUpdateOptions)) {
    const prevToast = find(id)
    // Ignore updates to closing toasts, so a late promise result cannot reopen one.
    if (!prevToast?.open)
      return

    const patch = typeof updates === 'function' ? updates(prevToast) : updates
    const current = find(id)
    if (!current?.open)
      return

    replace(id, { ...current, ...patch, id, open: true, updateKey: current.updateKey + 1 })
  }

  return {
    toasts,
    add,
    close,
    update,
    promise: (promise, options) => runToastPromise(promise, options, add, update),
    remove,
    getRestartKey: id => restartKeys.get(id) ?? 0,
    commitClose,
    registerCloseRequest,
  }
}
