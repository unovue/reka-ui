// Vapor `renderAs`. Swapped in for `src/Primitive/renderAs.ts` by `vapor/plugins.mjs`.
//
// The parts render their element with `<component :is="renderAs(as, asChild)">`, which the build
// rewrites to `<Primitive :as="as" :as-child="asChild">` (`renderAsToPrimitive` in plugins.mjs), so
// Vapor's `Primitive` handles `as` / `asChild` (DOM adoption included). What remains here are the
// pure helpers a script calls; `renderAs` itself returns what Vapor's dynamic component can render.
import type { Component } from 'vue'
import type { AsTag } from './Primitive'
import { isSelfClosingTag, resolveRenderTag } from '@/Primitive/useRender'

/** The target for `<component :is>`: the tag name, the component, or `Slot` for `asChild`. */
export function renderAs(as: AsTag | Component | undefined, asChild?: boolean, defaultTagName: AsTag = 'div'): Component | string {
  return resolveRenderTag(as, asChild, defaultTagName) as Component | string
}

export const renderAsEmpty = renderAs

export function rendersOwnElement(as: AsTag | Component | undefined, asChild?: boolean): boolean {
  return typeof resolveRenderTag(as, asChild) === 'string'
}

export function rendersChildren(as: AsTag | Component | undefined, asChild?: boolean, defaultTagName: AsTag = 'div'): boolean {
  return !isSelfClosingTag(resolveRenderTag(as, asChild, defaultTagName))
}
