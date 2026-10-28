import { camelize, getCurrentInstance } from 'vue'
import { callListeners } from './callListeners'

/** A wrapper component's props (camelCase, `true` for a Boolean prop) and events. */
export interface WrapperSpec {
  props: Readonly<Record<string, boolean>>
  emits: readonly string[]
}

export interface SplitWrapperAttrs {
  /** The wrapper's props, camelCase, Boolean props cast as Vue casts them. */
  props: Record<string, unknown>
  /** Listeners for the wrapper's events, keyed `onEvent`. */
  listeners: Record<string, unknown>
  /** Everything else: what fell through to the wrapper's element. */
  rest: Record<string, unknown>
}

const HYPHENATE_RE = /\B([A-Z])/g
const LISTENER_RE = /^on[^a-z]/
const ONCE_RE = /Once$/
const hyphenate = (str: string) => str.replace(HYPHENATE_RE, '-$1').toLowerCase()

function isListenerFor(key: string, emits: readonly string[]): string | undefined {
  if (!LISTENER_RE.test(key))
    return undefined
  const event = key.slice(2).replace(ONCE_RE, '')
  const name = event[0].toLowerCase() + event.slice(1)
  return emits.find(e => e === name || e === hyphenate(event) || e === event)
}

/**
 * Splits a wrapper component's vnode props the way Vue does for a component
 * declaring `spec`. A part that replaced a wrapper (`<FocusScope as-child>`,
 * `<DismissableLayer as-child>`, …) with its composable computes the props
 * the wrapper received, in the order the template merged them, and splits
 * them here: consumer attrs named after the wrapper's props and events keep
 * configuring it, and only `rest` reaches the element.
 *
 * @internal
 */
export function splitWrapperAttrs(vnodeProps: Record<string, unknown>, spec: WrapperSpec): SplitWrapperAttrs {
  const props: Record<string, unknown> = {}
  const listeners: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const key in vnodeProps) {
    const value = vnodeProps[key]
    const camelKey = camelize(key)
    if (camelKey in spec.props) {
      props[camelKey] = spec.props[camelKey] && (value === '' || value === hyphenate(camelKey)) ? true : value
    }
    else if (isListenerFor(key, spec.emits)) {
      listeners[key] = value
    }
    else {
      rest[key] = value
    }
  }
  return { props, listeners, rest }
}

/**
 * The wrapper's `emit`, for what `splitWrapperAttrs` split off: calls the
 * listeners under `key`, then those under `${key}Once` the first time only, as
 * Vue does for a component's declared events, errors included (see
 * `callListeners`). One per wrapper instance replaced. `instance` is the part
 * whose error handling applies, the current one by default.
 *
 * @internal
 */
export function createWrapperEmit(wrapper: () => SplitWrapperAttrs, instance = getCurrentInstance()) {
  const fired = new Set<string>()
  return (key: string, ...args: unknown[]) => {
    const { listeners } = wrapper()
    callListeners(listeners[key], instance, args)
    const onceKey = `${key}Once`
    if (listeners[onceKey] && !fired.has(onceKey)) {
      fired.add(onceKey)
      callListeners(listeners[onceKey], instance, args)
    }
  }
}
