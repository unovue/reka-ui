import { ELEMENT_EVENT, hyphenate } from './host'

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

export interface ElementEventOptions {
  /**
   * Let events bubble. Off by default, like Vue emits: every part fires its own
   * events, so a bubbling `update-model-value` reaching an ancestor would be
   * ambiguous (a checkbox inside an accordion item).
   * @defaultValue false
   */
  bubbles?: boolean
  /**
   * Let events cross shadow roots (needs `bubbles` to reach a listener outside).
   * @defaultValue false
   */
  composed?: boolean
}

/**
 * Re-dispatches a component emit as a `CustomEvent` on the element.
 *
 * Only an event whose default can be prevented is `cancelable`: a `before-update-*`
 * event, where `preventDefault()` cancels the change (`details.cancel()`), and an
 * emit that passes a DOM event along (`escape-key-down`, `pointer-down-outside`,
 * …), where it prevents that event's default (the dialog stays open). `update-*`
 * events report a change that already happened and are not cancelable.
 */
export function dispatchElementEvent(el: HTMLElement, emit: string, args: unknown[], options: ElementEventOptions = {}) {
  const [value, details] = args
  // `update:*` carries the same change details, but the change already happened.
  const cancellable = emit.startsWith('beforeUpdate:') && isCancellable(details)
  const event = new CustomEvent<RekaElementEventDetail>(toEventType(emit), {
    detail: { value, details },
    bubbles: !!options.bubbles,
    composed: !!options.composed,
    cancelable: cancellable || value instanceof Event,
  })
  Object.defineProperty(event, ELEMENT_EVENT, { value: true })
  el.dispatchEvent(event)
  if (!event.defaultPrevented)
    return
  if (cancellable)
    details.cancel()
  else if (value instanceof Event)
    value.preventDefault()
}
