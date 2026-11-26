import type { Translate } from './translations'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { defaultTranslate } from './translations'

/**
 * The translate function of the nearest `ConfigProvider`, or the built-in
 * English one. It is shared by every component under that provider, so a
 * component that calls this holds nothing of its own.
 */
export function useTranslations(): Translate {
  return injectConfigProviderContext(null)?.translate ?? defaultTranslate
}
