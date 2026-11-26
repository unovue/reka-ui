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
  root?: (kind: string, context: unknown, props: unknown, element?: unknown, extra?: unknown) => void
  /**
   * An item of a list-like root (a tab, a radio, an accordion section…), keyed by the root's context,
   * or with `part`, a control of the root that an action stands for, like a number field's increment button.
   */
  item?: (rootContext: unknown, props: unknown, element: unknown, part?: string) => void
  /** Just before a modal hides the rest of the page from screen readers. */
  hiding?: () => void
}

const KEY = Symbol.for('reka-ui:agent')

export const agentRegistrar: AgentRegistrar = ((globalThis as any)[KEY] ||= {})

export function useAgentRegistration(kind: string, context: unknown, props: unknown, element?: unknown, extra?: unknown) {
  agentRegistrar.root?.(kind, context, props, element, extra)
}

/**
 * The agent marks among a part's attributes (`data-agent-*`, and `hidden` or `aria-hidden`, which hide it from
 * agents too), while a bridge is installed, for a part that renders without its attributes, like a closed
 * select's item. Without a bridge it's one property read.
 */
export function agentMarksOf(attrs: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!agentRegistrar.root)
    return undefined
  let marks: Record<string, unknown> | undefined
  for (const key in attrs) {
    if (key.startsWith('data-agent-') || key === 'hidden' || key === 'aria-hidden')
      (marks ??= {})[key] = attrs[key]
  }
  return marks
}

export function useAgentItem(rootContext: unknown, props: unknown, element: unknown, part?: string) {
  agentRegistrar.item?.(rootContext, props, element, part)
}
