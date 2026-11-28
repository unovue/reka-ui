import type { Component, ComponentInternalInstance, FunctionalComponent, VNode } from 'vue'
import type { AsTag } from './Primitive'
import { camelize, capitalize, createVNode, getCurrentInstance, h } from 'vue'
import { ariaDisabledAttr, isNativeDisabledTag } from '../shared/disabledAttr'
import { isSelfClosingTag, resolveRenderTag } from './useRender'

/*
 * One component per part: a part renders its own element with
 *
 *   <component :is="renderAs(as, asChild)" :ref="forwardRef" v-bind="…">
 *     <slot />
 *   </component>
 *
 * instead of nesting `<Primitive>`, so it is one component instance instead of
 * two (three with `asChild`). `as` / `asChild` resolve exactly as in
 * `Primitive`: `asChild` or `as="template"` renders `Slot` (which merges onto
 * the single slot child), a component renders that component, and a tag name
 * renders the element.
 */

/**
 * Whether `<component :is="tag">` would resolve `tag` to a component, as
 * `resolveDynamicComponent` does: the rendering component's own `name`, then
 * its local and the app's global components, under the tag, its camelized and
 * its capitalized form (`button`, `Button`).
 */
function resolvesToComponent(instance: ComponentInternalInstance, tag: string): boolean {
  const type = instance.type as { name?: string, displayName?: string, components?: Record<string, unknown> }
  const selfName = typeof instance.type === 'function' ? type.displayName || type.name : type.name
  const local = (instance as { components?: Record<string, unknown> | null }).components || type.components
  const global = instance.appContext.components
  const camelized = camelize(tag)
  for (const name of [tag, camelized, capitalize(camelized)]) {
    if (name === selfName || (local && Object.hasOwn(local, name)) || Object.hasOwn(global, name))
      return true
  }
  return false
}

/**
 * What `<component :is>` gets for a tag name: the name itself, which the
 * template compiles to an ordinary element block. Its patch stays optimized, so
 * a re-render of the part diffs only its dynamic bindings, and the components
 * in its slot (a list's items) update only when their own props or slots
 * change. As for any element in a template, hydration applies its dynamic
 * attributes to the element the server rendered.
 *
 * When the name would resolve to a component (an app that registered a global
 * `Button`, `Label`, `Input`, …, or a part named after its tag), a bare element
 * vnode instead, which `<component :is>` clones with the bound props and
 * children and so renders the element without resolving it. A cloned vnode
 * patches in full (`BAIL`), and every component in its slot re-renders with it,
 * so only that case takes it. `Primitive` renders through `h(tag)` and never
 * resolves.
 *
 * The element vnode is created per render, not cached: it records the
 * rendering instance and its scope id, which the clone carries over (a shared
 * vnode would hold on to the first part that rendered it).
 */
function elementType(tag: string): string | VNode {
  const instance = getCurrentInstance()
  return instance && resolvesToComponent(instance, tag) ? createVNode(tag) : tag
}

/**
 * Self-closing tags (`img`, `input`, `area`) render no children, as in
 * `Primitive`: an `<input>` with children breaks hydration (the server renders
 * none). A part whose template always passes children reaches this only when a
 * consumer sets `as` to such a tag, so the extra (functional) instance is never
 * on the usual path. Parts that default to a self-closing tag gate their
 * children with `rendersChildren` instead (see `renderAsEmpty`).
 */
const emptyTypes = new Map<string, FunctionalComponent>()

function emptyType(tag: string): FunctionalComponent {
  let type = emptyTypes.get(tag)
  if (!type) {
    type = (_, { attrs }) => h(tag, attrs)
    // The attrs are rendered above; inheriting them as well would merge class,
    // style and listeners twice.
    type.inheritAttrs = false
    type.displayName = tag
    emptyTypes.set(tag, type)
  }
  return type
}

/**
 * What a part binds to `<component :is>` to render its own element. Pure and
 * allocation-free apart from the element vnode: call it from the template.
 * @internal
 */
export function renderAs(
  as: AsTag | Component | undefined,
  asChild?: boolean,
  defaultTagName: AsTag = 'div',
): Component | VNode | string {
  const tag = resolveRenderTag(as, asChild, defaultTagName)
  if (typeof tag !== 'string')
    return tag
  return isSelfClosingTag(tag) ? emptyType(tag) : elementType(tag)
}

/**
 * Whether `as` / `asChild` make the part render its element itself: a tag name,
 * not `Slot` (`asChild`, `as="template"`) or a component, either of which can
 * bind attributes over the part's own further down, out of the part's sight.
 * @internal
 */
export function rendersOwnElement(
  as: AsTag | Component | undefined,
  asChild?: boolean,
): boolean {
  return typeof resolveRenderTag(as, asChild) === 'string'
}

/**
 * `renderAs` for a part whose template passes no children, or gates them with
 * `rendersChildren` (a part that defaults to `input` or `img`):
 *
 *   <component :is="renderAsEmpty(as, asChild)" v-bind="…">
 *     <template v-if="rendersChildren(as, asChild)" #default>
 *       <slot />
 *     </template>
 *   </component>
 *
 * Every tag name renders the element directly, through a bare element vnode:
 * an optimized patch of an element does not re-render a conditional
 * `#default` like the one above, so these parts keep the full patch.
 * @internal
 */
export function renderAsEmpty(
  as: AsTag | Component | undefined,
  asChild?: boolean,
  defaultTagName: AsTag = 'div',
): Component | VNode {
  const tag = resolveRenderTag(as, asChild, defaultTagName)
  return typeof tag === 'string' ? createVNode(tag) : tag
}

/**
 * Whether `as` / `asChild` render children: `false` for `img`, `input` and
 * `area`, which `Primitive` renders without its slot.
 * @internal
 */
export function rendersChildren(
  as: AsTag | Component | undefined,
  asChild?: boolean,
  defaultTagName: AsTag = 'div',
): boolean {
  return !isSelfClosingTag(resolveRenderTag(as, asChild, defaultTagName))
}

/**
 * Plain tags without a native `disabled` (`div`, `span`, `a`, …) for a part that binds `disabled`:
 * a functional component that drops `disabled: false` (which would render `disabled="false"`)
 * and exposes `disabled` with `aria-disabled`, as `Primitive` does. Its template ref is the
 * element, as for any functional component.
 */
const controlTypes = new Map<string, FunctionalComponent>()

function controlType(tag: string): FunctionalComponent {
  let type = controlTypes.get(tag)
  if (!type) {
    type = (_, { attrs, slots }) => {
      const props: Record<string, unknown> = { ...attrs }
      if (props.disabled === false)
        props.disabled = undefined
      const ariaDisabled = ariaDisabledAttr(tag, props)
      if (ariaDisabled)
        props['aria-disabled'] = ariaDisabled
      return h(tag, props, slots.default?.())
    }
    // The attrs are rendered above; inheriting them as well would merge class,
    // style and listeners twice.
    type.inheritAttrs = false
    type.displayName = tag
    controlTypes.set(tag, type)
  }
  return type
}

/**
 * `renderAs` for a part that binds a boolean `disabled` (a trigger or a button-like control).
 * A tag with a native `disabled` (the usual `button`) renders the element directly, exactly as
 * `renderAs`; any other plain tag renders through a functional component that omits
 * `disabled="false"` and adds `aria-disabled="true"` when disabled, the way `Primitive` does for
 * the parts it renders. A component or custom element gets the boolean unchanged; `asChild`
 * renders `Slot`, which does the same for the child it lands on.
 *
 * The element is a bare element vnode, as before `renderAs` rendered a tag
 * name: hydration then leaves the server's attributes on it, which a trigger
 * relies on to keep the id the server rendered (see `useTriggerId`).
 * @internal
 */
export function renderAsControl(
  as: AsTag | Component | undefined,
  asChild?: boolean,
  defaultTagName: AsTag = 'button',
): Component | VNode {
  const tag = resolveRenderTag(as, asChild, defaultTagName)
  if (typeof tag !== 'string')
    return tag
  if (isSelfClosingTag(tag))
    return emptyType(tag)
  return isNativeDisabledTag(tag) || tag.includes('-') ? createVNode(tag) : controlType(tag)
}
