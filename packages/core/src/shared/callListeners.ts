import type { ComponentInternalInstance } from 'vue'
import { callWithAsyncErrorHandling } from 'vue'

// Vue's `ErrorCodes.COMPONENT_EVENT_HANDLER`, which names it in the error
// message. A literal, as `callWithAsyncErrorHandling` is exported by every Vue
// this package supports and the enum isn't guaranteed to be.
const COMPONENT_EVENT_HANDLER = 6

/**
 * Calls a consumer's listener attr (a function, or the array of them
 * `mergeProps` makes) as Vue's `emit` does: each one on its own, so one that
 * throws or rejects doesn't stop the rest, with the error going to
 * `app.config.errorHandler`. Anything that stands in for a component's `emit`
 * calls listeners through this.
 *
 * @internal
 */
export function callListeners(listener: unknown, instance: ComponentInternalInstance | null, args: unknown[]) {
  if (listener)
    callWithAsyncErrorHandling(listener as (...args: unknown[]) => unknown, instance, COMPONENT_EVENT_HANDLER, args)
}
