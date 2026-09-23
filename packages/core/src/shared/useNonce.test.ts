import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useNonce } from './useNonce'

describe('useNonce', () => {
  vi.mock('@/ConfigProvider/ConfigProvider.vue', async () => {
    return {
      injectConfigProviderContext: () => {
        return {
          nonce: ref('global-nonce'),
        }
      },
    }
  })

  it('should return global nonce value from ConfigProvider', () => {
    const nonce = useNonce()
    expect(nonce.value).toBe('global-nonce')
  })

  it('should return local nonce value when overridden', () => {
    const nonce = useNonce(ref('local-nonce'))
    expect(nonce.value).toBe('local-nonce')
  })
})
