import type { ReferenceElement } from '@floating-ui/vue'
import type { Ref } from 'vue'
import { createRekaContext } from '@/shared'

/**
 * The component family a popper part belongs to. A part with a scope resolves
 * the nearest root of its own family, through roots of other families in
 * between (a `TooltipTrigger` composed with a `PopoverTrigger`).
 */
export type PopperScope = 'combobox' | 'hover-card' | 'menu' | 'popover' | 'select' | 'tooltip'

export interface PopperRootContext {
  anchor: Readonly<Ref<ReferenceElement | undefined>>
  onAnchorChange: (element: ReferenceElement | undefined) => void
}

const defaultContext = createRekaContext<PopperRootContext>('PopperRoot')
const scopedContexts = new Map<PopperScope, ReturnType<typeof createRekaContext<PopperRootContext>>>()

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
    context = createRekaContext<PopperRootContext>('PopperRoot', `PopperRoot (${scope})`)
    scopedContexts.set(scope, context)
  }
  return context
}

/**
 * Inject the nearest root, or the nearest root of a component family.
 *
 * @param scope The family to resolve. Omitted, it resolves the nearest `PopperRoot`;
 * `null` does too, and returns `null` instead of throwing when there is none.
 * @param fallback `null` to return `null` instead of throwing when no matching root provides one.
 * @returns The resolved root's anchor state and registration callback.
 * @throws When no matching root provides a context and no fallback is given.
 */
export function injectPopperRootContext(scope: PopperScope | null | undefined, fallback: null): PopperRootContext | null
export function injectPopperRootContext(scope?: PopperScope): PopperRootContext
export function injectPopperRootContext(scope: null): PopperRootContext | null
export function injectPopperRootContext(scope?: PopperScope | null, fallback?: null): PopperRootContext | null {
  const [inject] = scope ? getScopedContext(scope) : defaultContext
  return scope === null || fallback === null ? inject(null) : inject()
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
