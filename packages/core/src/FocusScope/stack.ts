import { createGlobalState } from '@vueuse/core'
import { shallowRef } from 'vue'

export interface FocusScopeAPI {
  paused: boolean
  pause: () => void
  resume: () => void
}

export interface FocusScopesStack {
  /**
   * Adds a focus scope to the top of the app-wide stack. When no scope is
   * supplied, a coordination-only scope is created for integrations whose
   * focus trap is managed by another library.
   */
  add: (focusScope?: FocusScopeAPI) => FocusScopeAPI
  remove: (focusScope: FocusScopeAPI) => void
}

const useFocusStackState = createGlobalState(() => {
  // Keep the registered scope identities intact. A deep ref would proxy a
  // scope supplied by an external integration, making remove(scope) unable
  // to find the original handle.
  const stack = shallowRef<FocusScopeAPI[]>([])
  return stack
})

/**
 * Returns a handle to the app-wide focus-scope stack used by `FocusScope`.
 *
 * Third-party modal implementations that render outside a Reka UI dialog can
 * pause the dialog's trap while their own trap is active:
 *
 * ```ts
 * const stack = createFocusScopesStack()
 * const scope = stack.add()
 * // open the third-party modal and enable its focus trap
 * stack.remove(scope)
 * ```
 *
 * This only coordinates Reka UI focus scopes. The integration remains
 * responsible for trapping focus in the third-party modal, restoring focus
 * when it closes, and coordinating any pointer-event or accessibility
 * isolation that its portal requires.
 */
export function createFocusScopesStack(): FocusScopesStack {
  /** A stack of focus scopes, with the active one at the top */
  const stack = useFocusStackState()

  return {
    add(focusScope = createFocusScope()) {
      // pause the currently active focus scope (at the top of the stack)
      const activeFocusScope = stack.value[0]
      if (focusScope !== activeFocusScope)
        activeFocusScope?.pause()

      // remove in case it already exists (because we'll re-add it at the top of the stack)
      stack.value = [focusScope, ...arrayRemove(stack.value, focusScope)]

      return focusScope
    },

    remove(focusScope: FocusScopeAPI) {
      const wasActive = stack.value[0] === focusScope
      stack.value = arrayRemove(stack.value, focusScope)
      if (wasActive)
        stack.value[0]?.resume()
    },
  }
}

function createFocusScope(): FocusScopeAPI {
  const focusScope: FocusScopeAPI = {
    paused: false,
    pause: () => {
      focusScope.paused = true
    },
    resume: () => {
      focusScope.paused = false
    },
  }

  return focusScope
}

export function arrayRemove<T>(array: T[], item: T) {
  const updatedArray = [...array]
  const index = updatedArray.indexOf(item)
  if (index !== -1)
    updatedArray.splice(index, 1)

  return updatedArray
}

export function removeLinks(items: HTMLElement[]) {
  return items.filter(item => item.tagName !== 'A')
}
