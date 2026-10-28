import type { ComponentInternalInstance, ComponentPublicInstance, ComputedRef, Ref, ShallowRef } from 'vue'
import type { MergeableRef } from './useMergedRefs'
import { getCurrentInstance, onScopeDispose, shallowRef, watch } from 'vue'
import { resolveRefTarget, useMergedRefs } from './useMergedRefs'

/**
 * The element-first ref/expose contract every reka part satisfies (#2808):
 * `defineExpose({ element, $el })`, both keys reading ONE reactive element ref.
 *
 * - `element` is the conformance marker `resolveRefTarget` keys on (aligned with
 *   Base UI). It is strictly an element: `null` whenever the part renders none.
 * - `$el` shadows Vue's builtin snapshot (exposed keys are looked up before
 *   `publicPropertiesMap`), so `partRef.value.$el` stays the familiar surface and
 *   becomes reactive — VueUse `unrefElement` and floating-ui keep working. When
 *   the part renders no element it falls back to Vue's own `$el` (the placeholder
 *   comment), as in v2, so `unrefElement` never returns the component proxy.
 *
 * Both are auto-unwrapped by the expose proxy, so consumers read
 * `partRef.value.element` / `partRef.value.$el` without `.value`.
 */
export interface ElementExpose<E extends Element = HTMLElement> {
  /** The part's rendered DOM element; reactive across root swaps. */
  element: Readonly<Ref<E | null>>
  /**
   * `element`, shadowing Vue's builtin (non-reactive) `$el`; falls back to the
   * placeholder node Vue renders when the part has no element (v2 parity).
   */
  readonly $el: E | Node | null
}

export interface UseForwardElementReturn<E extends Element = HTMLElement> {
  /** Callback ref — bind on the part's root: `:ref="forwardRef"`. */
  forwardRef: (el: Element | ComponentPublicInstance | null) => void
  /** The raw template-ref value (element or child component proxy). */
  currentRef: ShallowRef<unknown>
  /** The resolved DOM element (text/comment-root aware, reactive through conforming children). */
  element: ComputedRef<E | null>
  /**
   * Same ref as `element`, typed non-null for drop-in compatibility with
   * `useForwardExpose().currentElement`. It is `null` until mounted.
   */
  currentElement: ComputedRef<E>
  /** Ready-made expose object: `defineExpose(expose)` or `defineExpose(mergeExpose(expose, { … }))`. */
  expose: ElementExpose<E>
}

let warnedPropReads: Set<string> | undefined

function componentName(instance: ComponentInternalInstance) {
  const type = instance.type as { __name?: string, name?: string }
  return type.name || type.__name || 'Anonymous'
}

/**
 * Dev-only: a part ref no longer forwards props, so `partRef.value.disabled`
 * silently becomes `undefined`. The proxy reports prop keys as present so the
 * expose proxy's `key in exposed` check routes the read here, and warns once
 * per component + key. Eliminated from production builds with its caller.
 */
function createDevExpose<T extends object>(exposed: T, instance: ComponentInternalInstance): T {
  const isPropRead = (target: object, key: string | symbol): key is string =>
    typeof key === 'string'
    && !(key in target)
    && Object.hasOwn(instance.props, key)

  return new Proxy(exposed, {
    has(target, key) {
      return Reflect.has(target, key) || isPropRead(target, key)
    },
    get(target, key, receiver) {
      if (isPropRead(target, key)) {
        const name = componentName(instance)
        const id = `${name}:${key}`
        warnedPropReads ??= new Set()
        if (!warnedPropReads.has(id)) {
          warnedPropReads.add(id)
          console.warn(
            `[reka-ui] <${name}>: reading the prop \`${key}\` off a component ref returns \`undefined\`. `
            + 'Part refs expose only `element`, `$el` and their documented methods; read the value from your own state instead. '
            + 'See https://reka-ui.com/docs/guides/migration-v3',
          )
        }
        return undefined
      }
      return Reflect.get(target, key, receiver)
    },
  })
}

/**
 * Builds the `{ element, $el }` expose object over an element ref. Call it in
 * `setup` (it reads the current instance for the dev-only prop-read warning).
 */
export function createElementExpose<E extends Element = HTMLElement>(
  element: Readonly<Ref<E | null>> | (() => Readonly<Ref<E | null>>),
): ElementExpose<E> {
  if (typeof element === 'function')
    return exposeElementSource<E>({ get element() { return element() } })
  return exposeElementSource<E>({ element }, element)
}

/** Anything with an `element` ref; `ElementSource` creates its ref on first read. */
interface ElementRefSource<E extends Element> {
  readonly element: Readonly<Ref<E | null>>
}

/**
 * Readonly ref views: `ElementSource` is the `element` ref itself, and
 * `ElRefView` is `$el`, which falls back to the placeholder node Vue rendered.
 * Reading `.value` resolves the source's element and is tracked; Vue's
 * expose proxy unwraps them like any ref.
 *
 * They are small classes rather than accessors on the expose object: an object
 * with own accessors is a dictionary-mode object in V8 (and each accessor a
 * closure), and the expose object exists once per rendered part. They also let
 * the source create its ref on first read.
 */
class ElRefView<E extends Element> {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  constructor(readonly source: ElementRefSource<E>, readonly instance: ComponentInternalInstance | null) {}
  get value(): E | Node | null {
    return this.source.element.value ?? this.instance?.vnode.el as Node | null
  }
}

function exposeElementSource<E extends Element>(
  source: ElementRefSource<E>,
  element: Readonly<Ref<E | null>> = source.element,
  instance: ComponentInternalInstance | null = getCurrentInstance(),
  linked = false,
): ElementExpose<E> {
  // Own data properties (the legacy `useForwardExpose` checks `Object.hasOwn(ref, '$el')`).
  // A linked part's expose is only ever read by its owner, for `element`
  // (see `linkToOwner`), so it skips the `$el` view and the dev proxy.
  const exposed = {
    element,
    $el: linked ? element : new ElRefView(source, instance),
  } as unknown as ElementExpose<E>
  // Uses process.env.NODE_ENV (not import.meta.env.DEV, which is neutered in dist).
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production' && instance && !linked)
    return createDevExpose(exposed, instance)
  return exposed
}

/**
 * Holds a part's raw template-ref value, and is itself the readonly `element`
 * ref over it. Its one reactive cell, the raw-value ref, is created on first
 * read: most parts only bind `forwardRef` and expose `element`, which usually
 * nothing reads. The ref starts from the raw value when it is created.
 *
 * `.value` resolves on every read rather than through a computed (one per part,
 * chained through every forwarding layer): the reader tracks the raw ref and,
 * through a conforming child's `element`, the child's own, so a root swap
 * inside the child still re-runs it even though Vue never re-invokes our ref
 * callback. Resolving is a couple of property reads.
 */
class ElementSource<E extends Element> implements ElementRefSource<E> {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  raw: unknown = null
  ref: ShallowRef<unknown> | undefined = undefined
  /** The callback ref handed to the template (`forwardRef`); bound, so it captures no scope. */
  forward: (el: unknown) => void = this.set.bind(this)
  /** A child part bound with `forward` that linked itself here (see `linkToOwner`). */
  linked: ComponentInternalInstance | null = null

  get currentRef(): ShallowRef<unknown> {
    return this.ref ??= shallowRef<unknown>(this.raw)
  }

  /** The resolved element (tracked: see above). */
  get value(): E | null {
    return resolveRefTarget<E>(this.currentRef.value)
  }

  get element(): Readonly<Ref<E | null>> {
    return this as unknown as Readonly<Ref<E | null>>
  }

  set(el: unknown) {
    const linked = this.linked
    if (linked && el !== null && isPublicInstanceOf(el, linked)) {
      // Vue hands us the linked child's plain public proxy (it has no expose
      // proxy); hold its expose object instead, which `resolveRefTarget`
      // reads `element` from, as it would through the expose proxy. A child
      // exposing no `element` keeps the public proxy (and its `$el`).
      const exposed = linked.exposed
      if (exposed && 'element' in exposed)
        el = exposed
    }
    else if (el === null) {
      // Detached: drop the link so an unmounted child is not retained.
      this.linked = null
    }
    this.raw = el
    if (this.ref)
      this.ref.value = el
  }
}

type LinkableInstance = ComponentInternalInstance & { exposeProxy: unknown }

/** Whether `el` is what Vue hands a template ref on `instance` (its expose or public proxy). */
function isPublicInstanceOf(el: unknown, instance: ComponentInternalInstance) {
  return el === (instance as LinkableInstance).exposeProxy || el === instance.proxy
}

/**
 * Links a part to its owner when its template ref is exactly the owner's
 * `forwardRef` (`<Child :ref="forwardRef">` inside another reka part).
 *
 * Vue builds an expose proxy (two `Proxy`s, a handler and two closures) the
 * first time a component's public instance is requested, which a template ref
 * on it always does. Parts nest several deep, so internal refs alone created
 * one per part. A linked child pre-sets its expose proxy to its plain public
 * proxy (which every component already has), and the owner, recognising that
 * proxy, reads the child's expose object directly: same `element`, same
 * tracking, no allocation.
 *
 * Any other ref (a consumer's ref, a merged `asChild` ref array, string or
 * object refs) gets the regular expose proxy, so the public contract is
 * unchanged.
 */
function linkToOwner(instance: ComponentInternalInstance | null): boolean {
  const vnodeRef = instance?.vnode.ref
  if (!instance || !vnodeRef || Array.isArray(vnodeRef))
    return false
  const owner = vnodeRef.i?.exposed as { element?: unknown } | null | undefined
  const ownerSource = owner?.element
  if (!(ownerSource instanceof ElementSource) || ownerSource.forward !== vnodeRef.r)
    return false
  ownerSource.linked = instance
  ;(instance as LinkableInstance).exposeProxy = instance.proxy
  return true
}

/**
 * Adds a part's documented methods/state to its element expose object, keeping
 * the dev-only prop-read warning (a `{ ...expose }` spread would drop it).
 * Accessors are copied as accessors, so `{ get x() { … } }` stays lazy.
 *
 * @example
 * defineExpose(mergeExpose(expose, { focus }))
 */
export function mergeExpose<T extends ElementExpose<any>, X extends object>(expose: T, extra: X): T & X {
  return Object.defineProperties(expose, Object.getOwnPropertyDescriptors(extra)) as T & X
}

/**
 * The part side of the element-first ref contract, built on `useMergedRefs`.
 * Replaces `useForwardExpose` — no `instance.exposed` mutation, no `onUpdated`
 * resync: the element is reactive state.
 *
 * @param refs Extra object/callback refs that should receive the resolved element.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { forwardRef, currentElement, expose } = useForwardElement()
 * defineExpose(expose)
 * </script>
 *
 * <template>
 *   <Primitive :ref="forwardRef" />
 * </template>
 * ```
 */
export function useForwardElement<E extends Element = HTMLElement>(
  ...refs: MergeableRef<E>[]
): UseForwardElementReturn<E> {
  // Store the RAW ref value and resolve lazily (see `ElementSource`).
  const source = new ElementSource<E>()
  const instance = getCurrentInstance()
  const linked = linkToOwner(instance)

  const merged = useMergedRefs<E>(...refs)
  if (merged) {
    watch(source as unknown as Readonly<Ref<E | null>>, merged, { flush: 'sync' })
    // On unmount the scope stops before the subtree's refs are nulled, so the
    // watcher never sees the detach: clear the extra refs (and run their
    // cleanups) here.
    onScopeDispose(() => merged(null))
  }

  // The source is a readonly ref resolving on read (its raw-value ref is created on
  // the first `.value`), so a part that destructures `currentElement` but never
  // reads it pays nothing.
  const element = source as unknown as ComputedRef<E | null>

  return {
    forwardRef: source.forward as (el: Element | ComponentPublicInstance | null) => void,
    get currentRef() { return source.currentRef },
    element,
    currentElement: element as ComputedRef<E>,
    expose: exposeElementSource(source, element, instance, linked),
  }
}
