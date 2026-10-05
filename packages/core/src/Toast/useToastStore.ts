import type { ShallowRef } from 'vue'
import type { ToastAddOptions, ToastManager, ToastObject, ToastUpdateOptions } from './createToastManager'
import { reactive, shallowRef } from 'vue'
import { generateToastId, runToastPromise } from './createToastManager'

export interface ToastStore extends ToastManager {
  /** Toasts in the list, newest first. */
  toasts: ShallowRef<ToastObject[]>
  /** Removes a closed toast from the list, after its exit animation. */
  remove: (id: string) => void
  /** Increments when a toast is added again with the same `id`, to restart its dismiss timer. */
  getRestartKey: (id: string) => number
}

export function useToastStore(): ToastStore {
  const toasts = shallowRef<ToastObject[]>([])
  const restartKeys = reactive(new Map<string, number>())

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

  function close(id?: string) {
    const closing = toasts.value.filter(toast => toast.open && (id === undefined || toast.id === id))
    if (!closing.length)
      return

    toasts.value = toasts.value.map(toast => closing.includes(toast) ? { ...toast, open: false } : toast)
    closing.forEach(toast => toast.onClose?.())
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
  }
}
