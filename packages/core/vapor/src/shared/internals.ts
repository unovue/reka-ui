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
//   - Fragment update hooks: `fragment.u` (called after a `v-if` / dynamic branch swaps its nodes),
//     used by `trackRootElement` to follow an `asChild` slot's root element.
// Exported and typed, but compiler-output helpers rather than documented API:
//   `createSlot`, `createIf`, `createDynamicComponent`, `renderEffect`, `isFragment`,
//   `isVaporComponent`, plus the slot/root flags (`4` FORWARDED, `1` SINGLE_ROOT, `{ _: 1 }`).
// Public and used where it is enough: `defineVaporComponent`, `defineVaporAsyncComponent`,
//   `hasInjectionContext` (Vapor-aware "inside a component?" check for the VueUse shims),
//   `useAttrs`, `useId`, lifecycle hooks, `onScopeDispose`.
//
// Static member reads only (`vue.x`, never `vue[key]`), so bundlers can still tree-shake `vue`.
import type { ExtractPropTypes, ShallowRef } from 'vue'
import * as vue from 'vue'
import { shallowRef } from 'vue'

/** The Vue range `reka-ui/vapor` is tested against. */
export const SUPPORTED_VUE = '>=3.6.0-rc.16'

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?/
const MINIMUM_RELEASE = [3, 6, 0]
const MINIMUM_PRERELEASE = 'rc.16'
const NUMERIC_RE = /^\d+$/

function unsupported(reason: string): never {
  throw new Error(`reka-ui/vapor needs Vue 3.6.0-rc.16+ (${SUPPORTED_VUE}); ${reason}. Install vue@3.6 or import from "reka-ui" instead.`)
}

/** Compares two prerelease tags as semver does: dot-separated, numeric parts numerically. */
function comparePrerelease(a: string, b: string) {
  const pa = a.split('.')
  const pb = b.split('.')
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined)
      return -1
    if (pb[i] === undefined)
      return 1
    const na = NUMERIC_RE.test(pa[i]) ? +pa[i] : Number.NaN
    const nb = NUMERIC_RE.test(pb[i]) ? +pb[i] : Number.NaN
    if (pa[i] === pb[i])
      continue
    if (!Number.isNaN(na) && !Number.isNaN(nb))
      return na - nb
    if (!Number.isNaN(na))
      return -1
    if (!Number.isNaN(nb))
      return 1
    return pa[i] < pb[i] ? -1 : 1
  }
  return 0
}

/** Whether `version` is at least 3.6.0-rc.16 (a stable release sorts after its prereleases). */
export function isSupportedVue(version: string): boolean {
  const m = VERSION_RE.exec(version)
  if (!m)
    return false
  const parts = [+m[1], +m[2], +m[3]]
  for (let i = 0; i < 3; i++) {
    if (parts[i] !== MINIMUM_RELEASE[i])
      return parts[i] > MINIMUM_RELEASE[i]
  }
  // 3.6.0 itself: stable, or a prerelease from rc.16 on
  return m[4] === undefined || comparePrerelease(m[4], MINIMUM_PRERELEASE) >= 0
}

const v = vue as any
if (!isSupportedVue(String(v.version)))
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
/** The setup context a Vapor component receives (the subset reka's hand-written components use). */
export interface VaporSetupContext {
  attrs: Record<string, any>
  slots: Record<string, any>
  emit: (event: string, ...args: any[]) => void
  expose: (exposed?: Record<string, any>) => void
}
export interface VaporComponentOptions<P extends Record<string, any>> {
  name?: string
  inheritAttrs?: boolean
  props?: P
  setup: (props: ExtractPropTypes<P>, ctx: VaporSetupContext) => any
}
/** Public types come from the main entry's declarations (see vapor/vite.config.mjs), so this returns `any`. */
export const defineVaporComponent: <P extends Record<string, any> = Record<string, never>>(options: VaporComponentOptions<P>) => any = v.defineVaporComponent

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

/** The fragments `findElement` walks through on its way to the first element (all of them if none). */
function fragmentsToElement(block: any, out: any[]): boolean {
  if (!block)
    return false
  if (block instanceof Element)
    return true
  if (Array.isArray(block))
    return block.some(b => fragmentsToElement(b, out))
  if (v.isVaporComponent(block))
    return fragmentsToElement(block.block, out)
  if (v.isFragment(block)) {
    out.push(block)
    return fragmentsToElement(block.nodes, out)
  }
  return false
}

/**
 * The first element of `block` as a ref that follows it while the block stays mounted: a `v-if`
 * branch, a keyed node or a dynamic `as` inside the slot can replace it without re-running the
 * enclosing setup. Vapor has no public signal for that, so this registers on the internal update
 * hooks (`u`) of every fragment on the way to the element, and walks again after each update.
 * `onChange(next, previous)` runs synchronously, before the update returns.
 */
export function trackRootElement(block: unknown, onChange?: (next: Element | null, previous: Element | null) => void): ShallowRef<Element | null> {
  const root = shallowRef(findElement(block))
  let hooked: any[] = []
  const unhook = () => {
    for (const fragment of hooked) {
      const i = fragment.u?.indexOf(update) ?? -1
      if (i >= 0)
        fragment.u.splice(i, 1)
    }
    hooked = []
  }
  const hook = () => {
    unhook()
    fragmentsToElement(block, hooked)
    for (const fragment of hooked)
      (fragment.u ??= []).push(update)
  }
  function update() {
    hook()
    const next = findElement(block)
    if (next !== root.value) {
      const previous = root.value
      root.value = next
      onChange?.(next, previous)
    }
  }
  hook()
  v.onScopeDispose(unhook)
  return root
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
