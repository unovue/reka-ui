import type { Ref } from 'vue'
import type { ToastManager, ToastObject } from './createToastManager'
import { injectToastProviderContext } from './ToastProvider.vue'

export interface UseToastManagerReturn<Data extends object = any> extends ToastManager<Data> {
  /** The toasts of the nearest `ToastProvider`, newest first. */
  toasts: Readonly<Ref<ToastObject<Data>[]>>
}

/**
 * Returns the toasts of the nearest `ToastProvider` and methods to manage them.
 */
export function useToastManager<Data extends object = any>(): UseToastManagerReturn<Data> {
  const { toastStore } = injectToastProviderContext()

  return {
    toasts: toastStore.toasts as Readonly<Ref<ToastObject<Data>[]>>,
    add: toastStore.add,
    close: toastStore.close,
    update: toastStore.update,
    promise: toastStore.promise,
  }
}
