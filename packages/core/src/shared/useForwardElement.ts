import type { ComponentInternalInstance, ComponentPublicInstance, ComputedRef, Ref, ShallowRef } from 'vue'
import type { MergeableRef } from './useMergedRefs'
import { computed, getCurrentInstance, onScopeDispose, shallowRef, watch } from 'vue'
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
   * Same computed as `element`, typed non-null for drop-in compatibility with
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
  element: Readonly<Ref<E | null>>,
): ElementExpose<E> {
  const instance = getCurrentInstance()
  const exposed: ElementExpose<E> = {
    element,
    get $el() {
      return element.value ?? instance?.vnode.el as Node | null
    },
  }
  // Uses process.env.NODE_ENV (not import.meta.env.DEV, which is neutered in dist).
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production' && instance)
    return createDevExpose(exposed, instance)
  return exposed
}

/**
 * Adds a part's documented methods/state to its element expose object, keeping
 * the dev-only prop-read warning (a `{ ...expose }` spread would drop it).
 *
 * @example
 * defineExpose(mergeExpose(expose, { focus }))
 */
export function mergeExpose<T extends ElementExpose<any>, X extends object>(expose: T, extra: X): T & X {
  return Object.assign(expose, extra)
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
  // Store the RAW ref value and resolve lazily: reading a conforming child's
  // exposed `element` inside the computed is tracked, so a root swap inside the
  // child re-resolves here even though Vue never re-invokes our ref callback.
  const currentRef = shallowRef<unknown>(null)
  const element = computed(() => resolveRefTarget<E>(currentRef.value))

  const merged = useMergedRefs<E>(...refs)
  if (merged) {
    watch(element, merged, { flush: 'sync' })
    // On unmount the scope stops before the subtree's refs are nulled, so the
    // watcher never sees the detach: clear the extra refs (and run their
    // cleanups) here.
    onScopeDispose(() => merged(null))
  }

  function forwardRef(el: Element | ComponentPublicInstance | null) {
    currentRef.value = el
  }

  return {
    forwardRef,
    currentRef,
    element,
    currentElement: element as ComputedRef<E>,
    expose: createElementExpose(element),
  }
}
