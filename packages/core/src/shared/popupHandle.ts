import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import type { SetStateOptions } from './useControllableState'
import { computed, markRaw, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowReactive, shallowRef, toValue, watch } from 'vue'

// =============================================================================
// Detached triggers (#2826), modelled on Base UI's `createHandle()`
// (mui/base-ui `packages/react/src/utils/popups/popupHandle.ts`).
//
// A handle is a thin, family-agnostic link between ONE mounted Root and any
// number of Triggers rendered anywhere in the app (outside the Root, across
// portals). It owns no open state of its own:
//
// - the Root owns the state (open model, active trigger, payload) in a
//   `PopupRootStore` and attaches that store to the handle while it is mounted
//   and active (a `KeepAlive`d Root detaches while deactivated);
// - Triggers register `{ id, element, payload }` in the handle and read the
//   attached store to render `aria-expanded` / `aria-controls` and to toggle.
//
// Both attach and register happen in `onMounted` / `onActivated`, which never
// run during SSR, so a handle created at module scope cannot carry state from
// one server request into another: on the server it is empty and reads closed.
// =============================================================================

/** What a Trigger registers in a handle. */
export interface PopupHandleTrigger<Payload = unknown> {
  /** The trigger's id (its DOM `id`), the key `handle.open(triggerId)` resolves. */
  readonly id: string
  readonly element: () => HTMLElement | undefined
  /**
   * The trigger's payload as the Root sees it. A trigger outside the Root
   * keeps it in sync with its prop; a trigger rendered inside the Root's slot
   * only `capture()`s it when it takes the popup, because the slot recreates
   * an inline payload on every render and the Root must not re-render from it.
   */
  readonly payload: Readonly<ShallowRef<Payload | undefined>>
  /** Reads the trigger's current `payload` prop into `payload`. */
  readonly capture: () => void
}

/** A pointer-free stand-in for an unmounted trigger, so the popup stays where it was. */
export interface PopupHandleVirtualAnchor {
  getBoundingClientRect: () => DOMRect
}

/**
 * The Root-side state a Root attaches to its handle.
 *
 * `Payload` appears here (and in `PopupHandle`) only in read positions and in
 * method parameters, never as the parameter of a function-typed property, so a
 * handle is covariant in its payload: a `PopoverHandle<Item>` is assignable to
 * `PopoverHandle<unknown>`. That is the type a generic Root / Trigger falls
 * back to where its `Payload` cannot be inferred (e.g. `h(PopoverTrigger, …)`). Created per Root instance
 * by `createPopupRootStore()`.
 */
export interface PopupRootStore<Payload = unknown> {
  /** The handle the Root uses (its `handle` prop), if any. */
  readonly handle: ComputedRef<PopupHandle<Payload> | undefined>
  readonly open: Readonly<Ref<boolean>>
  /** The popup's id, which the active trigger's `aria-controls` points at. */
  readonly contentId: string | undefined
  /** Id an in-Root trigger without its own `id` uses when the Root gets a `handle` after mount. */
  readonly fallbackTriggerId: string
  /** The trigger that opened (or last opened) the popup. Kept after close so focus returns to it. */
  readonly activeTriggerId: ComputedRef<string | null>
  /** The active trigger's element while it is mounted. */
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
  openPopup: (triggerId: string | null, reason?: string, event?: Event, payload?: { value: unknown }) => boolean
  /**
   * Closes the popup. `trigger` is set only for a press on a trigger; other
   * closes (`handle.close()`, Escape, outside press, Close parts) carry none, as in Base UI.
   */
  closePopup: (reason?: string, event?: Event, trigger?: Element) => boolean
  /** Called by the handle before a trigger unregisters (internal). */
  onTriggerRemoved: (trigger: PopupHandleTrigger<unknown>) => void
  /** Called by a trigger whose `id` changed, so an open popup keeps its owner (internal). */
  onTriggerRenamed: (from: string, to: string) => void
  /**
   * Re-derives the implicit owner after the open state or the registered
   * triggers change: a popup opened without naming a trigger (`defaultOpen`, a
   * controlled `open`) while exactly one trigger is registered belongs to that
   * trigger (Base UI's `useImplicitActiveTrigger`). Internal.
   */
  reconcile: () => void
}

/**
 * The shared implementation behind `createPopoverHandle()`,
 * `createDialogHandle()`, `createAlertDialogHandle()` and
 * `createDropdownMenuHandle()`. Family handles only narrow the public `open()`
 * signature.
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
    /**
     * Anchored popups cannot open for a trigger id that is not registered.
     * @internal
     */
    readonly requireTrigger: boolean,
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
   * Called by a Root after it mounts (or is re-activated). Returns the detach function.
   * @internal
   */
  attach(store: PopupRootStore<Payload>): () => void {
    const previous = this.store
    this.stores.value = [...this.stores.value, store]
    if (previous) {
      // The newest Root takes the handle over (Base UI). The previous one is no
      // longer reachable through the handle or its triggers, so it must not
      // stay open behind triggers that now report the new Root's state.
      if (previous.open.value)
        previous.closePopup('none')
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production')
        this.warnOverlap()
    }
    store.reconcile()
    return () => {
      this.stores.value = this.stores.value.filter(s => s !== store)
    }
  }

  /**
   * Called by a Trigger after it mounts (or is re-activated). Returns the unregister function.
   * @internal
   */
  registerTrigger(trigger: PopupHandleTrigger<Payload>): () => void {
    this.triggers.set(trigger.id, trigger)
    this.store?.reconcile()
    return () => {
      if (this.triggers.get(trigger.id) !== trigger)
        return
      this.store?.onTriggerRemoved(trigger)
      this.triggers.delete(trigger.id)
      this.store?.reconcile()
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

  private warnOverlap() {
    // Deferred like Base UI's, so a clean hand-over (the outgoing Root
    // unmounting right after the incoming one mounts) does not warn.
    setTimeout(() => {
      if (this.stores.value.length > 1) {
        console.warn(
          `[reka-ui] A ${this.componentName}Handle is attached to more than one mounted root at the same time. `
          + 'The most recently mounted root takes over and the previous one is closed and stops being controlled by the handle. '
          + 'A handle should be used by a single root that stays mounted for the lifetime of the handle.',
        )
      }
    }, 0)
  }
}

export interface CreatePopupRootStoreOptions<Payload> {
  /** The Root's `handle` prop. */
  handle: MaybeRefOrGetter<PopupHandle<Payload> | undefined>
  open: Readonly<Ref<boolean>>
  /** The Root model's `setState` (from `useControllableState`). */
  setState: (value: boolean, reason?: any, event?: Event, options?: SetStateOptions) => boolean
  /** The Root's base id; the content id (`<baseId>-content`) and a fallback trigger id derive from it. */
  baseId: string
  /** The popup's current id, when a content `id` prop can replace `<baseId>-content`. */
  contentId?: MaybeRefOrGetter<string>
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
  let openedWithoutTrigger = false
  // The payload while no registered trigger owns the popup: from
  // `openWithPayload()`, or the last one of a trigger that unmounted.
  const payloadSnapshot = shallowRef<Payload>()
  const lastAnchor = shallowRef<PopupHandleVirtualAnchor>()

  const triggers = () => handle.value?.triggers

  const activeTriggerId = computed<string | null>(() => {
    const controlled = toValue(options.triggerId)
    return controlled !== undefined ? controlled : internalTriggerId.value
  })
  const activeTrigger = computed(() => {
    const id = activeTriggerId.value
    return id === null ? undefined : triggers()?.get(id)
  })
  const activeTriggerElement = computed(() => activeTrigger.value?.element())
  const anchor = computed(() => activeTriggerElement.value ?? lastAnchor.value)
  const payload = computed<Payload | undefined>(() => {
    const trigger = activeTrigger.value
    return trigger ? trigger.payload.value : payloadSnapshot.value
  })

  function setOwner(triggerId: string | null) {
    internalTriggerId.value = triggerId
    if (triggerId !== null)
      triggers()?.get(triggerId)?.capture()
  }

  function openPopup(triggerId: string | null, reason?: string, event?: Event, payloadBox?: { value: unknown }): boolean {
    const previous = [internalTriggerId.value, openedWithoutTrigger, payloadSnapshot.value, lastAnchor.value] as const
    setOwner(triggerId)
    openedWithoutTrigger = triggerId === null
    // The handle passes `openWithPayload()`'s argument, typed by the handle's `Payload`.
    payloadSnapshot.value = triggerId === null ? payloadBox?.value as Payload | undefined : undefined
    lastAnchor.value = undefined
    // Already open: re-target without closing. Base UI reports this as another
    // `onOpenChange(true)`, so `beforeUpdate:open` can still cancel the switch.
    const element = triggerId === null ? undefined : triggers()?.get(triggerId)?.element()
    const accepted = setState(true, reason, event, { trigger: element, force: open.value })
    if (!accepted)
      [internalTriggerId.value, openedWithoutTrigger, payloadSnapshot.value, lastAnchor.value] = previous
    return accepted
  }

  function closePopup(reason?: string, event?: Event, trigger?: Element): boolean {
    return setState(false, reason, event, trigger ? { trigger } : undefined)
  }

  return {
    handle,
    open,
    get contentId() { return toValue(options.contentId) ?? `${options.baseId}-content` },
    fallbackTriggerId: `${options.baseId}-trigger`,
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
        return mode === 'toggle' ? closePopup(reason, event, activeTriggerElement.value) : false
      return openPopup(triggerId, reason, event)
    },
    openPopup,
    closePopup,
    onTriggerRemoved(trigger) {
      if (activeTriggerId.value !== trigger.id)
        return
      if (!open.value) {
        // Nothing to keep for a closed popup: a later open must not inherit a
        // dead owner (and anchor to nothing).
        if (internalTriggerId.value === trigger.id)
          internalTriggerId.value = null
        payloadSnapshot.value = undefined
        lastAnchor.value = undefined
        return
      }
      // Keep what the popup shows and where it sits once its trigger is gone.
      // A trigger registered with this Root's handle carries this Root's `Payload`.
      payloadSnapshot.value = trigger.payload.value as Payload | undefined
      const element = trigger.element()
      if (element) {
        const rect = element.getBoundingClientRect()
        lastAnchor.value = { getBoundingClientRect: () => rect }
      }
    },
    onTriggerRenamed(from, to) {
      if (internalTriggerId.value === from)
        internalTriggerId.value = to
    },
    reconcile() {
      if (!open.value) {
        openedWithoutTrigger = false
        return
      }
      const registered = triggers()
      if (activeTriggerId.value !== null || openedWithoutTrigger || registered?.size !== 1)
        return
      setOwner(registered.keys().next().value ?? null)
    },
  }
}

/**
 * Runs `start` while the component is mounted and active, and its cleanup on
 * deactivation (`KeepAlive`) and unmount. Never runs during SSR.
 */
function useWhileActive(start: () => () => void): void {
  let stop: (() => void) | undefined
  const run = () => {
    stop ??= start()
  }
  const end = () => {
    stop?.()
    stop = undefined
  }
  onMounted(run)
  onActivated(run)
  onDeactivated(end)
  onBeforeUnmount(end)
}

/**
 * Attaches a Root's store to its `handle` while the Root is mounted and active
 * (re-attaching when the prop changes, detaching while a `KeepAlive` holds it
 * deactivated). Client-only by construction.
 *
 * @lifecycle setup
 */
export function usePopupHandleAttachment<Payload>(store: PopupRootStore<Payload>): void {
  useWhileActive(() => {
    let detach: (() => void) | undefined
    const stopHandle = watch(store.handle, (handle) => {
      detach?.()
      detach = handle?.attach(store)
    }, { immediate: true })
    const stopOpen = watch(store.open, () => store.reconcile())
    // A controlled `triggerId` hands the popup to another trigger: show its payload.
    const stopOwner = watch(store.activeTriggerId, id => id !== null && store.handle.value?.triggers.get(id)?.capture())

    let stopWarn = () => {}
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      const unanchored = () => !!store.handle.value?.requireTrigger && store.open.value && !store.anchor.value
      const warn = () => {
        if (unanchored()) {
          console.warn(
            '[reka-ui] A popup with a `handle` is open without a trigger to anchor to. With several triggers, '
            + 'name the one that owns it with `defaultTriggerId` (or `triggerId`), or open it with `handle.open(triggerId)`.',
          )
        }
      }
      nextTick(warn)
      stopWarn = watch(unanchored, value => value && warn(), { flush: 'post' })
    }

    return () => {
      stopHandle()
      stopOpen()
      stopOwner()
      stopWarn()
      detach?.()
    }
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
  /** The trigger's own `id` prop, if any. */
  attrId: MaybeRefOrGetter<string | undefined>
  /** The id the trigger generated for itself, if it drew one at setup. */
  generatedId?: string
  element: Ref<HTMLElement | undefined>
  payload: MaybeRefOrGetter<Payload | undefined>
}

export interface UsePopupHandleTriggerReturn {
  /** Whether this trigger is wired through a handle (its own, or its Root's). */
  enabled: ComputedRef<boolean>
  /** The trigger's id (and DOM `id`) while it is wired through a handle. */
  id: ComputedRef<string>
  /** The attached Root's store; `null` while no Root is mounted (and on the server). */
  store: ComputedRef<PopupRootStore<any> | null>
  /** Open and owned by this trigger: drives `aria-expanded` / `data-state`. */
  open: ComputedRef<boolean>
  /** `aria-controls` target while this trigger owns the open popup. */
  contentId: ComputedRef<string | undefined>
}

/**
 * The Trigger side of a handle: registers the trigger while it is mounted and
 * active (client-only) and derives its per-trigger open state from the
 * attached Root. A Trigger without its own `handle` joins the handle of an
 * enclosing Root, also when the Root gets its `handle` after mount.
 *
 * @lifecycle setup
 */
export function usePopupHandleTrigger<Payload>(options: UsePopupHandleTriggerOptions<Payload>): UsePopupHandleTriggerReturn {
  const rootStore = getPopupRootStore(options.rootContext)
  const handle = computed(() => toValue(options.handle) ?? rootStore?.handle.value)
  const store = computed(() => handle.value?.store ?? null)
  const id = computed(() => toValue(options.attrId) || options.generatedId || rootStore?.fallbackTriggerId || '')
  const open = computed(() => store.value?.isOpenedBy(id.value) ?? false)
  // Only a trigger outside the Root keeps its payload live; see `PopupHandleTrigger.payload`.
  const live = !options.rootContext

  useWhileActive(() => {
    let unregister: (() => void) | undefined
    let stopPayload = () => {}
    const stop = watch([handle, id], ([next, nextId], previous) => {
      stopPayload()
      unregister?.()
      unregister = undefined
      if (!next)
        return
      const previousId = previous?.[1]
      if (previousId && previousId !== nextId)
        next.store?.onTriggerRenamed(previousId, nextId)
      const payload = shallowRef<Payload | undefined>(toValue(options.payload))
      const capture = () => {
        payload.value = toValue(options.payload)
      }
      if (live)
        stopPayload = watch(() => toValue(options.payload), capture)
      unregister = next.registerTrigger({
        id: nextId,
        element: () => options.element.value,
        payload,
        capture,
      })
    }, { immediate: true })
    return () => {
      stop()
      stopPayload()
      unregister?.()
    }
  })

  return {
    enabled: computed(() => !!handle.value),
    id,
    store,
    open,
    contentId: computed(() => open.value ? store.value?.contentId : undefined),
  }
}
