/**
 * One component as an agent sees it.
 */
export interface AgentComponent {
  /** What a step's `ref` and `query`'s `within` take. Stable while the component stays on the page. */
  ref: string
  /** The component, like `"select"`. */
  component: string
  /** Its accessible name, from its label or its element. */
  label?: string
  /** Other text on its row, like the name beside a member's menu. */
  row?: string
  /** Its value, checked or open state, and more it reports, like `min` and `max`. */
  [state: string]: unknown
  /** The items it takes, when they're few. `query` with `within` lists the rest. */
  items?: { value: string, label: string }[]
  /** How many items it has that `items` leaves out. */
  more?: number
  /** Text it shows, like a dialog's title and description. */
  text?: string[]
  /** Buttons inside it, for `press`, like a dialog's Cancel and Delete. */
  buttons?: string[]
  /** The labelled regions it's in, like `"Notifications > Email"`, when another component has its name or it's off the page. */
  section?: string
  /** What `data-agent-confirm` says it does, when a person must make its change. */
  confirm?: string
  /** True for a component that left the page, like a closed tab's field, with the state it had. */
  offPage?: boolean
  /** True while a person can't use it: disabled, read-only or behind an open modal. */
  disabled?: boolean
  /** The actions it takes now. None while it's disabled. */
  actions: string[]
}

/**
 * A change a call made.
 */
export interface AgentChange {
  component: string
  label?: string
  key: string
  value: unknown
}

/**
 * One step for `act`: a component's ref or label, and one of its `actions` with its arguments.
 */
export interface AgentStep {
  ref: string
  action: string
  args?: unknown[]
}

/**
 * A step an agent asks to run, resolved to its component, for `allow` to decide.
 */
export interface AgentAction {
  ref: string
  component: string
  label?: string
  /** One of the component's `actions`, like `"setValue"`, or `"press"` with the button's text, if any, as its argument. */
  action: string
  args: unknown[]
  /** What `data-agent-confirm` says the step does, when a person must approve it. */
  confirm?: string
}

/** Who changed a component. */
export type ChangeSource = 'mouse' | 'touch' | 'pen' | 'keyboard' | 'programmatic' | 'agent'

/**
 * A change a person or an agent made to a component, as `agent.subscribe` reports it.
 */
export interface ObservedChange {
  /** The component's ref, the same as in the agent's `snapshot`, like `"c4"`. */
  ref: string
  /** The component, like `"select"`. */
  component: string
  /** The component's id, stable for its lifetime. */
  id: string
  /** Its accessible name. */
  label?: string
  /** Other text on its row. */
  row?: string
  /** What changed, like `"value"` or `"open"`. */
  key: string
  /** The new value. `"[redacted]"` for a secret field. */
  value: unknown
  /** The value before the change, redacted the same way. */
  previous: unknown
  /** Why it changed: the agent's action, `"interaction"` or `"programmatic"`. */
  reason: string
  /** Who changed it. */
  source: ChangeSource
}

/** Decides whether a step may run. Return false, or a promise of false, to refuse it. */
export type AgentAllow = (step: AgentAction, context: { signal: AbortSignal }) => boolean | Promise<boolean>

export interface AgentOptions {
  /**
   * Whether a step may run, given its component. Return false, or a promise of
   * false, to refuse it. `signal` aborts when the step stops waiting, so a
   * confirm the app shows can close.
   */
  allow?: AgentAllow
  /** How long a step waits for `allow` before it fails, in milliseconds. 5 minutes by default. */
  timeout?: number
}

export interface AgentQuery {
  text?: string
  within?: string
  kind?: string
  closed?: boolean
  from?: number
}

export interface AgentActResult {
  ok: boolean
  error?: { step: number, message: string }
  steps: { step: number, ref: string, result?: unknown, changes?: AgentChange[], gone?: string[] }[]
  open?: AgentComponent[]
  appeared: AgentComponent[]
  values: Record<string, unknown>
}

export interface AgentTool {
  name: 'act' | 'query' | 'snapshot'
  description: string
  inputSchema: Record<string, unknown>
}

export interface Agent {
  /**
   * Every component on the page, then the ones that left it with `offPage: true`.
   * It takes the tool's input, `{}`, so `agent[call.name](call.input)` works for every tool; the input is ignored.
   */
  snapshot: (input?: unknown) => AgentComponent[]
  /** Runs steps in order, as the agent, and reports what they changed together. */
  act: (input: { steps: AgentStep[] }, options?: { signal?: AbortSignal }) => Promise<AgentActResult>
  /** Finds components and list items without listing the page. */
  query: (input: AgentQuery) => Promise<AgentComponent[] | { error: string }>
  /** Calls `listener` with every change to a component, from a person or an agent, until the returned function runs. */
  subscribe: (listener: (change: ObservedChange) => void) => () => void
  /** `agentTools`: what `act`, `query` and `snapshot` take. */
  tools: readonly AgentTool[]
  /** Stops hearing components and forgets every ref. */
  destroy: () => void
}
