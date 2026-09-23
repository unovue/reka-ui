import * as vue from 'vue'
// Inspired from https://github.com/tailwindlabs/headlessui/issues/2913
// as the alternative, and a fallback for Vue version < 3.5
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

let count = 0
/**
 * The `useId` function generates a unique identifier using a provided deterministic ID,
 * a configured `<ConfigProvider>` ID source, Vue's native `useId`, or a fallback counter.
 * @param {string | null | undefined} [deterministicId] - The `useId` function you provided takes an
 * optional parameter `deterministicId`, which can be a string, null, or undefined. If
 * `deterministicId` is provided, the function will return it. Otherwise, it will generate an id using
 * the configured ID source.
 */
export function useId(deterministicId?: string | null | undefined, prefix = 'reka') {
  if (deterministicId)
    return deterministicId

  let id: string
  const configProviderContext = injectConfigProviderContext({ useId: undefined })

  // Keep the app-provided ID source authoritative. Frameworks such as Nuxt can
  // prerender with a different Vue app ID prefix than the hydrating client, so
  // falling through to Vue's native useId would bypass the stable source that
  // ConfigProvider was explicitly given.
  if (configProviderContext.useId) {
    id = configProviderContext.useId()
  }
  else if ('useId' in vue) {
    id = vue.useId?.()
  }
  else {
    id = `${++count}`
  }

  return prefix ? `${prefix}-${id}` : id
}
