// Every Vue internal the `reka-ui/vapor` entry touches goes through this file, so a Vue change before
// 3.6 stable breaks in one place, with one clear error. Checked against vue@3.6.0-rc.16.
//
// Internal (not in Vue's public types, may change without notice):
//   - `currentInstance`: the generic (VDOM or Vapor) instance during setup. Public
//     `getCurrentInstance()` returns `null` in Vapor. Used to forward `exposed`, read `scopeId`,
//     `rawKeys()` (which props the parent passed), `type.props/emits` and `block`.
//   - Instance fields: `vapor`, `exposed` (assigned before the expose proxy is first read), `block`,
//     `props`, `scopeId`, `rawKeys()`, `type`, `parent`, `isDeactivated`, `vnode.el` (VDOM parents).
//   - Block shape: `instance.block` and `fragment.nodes`, walked by `findElement`.
// Exported and typed, but compiler-output helpers rather than documented API:
//   `createSlot`, `createIf`, `createDynamicComponent`, `renderEffect`, `isFragment`,
//   `isVaporComponent`, plus the slot/root flags (`4` FORWARDED, `1` SINGLE_ROOT, `{ _: 1 }`).
// Public and used where it is enough: `defineVaporComponent`, `defineVaporAsyncComponent`,
//   `hasInjectionContext` (Vapor-aware "inside a component?" check for the VueUse shims),
//   `useAttrs`, `useId`, lifecycle hooks, `onScopeDispose`.
//
// Static member reads only (`vue.x`, never `vue[key]`), so bundlers can still tree-shake `vue`.
import * as vue from 'vue'

/** The Vue range `reka-ui/vapor` is tested against. */
export const SUPPORTED_VUE = '>=3.6.0-rc.16'

const VERSION_RE = /^(\d+)\.(\d+)/

function unsupported(reason: string): never {
  throw new Error(`reka-ui/vapor needs Vue 3.6.0-rc.16+ (${SUPPORTED_VUE}); ${reason}. Install vue@3.6 or import from "reka-ui" instead.`)
}

const v = vue as any
const [, major, minor] = VERSION_RE.exec(String(v.version)) ?? []
if (!major || +major < 3 || (+major === 3 && +minor < 6))
  unsupported(`found vue@${v.version}`)

// Vapor renders straight to the DOM, and `asChild` patches the slotted element: there is no server
// output to hydrate. Fail at import instead of rendering broken markup.
if (typeof document === 'undefined')
  throw new Error('reka-ui/vapor does not support server-side rendering (it needs a DOM). Render it client-only, or import from "reka-ui" for SSR.')

const required: Record<string, unknown> = {
  currentInstance: v.currentInstance,
  defineVaporComponent: v.defineVaporComponent,
  createSlot: v.createSlot,
  createIf: v.createIf,
  createDynamicComponent: v.createDynamicComponent,
  renderEffect: v.renderEffect,
  isFragment: v.isFragment,
  isVaporComponent: v.isVaporComponent,
  hasInjectionContext: v.hasInjectionContext,
}
for (const name in required) {
  // `currentInstance` is `null` outside setup; a missing export is `undefined`
  if (required[name] === undefined)
    unsupported(`vue@${v.version} has no "${name}" export`)
}

export const createSlot: (name: string, rawProps?: Record<string, any> | null, fallback?: () => any, flags?: number) => any = v.createSlot
export const createIf: (condition: () => any, b1: () => any, b2?: () => any) => any = v.createIf
export const createDynamicComponent: (getter: () => any, rawProps?: Record<string, any> | null, rawSlots?: Record<string, any> | null, flags?: number) => any = v.createDynamicComponent
export const renderEffect: (fn: () => void) => void = v.renderEffect
export const defineVaporComponent: <T>(options: T) => T = v.defineVaporComponent

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
  isDeactivated?: boolean
}

/** The current VDOM or Vapor instance (Vue internal `currentInstance`). */
export function getGenericInstance(): GenericInstance | null {
  return v.currentInstance ?? null
}

/** First element of a Vapor block (element, fragment, component instance or array). */
export function findElement(block: any): Element | null {
  if (!block)
    return null
  if (block instanceof Element)
    return block
  if (Array.isArray(block)) {
    for (const b of block) {
      const el = findElement(b)
      if (el)
        return el
    }
    return null
  }
  if (v.isVaporComponent(block))
    return findElement(block.block)
  if (v.isFragment(block))
    return findElement(block.nodes)
  return null
}

/** Root element of an instance: its Vapor block, or a VDOM instance's `vnode.el`. */
export function instanceElement(instance: GenericInstance | null | undefined): Element | null {
  if (!instance)
    return null
  return instance.vapor ? findElement(instance.block) : (instance.vnode?.el as Element | null) ?? null
}

/** Prop keys the parent passed (Vapor `rawKeys()`, VDOM `vnode.props`). */
export function passedPropKeys(instance: GenericInstance | null | undefined): string[] {
  if (!instance)
    return []
  return instance.vapor ? instance.rawKeys!() : Object.keys(instance.vnode?.props ?? {})
}

/** The scoped-style id the instance renders with. */
export function instanceScopeId(instance: GenericInstance | null | undefined): string | null | undefined {
  return instance?.vapor ? instance.scopeId : instance?.vnode?.scopeId
}

/** Declared emits of the instance's component. */
export function instanceEmits(instance: GenericInstance | null | undefined): string[] {
  const emits = instance?.type.emits
  return Array.isArray(emits) ? emits : Object.keys(emits ?? {})
}

/** Declared prop options of the instance's component. */
export function instancePropOptions(instance: GenericInstance | null | undefined): Record<string, any> {
  return instance?.type.props ?? {}
}

/** What a template ref on the instance resolves to (before Vapor caches its expose proxy). */
export function getExposed(instance: GenericInstance): Record<string, any> | null {
  return instance.exposed
}

/** Replaces what a template ref on the instance resolves to. Must run before the ref is first read. */
export function setExposed(instance: GenericInstance, exposed: Record<string, any> | null) {
  instance.exposed = exposed
}

/** Whether a `KeepAlive` above the instance holds it deactivated. */
export function hasDeactivatedAncestor(instance: GenericInstance): boolean {
  for (let parent = instance.parent; parent; parent = parent.parent) {
    if (parent.isDeactivated)
      return true
  }
  return false
}

/** Re-renders a VDOM instance. A Vapor instance has no render function to re-run, so it is a no-op. */
export function forceUpdate(instance: GenericInstance) {
  instance.proxy?.$forceUpdate?.()
}

/** Makes a template ref on the instance resolve to `target` (v2 `useForwardRef`). */
export function forwardExposed(instance: GenericInstance, target: Record<string, any>) {
  instance.exposed = target
  ;(instance as any).exposeProxy = target
}

/**
 * Stand-in for `getCurrentInstance()` in the v2 SFCs (the build rewrites their import). They read
 * `exposed` (to add methods after mount) and `vnode.props` (whether a listener was passed); a Vapor
 * instance has neither a public instance nor a vnode, so both are mapped onto its own fields.
 */
export function getCurrentInstanceCompat(): any {
  const instance = getGenericInstance()
  if (!instance?.vapor)
    return instance
  return {
    get exposed() {
      return instance.exposed
    },
    set exposed(value) {
      instance.exposed = value
    },
    vnode: {
      get props() {
        return Object.fromEntries(instance.rawKeys!().map(key => [key, true]))
      },
    },
  }
}
