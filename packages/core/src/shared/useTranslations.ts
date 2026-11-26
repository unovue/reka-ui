import type { Translate } from './translations'
import { hasInjectionContext } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { defaultTranslate } from './translations'

/**
 * The translate function of the nearest `ConfigProvider`, or the built-in
 * English one. It is shared by every component under that provider, so a
 * component that calls this holds nothing of its own.
 *
 * Outside `setup()` (a headless composable called on its own) there is no
 * provider to look up, so it returns the English one.
 */
export function useTranslations(): Translate {
  if (!hasInjectionContext())
    return defaultTranslate
  return injectConfigProviderContext(null)?.translate ?? defaultTranslate
}
