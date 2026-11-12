import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'

const src = join(__dirname, '..')

// The build keeps template comments, so a comment next to a single root turns it into a dev-only
// fragment: the development runtime still passes fallthrough attributes to the root, production
// drops them (the `class` of a consumer's submenu content, say).
describe('part templates', () => {
  it('have no comment next to a single root element', () => {
    const offenders = readdirSync(src, { recursive: true })
      .map(String)
      .filter(file => file.endsWith('.vue') && !file.split(/[\\/]/).includes('story'))
      .filter((file) => {
        const ast = parse(readFileSync(join(src, file), 'utf8')).descriptor.template?.ast
        if (!ast)
          return false
        // 1: element, 3: comment, 2: text
        const roots = ast.children.filter(node => node.type !== 2 || node.content.trim())
        return roots.filter(node => node.type === 1).length === 1 && roots.some(node => node.type === 3)
      })

    expect(offenders).toEqual([])
  })
})
