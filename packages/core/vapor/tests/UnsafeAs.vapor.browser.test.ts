import { describe, expect, it, vi } from 'vitest'
import Fixture from './fixtures/UnsafeAs.vue'
import { byId, mount } from './utils'

describe('primitive `as` (pure Vapor)', () => {
  it('renders a div for a tag name with `_` or `.` outside a custom element name, and warns once per value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await mount(Fixture)
      await mount(Fixture)
      expect(byId('unsafe-underscore').tagName).toBe('DIV')
      expect(byId('unsafe-dot').tagName).toBe('DIV')
      expect(byId('unsafe-script').tagName).toBe('DIV')
      // custom element names (they contain a `-`) may use `_` and `.`
      expect(byId('custom-element').tagName).toBe('MY-EL.X_Y')
      const unsafe = warn.mock.calls.map(call => String(call[0])).filter(message => message.includes('unsafe `as`'))
      expect(unsafe).toHaveLength(3)
      expect(unsafe[0]).toContain('"my_el"')
    }
    finally {
      warn.mockRestore()
    }
  })
})
