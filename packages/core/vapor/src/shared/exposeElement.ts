// In VDOM, a template ref on a component is its public instance, so `ref.$el` (and VueUse's
// `unrefElement`) always reaches the root element. In Vapor a component ref is only its *exposed*
// object, an empty proxy unless the component exposes something. reka resolves DOM nodes through
// component refs in many places (`usePrimitiveElement`, `unrefElement(componentRef)`), so the Vapor
// build gives every SFC a default `$el` expose. It is injected at the top of each compiled `setup`
// (`vapor/vite.config.mjs`); an explicit `defineExpose` / `useForwardExpose` later replaces it.
import { findElement, getExposed, getGenericInstance, setExposed } from './internals'

export function exposeElement() {
  const instance = getGenericInstance()
  if (instance && !getExposed(instance)) {
    setExposed(instance, {
      get $el() {
        return findElement(instance.block)
      },
    })
  }
}

/**
 * `defineExpose(obj)` replaces the default expose above, which drops `$el` (a ListboxRoot ref then
 * resolves to the expose proxy instead of an element). The build rewrites the compiled
 * `__expose(obj)` to `exposeWithElement(__expose, obj)`, which keeps a `$el` getter on `obj`.
 */
export function exposeWithElement(expose: (exposed: Record<string, any>) => void, exposed: Record<string, any> = {}) {
  const instance = getGenericInstance()
  // Drop the default expose first: Vue warns when `expose()` finds one already set
  if (instance)
    setExposed(instance, null)
  if (instance && !('$el' in exposed)) {
    Object.defineProperty(exposed, '$el', {
      configurable: true,
      get: () => findElement(instance.block),
    })
  }
  expose(exposed)
}
