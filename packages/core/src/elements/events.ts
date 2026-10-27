import { hyphenate } from './host'

/**
 * `event.detail` of every event a Reka element dispatches.
 *
 * For a model change (`update-open`, `before-update-model-value`, …) `value` is the
 * new value and `details` the {@link ChangeEventDetails} of the v3 change contract.
 * For any other event `value` is the payload the Vue component emits (often the
 * native or custom event that caused it) and `details` is its second argument, if any.
 */
export interface RekaElementEventDetail<V = unknown, D = unknown> {
  value: V
  details: D
}

export type RekaElementEvent<V = unknown, D = unknown> = CustomEvent<RekaElementEventDetail<V, D>>

/**
 * DOM event type for a Vue emit: kebab-case, `:` replaced by `-`.
 * `update:modelValue` → `update-model-value`, `beforeUpdate:open` → `before-update-open`,
 * `escapeKeyDown` → `escape-key-down`. Event names never contain `:`, so they work as
 * `on<event>` props in React 19 and Svelte 5.
 */
export function toEventType(emit: string): string {
  return hyphenate(emit).replace(/:/g, '-')
}

interface Cancellable {
  cancel: () => void
}

function isCancellable(value: unknown): value is Cancellable {
  return typeof value === 'object' && value !== null && typeof (value as Cancellable).cancel === 'function'
}

/**
 * Re-dispatches a component emit as a `CustomEvent` on the element.
 *
 * Events are cancelable and do not bubble, like Vue emits (a nested family's
 * `update-open` never reaches an outer root's listener). Calling `preventDefault()`
 * cancels the change when the emit carries change details (`before-update-*`), and
 * otherwise prevents the default of the event the component passed along (for
 * example `escape-key-down` keeps the dialog open).
 */
export function dispatchElementEvent(el: HTMLElement, emit: string, args: unknown[]) {
  const [value, details] = args
  const event = new CustomEvent<RekaElementEventDetail>(toEventType(emit), {
    detail: { value, details },
    bubbles: false,
    cancelable: true,
  })
  el.dispatchEvent(event)
  if (!event.defaultPrevented)
    return
  if (isCancellable(details))
    details.cancel()
  else if (value instanceof Event)
    value.preventDefault()
}
