// SPIKE: in VDOM, a template ref on a component is its public instance, so `ref.$el` (and VueUse's
// `unrefElement`) always reaches the root element. In Vapor a component ref is only its *exposed*
// object, an empty proxy unless the component exposes something. reka resolves DOM nodes through
// component refs in many places (`usePrimitiveElement`, `unrefElement(componentRef)`), so the Vapor
// build gives every SFC a default `$el` expose. It is injected at the top of each compiled `setup`
// (`vapor/vite.config.mjs`); an explicit `defineExpose` / `useForwardExpose` later replaces it.
import * as vue from 'vue'
import { findElement } from '../Primitive'

export function exposeElement() {
  const instance = (vue as any).currentInstance
  if (instance && !instance.exposed) {
    instance.exposed = {
      get $el() {
        return findElement(instance.block)
      },
    }
  }
}
