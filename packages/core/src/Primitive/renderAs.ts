import type { Component, FunctionalComponent, VNode } from 'vue'
import type { AsTag } from './Primitive'
import { createVNode, h } from 'vue'
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
 * A bare element vnode for `<component :is>`, which clones it with the bound
 * props and children (Vue's `<component :is="vnode"/>` path) and so renders the
 * element directly.
 *
 * A plain tag string would not do: `<component :is="'button'">` first looks the
 * name up as a component (`resolveDynamicComponent`), so an app that registered
 * a global `Button` (or `Label`, `Input`, …) would get that component instead
 * of the element. `Primitive` renders through `h(tag)` and never resolves.
 *
 * Created per render, not cached: the vnode records the rendering instance and
 * its scope id, which the clone carries over (a shared vnode would hold on to
 * the first part that rendered it). Only the clone reads it, so it is garbage
 * right after the render.
 */
function elementType(tag: string): VNode {
  return createVNode(tag)
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
): Component | VNode {
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
 * Every tag name renders the element directly.
 * @internal
 */
export function renderAsEmpty(
  as: AsTag | Component | undefined,
  asChild?: boolean,
  defaultTagName: AsTag = 'div',
): Component | VNode {
  const tag = resolveRenderTag(as, asChild, defaultTagName)
  return typeof tag === 'string' ? elementType(tag) : tag
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
