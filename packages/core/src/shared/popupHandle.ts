import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef, WatchStopHandle } from 'vue'
import type { SetStateOptions } from './useControllableState'
import { computed, markRaw, onBeforeUnmount, onMounted, shallowReactive, shallowRef, toValue, watch } from 'vue'

// =============================================================================
// Detached triggers (#2826), modelled on Base UI's `createHandle()`
// (mui/base-ui `packages/react/src/utils/popups/popupHandle.ts`).
//
// A handle is a thin, family-agnostic link between ONE mounted Root and any
// number of Triggers rendered anywhere in the app (outside the Root, across
// portals). It owns no open state of its own:
//
// - the Root owns the state (open model, active trigger, payload) in a
//   `PopupRootStore` and attaches that store to the handle while it is mounted;
// - Triggers register `{ id, element, payload }` in the handle and read the
//   attached store to render `aria-expanded` / `aria-controls` and to toggle.
//
// Both attach and register happen in `onMounted`, which never runs during SSR,
// so a handle created at module scope cannot carry state from one server
// request into another: on the server it is always empty and reads closed.
// =============================================================================

/**
 * Structural equality for payloads (plain objects and arrays, compared
 * recursively; anything else by identity). Small on purpose: Popover and
 * Dialog bundles do not otherwise pull in a deep-equal dependency.
 */
function isSamePayload(a: unknown, b: unknown): boolean {
  if (Object.is(a, b))
    return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b))
    return false
  const proto = Object.getPrototypeOf(a)
  if (proto !== Object.getPrototypeOf(b) || (proto !== Object.prototype && proto !== Array.prototype && proto !== null))
    return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length
    && keys.every(key => Object.hasOwn(b, key) && isSamePayload((a as any)[key], (b as any)[key]))
}

/** What a Trigger registers in a handle. */
export interface PopupHandleTrigger<Payload = unknown> {
  /** The trigger's id (its DOM `id`), the key `handle.open(triggerId)` resolves. */
  readonly id: string
  readonly element: () => HTMLElement | undefined
  readonly payload: () => Payload | undefined
}

/** A pointer-free stand-in for an unmounted trigger, so the popup stays where it was. */
export interface PopupHandleVirtualAnchor {
  getBoundingClientRect: () => DOMRect
}

/**
 * The Root-side state a Root attaches to its handle. Created per Root instance
 * by `createPopupRootStore()`.
 */
export interface PopupRootStore<Payload = unknown> {
  /** The handle the Root uses (its `handle` prop), if any. */
  readonly handle: ComputedRef<PopupHandle<Payload> | undefined>
  readonly open: Readonly<Ref<boolean>>
  /** The popup's id, which the active trigger's `aria-controls` points at. */
  readonly contentId: string | undefined
  /** The trigger that opened (or last opened) the popup. Kept after close so focus returns to it. */
  readonly activeTriggerId: ComputedRef<string | null>
  readonly activeTriggerElement: ComputedRef<HTMLElement | undefined>
  /** What the popup anchors to: the active trigger, or its last box once it unmounted. */
  readonly anchor: ComputedRef<HTMLElement | PopupHandleVirtualAnchor | undefined>
  /** The active trigger's `payload`, or the one passed to `openWithPayload()`. */
  readonly payload: ComputedRef<Payload | undefined>
  /** Whether the popup is open and owned by the trigger with this id. */
  isOpenedBy: (triggerId: string) => boolean
  /** Whether `target` is inside any trigger registered with the handle. */
  containsTrigger: (target: Node | null | undefined) => boolean
  /**
   * A press on the trigger with `triggerId`. On the open popup's own trigger it
   * closes (`toggle`) or does nothing (`open`); on any other trigger it opens
   * the popup, or moves an open popup to that trigger without closing it.
   */
  pressTrigger: (triggerId: string, mode: 'toggle' | 'open', reason?: string, event?: Event) => boolean
  /** Opens (or re-targets) the popup for `triggerId`, or for no trigger when `null`. */
  openPopup: (triggerId: string | null, reason?: string, event?: Event, payload?: { value: Payload }) => boolean
  closePopup: (reason?: string, event?: Event) => boolean
  /** Called by the handle before an active trigger unregisters (internal). */
  onTriggerRemoved: (trigger: PopupHandleTrigger<Payload>) => void
}

/**
 * The shared implementation behind `createPopoverHandle()`,
 * `createDialogHandle()` and `createDropdownMenuHandle()`. Family handles only
 * narrow the public `open()` signature.
 */
export class PopupHandle<Payload = unknown> {
  /**
   * Triggers registered with this handle, by id.
   * @internal
   */
  readonly triggers: Map<string, PopupHandleTrigger<Payload>>
  /**
   * Stores of the mounted Roots using this handle, in attach order.
   * @internal
   */
  private readonly stores: ShallowRef<readonly PopupRootStore<Payload>[]>

  constructor(
    /** Used in dev warnings, e.g. `PopoverHandle.open()`. */
    protected readonly componentName: string,
    /** Anchored popups cannot open for a trigger id that is not registered. */
    protected readonly requireTrigger: boolean,
  ) {
    this.triggers = shallowReactive(new Map())
    this.stores = shallowRef([])
    // A handle is a plain object with reactive members; never proxy it (it is
    // often kept in a `ref`, and Root props hold it as-is).
    markRaw(this)
  }

  /**
   * The store of the Root that controls the handle (the most recently mounted one).
   * @internal
   */
  get store(): PopupRootStore<Payload> | null {
    const stores = this.stores.value
    return stores.at(-1) ?? null
  }

  /**
   * Called by a Root after it mounts. Returns the detach function.
   * @internal
   */
  attach(store: PopupRootStore<Payload>): () => void {
    this.stores.value = [...this.stores.value, store]
    return () => {
      this.stores.value = this.stores.value.filter(s => s !== store)
    }
  }

  /**
   * Called by a Trigger after it mounts. Returns the unregister function.
   * @internal
   */
  registerTrigger(trigger: PopupHandleTrigger<Payload>): () => void {
    this.triggers.set(trigger.id, trigger)
    return () => {
      if (this.triggers.get(trigger.id) !== trigger)
        return
      this.store?.onTriggerRemoved(trigger)
      this.triggers.delete(trigger.id)
    }
  }

  /**
   * Whether the popup is open. Reactive (read it in a template or `computed`);
   * `false` while no Root using this handle is mounted, and always on the server.
   */
  get isOpen(): boolean {
    return this.store?.open.value ?? false
  }

  /**
   * Closes the popup with reason `'imperative-action'`; cancellable through
   * the Root's `beforeUpdate:open`. Ignored while no Root is mounted.
   * Call it from an event handler or a watcher, not during render.
   */
  close(): void {
    const store = this.store
    if (!store) {
      this.warnDetached('close')
      return
    }
    store.closePopup('imperative-action')
  }

  /** @internal */
  protected openByTrigger(triggerId: string | null | undefined, payload?: { value: Payload }): void {
    const store = this.store
    if (!store) {
      this.warnDetached('open')
      return
    }
    let id = triggerId ?? null
    if (id !== null && !this.triggers.has(id)) {
      if (this.requireTrigger) {
        throw new Error(
          `[reka-ui] ${this.componentName}Handle.open() was called with the trigger id "${id}", `
          + 'but no trigger with that id is registered with this handle. An anchored popup '
          + `cannot open without a trigger to anchor to: pass the \`id\` of a mounted ${this.componentName}Trigger `
          + 'that has this handle on its `handle` prop.',
        )
      }
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production')
        console.warn(`[reka-ui] ${this.componentName}Handle.open(): no trigger with id "${id}". The popup opens without a trigger.`)
      id = null
    }
    store.openPopup(id, 'imperative-action', undefined, payload)
  }

  private warnDetached(method: string) {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[reka-ui] ${this.componentName}Handle.${method}() was called while no ${this.componentName}Root `
        + 'using this handle is mounted. The call was ignored.',
      )
    }
  }
}

export interface CreatePopupRootStoreOptions<Payload> {
  /** The Root's `handle` prop. */
  handle: MaybeRefOrGetter<PopupHandle<Payload> | undefined>
  open: Readonly<Ref<boolean>>
  /** The Root model's `setState` (from `useControllableState`). */
  setState: (value: boolean, reason?: any, event?: Event, options?: SetStateOptions) => boolean
  contentId?: string
  /** Controlled active trigger (the Root's `triggerId` prop); `undefined` = uncontrolled. */
  triggerId?: MaybeRefOrGetter<string | null | undefined>
  /** Active trigger when the Root mounts open (the Root's `defaultTriggerId` prop). */
  defaultTriggerId?: string | null
}

/**
 * The Root side of a handle: which trigger owns the popup, the payload, and
 * the open/switch/close requests. Pure (no lifecycle, no `document`); the Root
 * SFC attaches it with `usePopupHandleAttachment()`.
 *
 * @lifecycle pure
 */
export function createPopupRootStore<Payload>(options: CreatePopupRootStoreOptions<Payload>): PopupRootStore<Payload> {
  const { open, setState } = options
  const handle = computed(() => toValue(options.handle))
  const internalTriggerId = shallowRef<string | null>(options.defaultTriggerId ?? null)
  // An open request that deliberately carried no trigger (`open(null)`,
  // `openWithPayload()`) must not claim a lone registered trigger later.
  const openedWithoutTrigger = shallowRef(false)
  const payloadSnapshot = shallowRef<Payload>()
  const lastAnchor = shallowRef<PopupHandleVirtualAnchor>()

  const triggers = () => handle.value?.triggers

  const activeTriggerId = computed<string | null>(() => {
    const controlled = toValue(options.triggerId)
    if (controlled !== undefined)
      return controlled
    if (internalTriggerId.value !== null)
      return internalTriggerId.value
    // Opened without naming a trigger (`defaultOpen`, controlled `open`) while
    // exactly one trigger is registered: that trigger owns the popup (Base UI).
    const registered = triggers()
    if (open.value && !openedWithoutTrigger.value && registered?.size === 1)
      return registered.keys().next().value ?? null
    return null
  })
  const activeTrigger = computed(() => {
    const id = activeTriggerId.value
    return id === null ? undefined : triggers()?.get(id)
  })
  const activeTriggerElement = computed(() => activeTrigger.value?.element())
  const anchor = computed(() => activeTriggerElement.value ?? lastAnchor.value)
  // Structurally stable: a trigger rendered inside the Root's slot with an
  // inline `:payload="{ ... }"` gets a new object on every slot render, which
  // must not re-render the slot (and recreate the object) again.
  const payload = computed<Payload | undefined>((previous) => {
    const trigger = activeTrigger.value
    const next = trigger ? trigger.payload() : payloadSnapshot.value
    return previous !== undefined && isSamePayload(previous, next) ? previous : next
  })

  function triggerElement(id: string | null) {
    return id === null ? undefined : triggers()?.get(id)?.element()
  }

  function openPopup(triggerId: string | null, reason?: string, event?: Event, payloadBox?: { value: Payload }): boolean {
    const previous = [internalTriggerId.value, openedWithoutTrigger.value, payloadSnapshot.value, lastAnchor.value] as const
    internalTriggerId.value = triggerId
    openedWithoutTrigger.value = triggerId === null
    payloadSnapshot.value = triggerId === null ? payloadBox?.value : undefined
    lastAnchor.value = undefined
    // Already open: re-target without closing. Base UI reports this as another
    // `onOpenChange(true)`, so `beforeUpdate:open` can still cancel the switch.
    const accepted = setState(true, reason, event, { trigger: triggerElement(triggerId), force: open.value })
    if (!accepted)
      [internalTriggerId.value, openedWithoutTrigger.value, payloadSnapshot.value, lastAnchor.value] = previous
    return accepted
  }

  function closePopup(reason?: string, event?: Event): boolean {
    return setState(false, reason, event, { trigger: activeTriggerElement.value })
  }

  return {
    handle,
    open,
    contentId: options.contentId,
    activeTriggerId,
    activeTriggerElement,
    anchor,
    payload,
    isOpenedBy: triggerId => open.value && activeTriggerId.value === triggerId,
    containsTrigger: (target) => {
      if (!target)
        return false
      for (const trigger of triggers()?.values() ?? []) {
        if (trigger.element()?.contains(target))
          return true
      }
      return false
    },
    pressTrigger(triggerId, mode, reason, event) {
      if (open.value && activeTriggerId.value === triggerId)
        return mode === 'toggle' ? closePopup(reason, event) : false
      return openPopup(triggerId, reason, event)
    },
    openPopup,
    closePopup,
    onTriggerRemoved(trigger) {
      if (activeTriggerId.value !== trigger.id)
        return
      // Keep what the popup shows and where it sits once its trigger is gone.
      payloadSnapshot.value = trigger.payload()
      const element = trigger.element()
      if (open.value && element) {
        const rect = element.getBoundingClientRect()
        lastAnchor.value = { getBoundingClientRect: () => rect }
      }
    },
  }
}

/**
 * Attaches a Root's store to its `handle` for the Root's mounted lifetime
 * (re-attaching when the prop changes). Client-only by construction:
 * `onMounted` never runs during SSR.
 *
 * @lifecycle setup
 */
export function usePopupHandleAttachment<Payload>(store: PopupRootStore<Payload>): void {
  let detach: (() => void) | undefined
  let stop: WatchStopHandle | undefined
  onMounted(() => {
    stop = watch(store.handle, (handle) => {
      detach?.()
      detach = handle?.attach(store)
    }, { immediate: true })
  })
  onBeforeUnmount(() => {
    stop?.()
    detach?.()
    detach = undefined
  })
}

/** Root context object -> that Root's store (each family keys it by its own Root context). */
const rootStores = new WeakMap<object, PopupRootStore<any>>()

/**
 * Links a Root's store to the family Root context it provides, so the parts
 * that inject that context (in-tree Triggers, Content) can reach the store
 * without widening the context's frozen shape.
 */
export function setPopupRootStore(context: object, store: PopupRootStore<any>): void {
  rootStores.set(context, store)
}

/** The store linked to a family Root context, if any. */
export function getPopupRootStore(context: object | null | undefined): PopupRootStore<any> | undefined {
  return context ? rootStores.get(context) : undefined
}

export interface UsePopupHandleTriggerOptions<Payload> {
  /** The Trigger's own `handle` prop. */
  handle: MaybeRefOrGetter<PopupHandle<Payload> | undefined>
  /** The enclosing family Root context, when the Trigger renders inside its Root. */
  rootContext: object | null | undefined
  /** The trigger id (its DOM `id`). */
  id: string
  element: Ref<HTMLElement | undefined>
  payload: MaybeRefOrGetter<Payload | undefined>
}

export interface UsePopupHandleTriggerReturn {
  /** Whether this trigger is wired through a handle (its own, or its Root's). */
  enabled: ComputedRef<boolean>
  /** The attached Root's store; `null` while no Root is mounted (and on the server). */
  store: ComputedRef<PopupRootStore<any> | null>
  /** Open and owned by this trigger: drives `aria-expanded` / `data-state`. */
  open: ComputedRef<boolean>
  /** `aria-controls` target while this trigger owns the open popup. */
  contentId: ComputedRef<string | undefined>
}

/**
 * The Trigger side of a handle: registers the trigger (client-only, from
 * `onMounted`) and derives its per-trigger open state from the attached Root.
 * A Trigger without its own `handle` joins the handle of an enclosing Root.
 *
 * @lifecycle setup
 */
export function usePopupHandleTrigger<Payload>(options: UsePopupHandleTriggerOptions<Payload>): UsePopupHandleTriggerReturn {
  const rootStore = getPopupRootStore(options.rootContext)
  const handle = computed(() => toValue(options.handle) ?? rootStore?.handle.value)
  const store = computed(() => handle.value?.store ?? null)
  const open = computed(() => store.value?.isOpenedBy(options.id) ?? false)

  const entry: PopupHandleTrigger<Payload> = {
    id: options.id,
    element: () => options.element.value,
    payload: () => toValue(options.payload),
  }
  let unregister: (() => void) | undefined
  let stop: WatchStopHandle | undefined
  onMounted(() => {
    stop = watch(handle, (next) => {
      unregister?.()
      unregister = next?.registerTrigger(entry)
    }, { immediate: true })
  })
  onBeforeUnmount(() => {
    stop?.()
    unregister?.()
    unregister = undefined
  })

  return {
    enabled: computed(() => !!handle.value),
    store,
    open,
    contentId: computed(() => open.value ? store.value?.contentId : undefined),
  }
}
