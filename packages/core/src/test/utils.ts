import type { ComponentInternalInstance, VNode } from 'vue'
import { vi } from 'vitest'

export const handleSubmit = vi.fn((e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  return Object.fromEntries(formData as any)
})

export const sleep = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))

/**
 * The names of every component instance under `instance` (itself included), in
 * tree order. Pins "one component per part": a part that renders its own
 * element adds its own name and no `Primitive`.
 */
export function componentNames(instance: ComponentInternalInstance): string[] {
  const names: string[] = []
  const visit = (vnode: VNode | null | undefined) => {
    if (!vnode)
      return
    if (vnode.component) {
      const type = vnode.component.type as { name?: string, __name?: string, displayName?: string }
      names.push(type.name ?? type.__name ?? type.displayName ?? 'Anonymous')
      visit(vnode.component.subTree)
      return
    }
    if (vnode.suspense)
      visit(vnode.suspense.activeBranch)
    if (Array.isArray(vnode.children))
      vnode.children.forEach(child => visit(child as VNode))
  }
  visit(instance.vnode)
  return names
}
