import { describe, expect, it } from 'vitest'
import Fixture from './fixtures/ForwardExpose.vue'
import { exposed, mount, until } from './utils'

describe('useForwardExpose (pure Vapor)', () => {
  it('lets a forwarded child\'s exposed key win over the component\'s own, as the VDOM entry does', async () => {
    await mount(Fixture)
    const { read } = exposed<{ read: (key: string) => unknown }>()
    await until(() => expect(read('childOnly')).toBe('child-only'))
    expect(read('ownOnly')).toBe('own-only')
    expect(read('label')).toBe('child')
  })

  it('lets the component\'s own exposed key win over a property the child only inherits', async () => {
    await mount(Fixture)
    const { read } = exposed<{ read: (key: string) => unknown }>()
    await until(() => expect(read('childOnly')).toBe('child-only'))
    // `toString` is on every object's prototype, but the child does not expose it
    expect((read('toString') as () => string)()).toBe('own-to-string')
  })
})
