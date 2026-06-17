import { getCurrentInstance } from 'vue'

/**
 * Returns the parent component's `<style scoped>` id (e.g. `data-v-xxxxxxx`) as a
 * bindable attribute object, so it can be manually forwarded onto the chosen root
 * element of a multi-root component.
 *
 * Vue only auto-applies the parent's scope id to a **single-root** component's root.
 * When a component renders multiple root nodes (e.g. an interactive control plus a
 * sibling hidden form input), that fallthrough is dropped and the parent's scoped
 * styles can no longer reach the component. Spread the returned object onto the
 * element that should stay styleable by the parent.
 *
 * @example
 * ```ts
 * const scopeIdAttrs = useForwardScopeId()
 * // <Primitive v-bind="{ ...$attrs, ...scopeIdAttrs }" />
 * ```
 */
export function useForwardScopeId(): Record<string, string> {
  // `vnode.scopeId` is the scope id the parent set on this component's placeholder
  // vnode for scoped-CSS fallthrough. It is populated during the parent's render,
  // so it is already available by the time `setup()` runs.
  const scopeId = (getCurrentInstance()?.vnode as { scopeId?: string } | undefined)?.scopeId
  return scopeId ? { [scopeId]: '' } : {}
}
