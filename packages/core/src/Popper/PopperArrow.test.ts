import { describe, expect, it, vi } from 'vitest'

vi.mock('@floating-ui/vue', () => {
  throw new Error('@floating-ui/vue should not be loaded')
})

describe('popperArrow', () => {
  it('should not depend on PopperContent or @floating-ui/vue', async () => {
    await expect(import('./PopperArrow.vue')).resolves.toHaveProperty('default')
  })
})
