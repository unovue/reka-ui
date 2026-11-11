import type { ReferenceElement } from '@floating-ui/vue'
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export type PopperScope = 'combobox' | 'hover-card' | 'menu' | 'popover' | 'select' | 'tooltip'

interface PopperRootContext {
  anchor: Ref<ReferenceElement | undefined>
  onAnchorChange: (element: ReferenceElement | undefined) => void
}

const defaultContext = createContext<PopperRootContext>('PopperRoot')
const scopedContexts = new Map<PopperScope, ReturnType<typeof createContext<PopperRootContext>>>()

/**
 * Return stable context helpers for a family, creating its injection key once.
 * Only helpers are cached; each root provides its own anchor state.
 *
 * @param scope The component family whose context helpers are needed.
 * @returns The family's inject and provide functions.
 */
function getScopedContext(scope: PopperScope) {
  let context = scopedContexts.get(scope)
  if (!context) {
    context = createContext<PopperRootContext>(`PopperRoot (${scope})`)
    scopedContexts.set(scope, context)
  }
  return context
}

/**
 * Inject the nearest root belonging to the requested component family.
 *
 * @param scope The family to resolve, or omit to use the nearest PopperRoot.
 * @returns The resolved root's anchor state and registration callback.
 * @throws When no matching root provides a context.
 */
export function injectPopperRootContext(scope?: PopperScope) {
  return (scope ? getScopedContext(scope) : defaultContext)[0]()
}

/**
 * Provide this root's anchor state to unscoped parts and its component family.
 * The family binding lets parts resolve their root through other floating families.
 *
 * @param context The anchor state and registration callback owned by this root.
 * @param scope The optional family to bind alongside the default context.
 */
export function providePopperRootContext(context: PopperRootContext, scope?: PopperScope) {
  defaultContext[1](context)
  if (scope)
    getScopedContext(scope)[1](context)
}
