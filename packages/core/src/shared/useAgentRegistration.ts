/**
 * The seam between components and the opt-in agent bridge (`reka-ui/agent`).
 *
 * Components call these hooks with references they already hold (their root
 * context, props and element ref), so a call creates no closure and no object.
 * Until `createAgent` installs a registrar, each call is one property read.
 * The registrar lives on `globalThis` so a bridge created from one copy of the
 * entry still hears components bundled into another chunk.
 */
export interface AgentRegistrar {
  /** A component root: its kind, its root context, its props, its element ref and one extra handle it owns. */
  root?: (kind: string, context: unknown, props: unknown, element?: unknown, extra?: unknown, model?: unknown) => void
  /** An item of a list-like root (a tab, a radio, an accordion section…), keyed by the root's context. */
  item?: (rootContext: unknown, props: unknown, element: unknown) => void
}

const KEY = Symbol.for('reka-ui:agent')

export const agentRegistrar: AgentRegistrar = ((globalThis as any)[KEY] ||= {})

export function useAgentRegistration(kind: string, context: unknown, props: unknown, element?: unknown, extra?: unknown, model?: unknown) {
  agentRegistrar.root?.(kind, context, props, element, extra, model)
}

export function useAgentItem(rootContext: unknown, props: unknown, element: unknown) {
  agentRegistrar.item?.(rootContext, props, element)
}
