import type { DefaultMessages, Translate } from './translations'
import { hasInjectionContext } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { messagesTranslate } from './translations'

/**
 * The translate function of the nearest `ConfigProvider`, or the built-in
 * English one over `messages`: the `*Messages` objects of the keys the
 * component looks up. It is shared by every component under that provider (or
 * with those messages), so a component that calls this holds nothing of its own.
 *
 * Outside `setup()` (a headless composable called on its own) there is no
 * provider to look up, so it returns the English one.
 */
export function useTranslations(messages: DefaultMessages): Translate {
  if (!hasInjectionContext())
    return messagesTranslate(messages)
  return injectConfigProviderContext(null)?.translate ?? messagesTranslate(messages)
}
