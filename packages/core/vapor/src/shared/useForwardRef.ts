// Vapor `useForwardRef`: v2 assigns `exposed` / `exposeProxy` on the public instance, which a Vapor
// component doesn't have. Swapped in for `src/shared/useForwardRef.ts` by `vapor/plugins.mjs`.
import type { ComponentPublicInstance } from 'vue'
import { forwardExposed, getGenericInstance } from './internals'

export function useForwardRef() {
  const instance = getGenericInstance()!
  function handleRefChange(ref: Element | ComponentPublicInstance | null) {
    if (ref && typeof ref === 'object')
      forwardExposed(instance, ref as Record<string, any>)
  }
  return handleRefChange
}
