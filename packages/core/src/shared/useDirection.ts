import type { Ref } from 'vue'
import type { Direction } from './types'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { computed, ref } from 'vue'

export function useDirection(dir?: Ref<Direction | undefined>) {
  const context = injectConfigProviderContext({
    dir: ref('ltr'),
  })
  return computed(() => dir?.value || context.dir?.value || 'ltr')
}
