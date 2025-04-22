import type { Ref } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { computed, ref } from 'vue'

export function useNonce(nonce?: Ref<string | undefined>) {
  const context = injectConfigProviderContext({
    nonce: ref(),
  })
  return computed(() => nonce?.value || context.nonce?.value)
}
