// SPIKE: every Vue-internal the `reka-ui/vapor` entry touches goes through this file, so a change
// before 3.6 stable breaks in one place. Checked against vue@3.6.0-rc.16.
//
// Internal (not in the public types, may change without notice):
//   - `currentInstance`: the generic (VDOM or Vapor) instance during setup. Public
//     `getCurrentInstance()` returns `null` in Vapor; `getCurrentGenericInstance()` and
//     `useInstanceOption()` exist but are `@internal` too. Used for: forwarding `exposed`,
//     `scopeId`, `rawKeys()` (which props the parent passed), `type.props/emits`, `block`.
//   - Instance fields: `exposed` (assigned before the expose proxy is first read), `block`, `props`,
//     `scopeId`, `rawKeys()`, `vapor`, `type`.
//   - Block shape: `fragment.nodes`, `instance.block` (walked by `findElement`).
// Exported and typed, but compiler-output helpers rather than documented API:
//   `createSlot`, `createIf`, `createDynamicComponent`, `renderEffect`, `extend`, `isFragment`,
//   `isVaporComponent`, plus the slot/root flags (`4` FORWARDED, `1` SINGLE_ROOT, `{ _: 1 }`).
// Public and used where it is enough: `defineVaporComponent`, `defineVaporAsyncComponent`,
//   `hasInjectionContext` (Vapor-aware "inside a component?" check for the VueUse shims),
//   `useAttrs`, `useId`, lifecycle hooks, `onScopeDispose`.
import * as vue from 'vue'

export interface GenericInstance {
  vapor?: true
  type: { props?: Record<string, any>, emits?: string[] | Record<string, any>, __name?: string }
  props: Record<string, any>
  exposed: Record<string, any> | null
  block?: unknown
  scopeId?: string | null
  vnode?: { props?: Record<string, any> | null, scopeId?: string | null, el?: unknown }
  rawKeys?: () => string[]
  proxy?: any
  parent?: GenericInstance | null
}

/** The current VDOM or Vapor instance (Vue internal `currentInstance`). */
export function getGenericInstance(): GenericInstance | null {
  return (vue as any).currentInstance ?? null
}
