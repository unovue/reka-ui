import type { Agent, AgentAllow } from './types'
import { allowing } from './agent'
import { agentTools } from './tools'

interface ModelContext {
  registerTool: (tool: object, options?: { signal?: AbortSignal }) => unknown
  unregisterTool?: (name: string) => unknown
}

// WebMCP's `modelContext`: on `document` in the current spec, on `navigator` in the Chrome builds that shipped it first.
function modelContextOf(): ModelContext | undefined {
  const fromDocument = (globalThis.document as { modelContext?: ModelContext } | undefined)?.modelContext
  const fromNavigator = (globalThis.navigator as { modelContext?: ModelContext } | undefined)?.modelContext
  const context = fromDocument ?? fromNavigator
  return typeof context?.registerTool === 'function' ? context : undefined
}

/**
 * Registers an agent's three tools with the browser's own agent through
 * WebMCP (`document.modelContext.registerTool`, or `navigator.modelContext`
 * where a browser shipped it there), and does nothing where neither exists.
 * Returns a function that unregisters them.
 *
 * The browser's agent isn't one you wrote, so `allow` is required: it decides
 * each step that agent asks for, after the agent's own `allow`. A step with
 * `confirm` is one the page marked for a person, and `true` answers for them.
 *
 * @example
 * registerTools(agent, { allow: step => step.action !== 'press' || window.confirm(`Press ${step.args[0]}?`) })
 */
export function registerTools(agent: Agent, { allow }: { allow: AgentAllow }) {
  if (typeof allow !== 'function')
    throw new Error('registerTools needs an `allow` that decides each step.')
  const context = modelContextOf()
  const controller = new AbortController()
  const own = allowing.get(agent)
  if (!context || !own)
    return () => controller.abort()
  const registered: { unregister?: () => unknown }[] = []
  // Names registered without a handle back, for the legacy `unregisterTool(name)` cleanup.
  const named = new Set<string>()
  for (const tool of agentTools) {
    const definition = {
      ...tool,
      // Labels and text come from the page, which can hold what users wrote, and `act` can press any button.
      annotations: {
        readOnlyHint: tool.name === 'snapshot',
        untrustedContentHint: true,
        consequentialHint: tool.name === 'act',
      },
      execute: (input: any, options?: { signal?: AbortSignal }) =>
        tool.name === 'snapshot'
          ? agent.snapshot()
          : tool.name === 'act'
            ? own.act(input, allow, options?.signal)
            : own.query(input, allow, options?.signal),
    }
    try {
      const result = context.registerTool(definition, { signal: controller.signal }) as { unregister?: () => unknown, catch?: (handler: (error: unknown) => void) => unknown } | undefined
      if (result && typeof result.unregister === 'function')
        registered.push(result)
      else
        named.add(tool.name)
      // A page whose permissions policy turns WebMCP off, or an unregister before the browser finished, isn't a mistake.
      result?.catch?.((error: unknown) => {
        // A name this call didn't get, like one another registration holds, is never this call's to unregister.
        named.delete(tool.name)
        const name = (error as { name?: string } | undefined)?.name
        if (import.meta.env.DEV && name !== 'NotAllowedError' && name !== 'AbortError')
          console.warn(`[reka-ui] registerTools couldn't register ${tool.name}.`, error)
      })
    }
    catch (error) {
      if (import.meta.env.DEV)
        console.warn(`[reka-ui] registerTools couldn't register ${tool.name}.`, error)
    }
  }
  return () => {
    if (controller.signal.aborted)
      return
    controller.abort()
    for (const handle of registered) {
      try {
        handle.unregister?.()
      }
      catch {}
    }
    if (typeof context.unregisterTool === 'function') {
      for (const name of named) {
        try {
          context.unregisterTool(name)
        }
        catch {}
      }
    }
  }
}
