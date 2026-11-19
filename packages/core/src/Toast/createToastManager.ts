import type { ReferenceElement } from '@floating-ui/vue'
import type { ToastPositionerProps } from './ToastPositioner.vue'
import { isClient } from '@vueuse/shared'

/**
 * The status of a toast. `loading` toasts are never dismissed automatically.
 * `promise()` sets `loading`, then `success` or `error`.
 */
export type ToastStatus = 'loading' | 'success' | 'error' | (string & {})

export interface ToastActionOptions {
  /** The text rendered inside `ToastAction` when it has no slot content. */
  label?: string
  /** A short description of an alternate way to carry out the action, for screen reader users. */
  altText: string
  /**
   * Whether the action should close the toast when clicked.
   * @defaultValue true
   */
  closeOnClick?: boolean
  /** Called when the action is clicked. */
  onClick?: (event: MouseEvent) => void
}

export interface ToastPositionerOptions extends Omit<ToastPositionerProps, 'toast' | 'anchor' | 'as' | 'asChild'> {
  /** The element to position the toast against. */
  anchor?: ReferenceElement | null
}

export interface ToastObject<Data extends object = any> {
  /** The unique identifier for the toast. */
  id: string
  /** Whether the toast is open. Closed toasts stay in the list until their exit animation ends. */
  open: boolean
  /** The title of the toast. Rendered by `ToastTitle` when it has no slot content. */
  title?: string
  /** The description of the toast. Rendered by `ToastDescription` when it has no slot content. */
  description?: string
  /**
   * The sensitivity of the toast for accessibility purposes. Overrides the `type` prop of `ToastRoot`.
   * `foreground` toasts are announced immediately, `background` toasts politely.
   */
  type?: 'foreground' | 'background'
  /** The status of the toast. Exposed as `data-status` on `ToastRoot`. */
  status?: ToastStatus
  /**
   * Time in milliseconds before the toast is dismissed automatically. Overrides
   * the `duration` of `ToastRoot` and `ToastProvider`. `0` or `Infinity` keeps it open.
   */
  duration?: number
  /** Props for `ToastAction` inside the toast. */
  actionProps?: ToastActionOptions
  /** Props for `ToastPositioner`, used to anchor the toast to an element. */
  positionerProps?: ToastPositionerOptions
  /** Custom data for the toast. */
  data?: Data
  /** Called when the toast is closed. */
  onClose?: () => void
  /** Called when the toast is removed from the list, after its exit animation. */
  onRemove?: () => void
  /** Increments whenever the toast is updated, or added again with the same `id`. */
  updateKey: number
}

export interface ToastAddOptions<Data extends object = any> extends Omit<ToastObject<Data>, 'id' | 'open' | 'updateKey'> {
  /**
   * The unique identifier for the toast. Adding a toast with an existing `id`
   * updates it in place and restarts its dismiss timer.
   */
  id?: string
}

export interface ToastUpdateOptions<Data extends object = any> extends Partial<Omit<ToastObject<Data>, 'id' | 'open' | 'updateKey'>> {}

type ToastPromiseState<Value, Data extends object>
  = | string
    | ToastUpdateOptions<Data>
    | ((value: Value) => string | ToastUpdateOptions<Data>)

export interface ToastPromiseOptions<Value, Data extends object = any> {
  loading: string | ToastAddOptions<Data>
  success: ToastPromiseState<Value, Data>
  error: ToastPromiseState<any, Data>
}

export interface ToastManager<Data extends object = any> {
  /** Adds a toast and returns its `id`. */
  add: <T extends Data = Data>(options: ToastAddOptions<T>) => string
  /** Closes the toast with the given `id`, or every toast when no `id` is given. */
  close: (id?: string) => void
  /** Updates an open toast. */
  update: <T extends Data = Data>(
    id: string,
    updates: ToastUpdateOptions<T> | ((prevToast: ToastObject<T>) => ToastUpdateOptions<T>),
  ) => void
  /** Shows a `loading` toast that turns into a `success` or `error` toast when the promise settles. */
  promise: <Value, T extends Data = Data>(
    promise: Promise<Value>,
    options: ToastPromiseOptions<Value, T>,
  ) => Promise<Value>
}

type ToastUpdater = ToastUpdateOptions | ((prevToast: ToastObject) => ToastUpdateOptions)

export type ToastManagerEvent
  = | { action: 'add', options: ToastAddOptions & { id: string } }
    | { action: 'close', id?: string }
    | { action: 'update', id: string, updates: ToastUpdater }

export const TOAST_MANAGER_SUBSCRIBE = Symbol('ToastManagerSubscribe')

export interface GlobalToastManager<Data extends object = any> extends ToastManager<Data> {
  /**
   * Used by `ToastProvider` to receive the manager's events.
   * @internal
   */
  [TOAST_MANAGER_SUBSCRIBE]: (listener: (event: ToastManagerEvent) => void) => () => void
}

let count = 0

export function generateToastId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return `reka-toast-${count}`
}

function resolvePromiseState<Value, Data extends object>(
  state: ToastPromiseState<Value, Data>,
  value?: Value,
): ToastUpdateOptions<Data> {
  const resolved = typeof state === 'function' ? state(value as Value) : state
  return typeof resolved === 'string' ? { description: resolved } : resolved
}

export function runToastPromise<Value, Data extends object>(
  promise: Promise<Value>,
  options: ToastPromiseOptions<Value, Data>,
  add: ToastManager<Data>['add'],
  update: ToastManager<Data>['update'],
): Promise<Value> {
  const loading = typeof options.loading === 'string' ? { description: options.loading } : options.loading
  const id = add({ ...loading, status: 'loading' })

  return promise.then(
    (value) => {
      update(id, { ...resolvePromiseState(options.success, value), status: 'success' })
      return value
    },
    (error) => {
      update(id, { ...resolvePromiseState(options.error, error), status: 'error' })
      throw error
    },
  )
}

/**
 * Creates a toast manager that can add toasts from anywhere, including outside components.
 * Pass it to the `toastManager` prop of `ToastProvider`.
 */
export function createToastManager<Data extends object = any>(): GlobalToastManager<Data> {
  const listeners = new Set<(event: ToastManagerEvent) => void>()
  // Toasts added before any `ToastProvider` has mounted are kept until one subscribes.
  // Only on the client: a module-level manager is shared between SSR requests.
  let pending: ToastManagerEvent[] = []

  function emit(event: ToastManagerEvent) {
    if (listeners.size === 0) {
      if (isClient)
        pending.push(event)
      return
    }
    listeners.forEach(listener => listener(event))
  }

  const manager: ToastManager<Data> = {
    add(options) {
      const id = options.id ?? generateToastId()
      emit({ action: 'add', options: { ...options, id } })
      return id
    },
    close(id) {
      emit({ action: 'close', id })
    },
    update(id, updates) {
      emit({ action: 'update', id, updates: updates as ToastUpdater })
    },
    promise(promise, options) {
      return runToastPromise(promise, options, manager.add, manager.update)
    },
  }

  return {
    ...manager,
    [TOAST_MANAGER_SUBSCRIBE](listener) {
      listeners.add(listener)
      const queued = pending
      pending = []
      queued.forEach(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
