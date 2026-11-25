// `reka-ui/agent`: the opt-in agent bridge. Nothing here runs, and no component
// pays for it, until `createAgent` (or `AgentPlugin`) is called.
export { createAgent } from './agent'
export { agentKey, AgentPlugin, type AgentPluginOptions, useAgent } from './plugin'
export { agentTools } from './tools'
export type {
  Agent,
  AgentAction,
  AgentActResult,
  AgentAllow,
  AgentChange,
  AgentComponent,
  AgentOptions,
  AgentQuery,
  AgentStep,
  AgentTool,
  ChangeSource,
  ObservedChange,
} from './types'
export { registerTools } from './webmcp'
