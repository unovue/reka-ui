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

function getScopedContext(scope: PopperScope) {
  let context = scopedContexts.get(scope)
  if (!context) {
    context = createContext<PopperRootContext>(`PopperRoot (${scope})`)
    scopedContexts.set(scope, context)
  }
  return context
}

export function injectPopperRootContext(scope?: PopperScope) {
  return (scope ? getScopedContext(scope) : defaultContext)[0]()
}

export function providePopperRootContext(context: PopperRootContext, scope?: PopperScope) {
  // Unscoped primitives still use the nearest root. Family parts use a stable
  // scope so a different floating component between root and part cannot intercept it.
  defaultContext[1](context)
  if (scope)
    getScopedContext(scope)[1](context)
}
