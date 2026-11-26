import { describe, expect, it } from 'vitest'
import Fixture from './fixtures/ForwardExpose.vue'
import Nested from './fixtures/ForwardExposeNested.vue'
import { exposed, mount, until } from './utils'

declare const __VAPOR__: boolean

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

  // VDOM's useForwardExpose does not merge a child that already has `$el`, and every
  // useForwardExpose wrapper exposes `$el`, so a second wrapper never sees the leaf getter.
  it.runIf(__VAPOR__)('reads an exposed getter once when forwarded through two wrappers', async () => {
    await mount(Nested)
    const { read } = exposed<{ read: (key: string) => unknown }>()
    // Wait on a plain key so the getter is not consumed while the tree settles
    await until(() => expect(read('ready')).toBe(true))
    expect(read('next')).toBe(1)
    expect(read('next')).toBe(2)
    expect(read('next')).toBe(3)
  })
})
