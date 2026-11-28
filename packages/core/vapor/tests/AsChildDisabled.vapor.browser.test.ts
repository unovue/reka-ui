import { describe, expect, it } from 'vitest'
import Fixture from './fixtures/AsChildDisabled.vue'
import { byId, mount } from './utils'

describe('asChild disabled (pure Vapor)', () => {
  it('keeps disabled="true" on a plain child with `asChild` when disabled', async () => {
    await mount(Fixture)
    expect(byId('disabled-trigger').getAttribute('disabled')).toBe('true')
    expect(byId('disabled-trigger').getAttribute('aria-disabled')).toBe('true')
  })
})
