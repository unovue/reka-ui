import { describe, expect, it } from 'vitest'
import { flatten } from './utils'

describe('flatten', () => {
  it('walks `children` depth-first by default', () => {
    const items = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }] }, { id: 'd' }]
    expect(flatten<{ id: string }>(items).map(i => i.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('follows a custom getChildren at every level', () => {
    type Dir = { id: string, nodes?: Dir[], children?: Dir[] }
    const items: Dir[] = [{ id: 'a', nodes: [{ id: 'b', nodes: [{ id: 'c' }], children: [{ id: 'ignored' }] }] }]
    expect(flatten(items, d => d.nodes).map(i => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('treats an empty children array like none', () => {
    expect(flatten([{ id: 'a', children: [] }]).map(i => i.id)).toEqual(['a'])
  })
})
