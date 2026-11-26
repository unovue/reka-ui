import type { App, InjectionKey } from 'vue'
import type { Agent, AgentAllow, AgentOptions } from './types'
import { inject } from 'vue'
import { createAgent } from './agent'
import { registerTools } from './webmcp'

export interface AgentPluginOptions extends AgentOptions {
  /** Registers the tools with the browser's agent through WebMCP, with this `allow` for its steps. */
  webmcp?: { allow: AgentAllow }
}

export const agentKey: InjectionKey<Agent> = Symbol('reka-ui:agent')

/**
 * `app.use(AgentPlugin, options)`: creates the bridge before `app.mount()`, so
 * it hears every component, provides it to `useAgent()`, and with `webmcp`
 * registers its tools with the browser. Unmounting the app removes both.
 */
export const AgentPlugin = {
  install(app: App, options: AgentPluginOptions = {}) {
    const { webmcp, ...agentOptions } = options
    const agent = createAgent(agentOptions)
    const unregister = webmcp ? registerTools(agent, webmcp) : undefined
    app.provide(agentKey, agent)
    const unmount = app.unmount.bind(app)
    app.unmount = () => {
      unmount()
      unregister?.()
      agent.destroy()
    }
  },
}

/** The agent `AgentPlugin` created, from inside a component. */
export function useAgent() {
  return inject(agentKey, null)
}
