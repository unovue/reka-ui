import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

/**
 * The exact reka-ui version, replaced at build time (see `tsdown.config.ts`).
 * Falls back to `'dev'` when the source is compiled without the define.
 */
const VERSION = typeof __REKA_UI_VERSION__ === 'string' ? __REKA_UI_VERSION__ : 'dev'

function getSymbolDescription(providerComponentName: string | string[], contextName?: string) {
  return contextName
    ?? (typeof providerComponentName === 'string'
      ? `${providerComponentName}Context`
      : providerComponentName.join('/'))
}

function createContextWithKey<ContextValue>(
  providerComponentName: string | string[],
  injectionKey: InjectionKey<ContextValue | null>,
) {
  /**
   * @param fallback The context value to return if the injection fails.
   *
   * @throws When context injection failed and no fallback is specified.
   * This happens when the component injecting the context is not a child of the root component providing the context.
   */
  const injectContext = <
    T extends ContextValue | null | undefined = ContextValue,
  >(
    fallback?: T,
  ): T extends null ? ContextValue | null : ContextValue => {
    const context = inject(injectionKey, fallback)
    if (context)
      return context

    if (context === null)
      return context as any

    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within ${
        Array.isArray(providerComponentName)
          ? `one of the following components: ${providerComponentName.join(
            ', ',
          )}`
          : `\`${providerComponentName}\``
      }`,
    )
  }

  const provideContext = (contextValue: ContextValue) => {
    provide(injectionKey, contextValue)
    return contextValue
  }

  return [injectContext, provideContext] as const
}

/**
 * @param providerComponentName - The name(s) of the component(s) providing the context.
 *
 * There are situations where context can come from multiple components. In such cases, you might need to give an array of component names to provide your context, instead of just a single string.
 *
 * @param contextName The description for injection key symbol.
 */
export function createContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string,
) {
  const injectionKey: InjectionKey<ContextValue | null> = Symbol(getSymbolDescription(providerComponentName, contextName))
  return createContextWithKey<ContextValue>(providerComponentName, injectionKey)
}

/**
 * Create a context keyed in the global symbol registry under `reka-ui@<version>:<name>`.
 *
 * @internal
 */
export function createVersionedContext<ContextValue>(
  version: string,
  providerComponentName: string | string[],
  contextName?: string,
) {
  const injectionKey: InjectionKey<ContextValue | null> = Symbol.for(`reka-ui@${version}:${getSymbolDescription(providerComponentName, contextName)}`)
  return createContextWithKey<ContextValue>(providerComponentName, injectionKey)
}

/**
 * Internal variant of {@link createContext} for reka-ui's own contexts.
 *
 * The key lives in the global symbol registry and includes the exact package
 * version, so two copies of the same reka-ui version (e.g. a duplicated
 * install sharing one Vue) can provide and inject each other's contexts,
 * while different versions stay isolated.
 *
 * @internal
 */
export function createRekaContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string,
) {
  return createVersionedContext<ContextValue>(VERSION, providerComponentName, contextName)
}
