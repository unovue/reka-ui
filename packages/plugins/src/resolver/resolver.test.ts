import type { ComponentResolverObject } from 'unplugin-vue-components'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { components } from 'reka-ui/constant'
import { describe, expect, it } from 'vitest'
import RekaResolver from '.'
import { toKebabCase } from '../../../core/scripts/families'
import { getComponentSource } from '../shared'

const require = createRequire(import.meta.url)
const corePackage = JSON.parse(readFileSync(require.resolve('reka-ui/package.json'), 'utf8'))
const allComponents = Object.values(components).flat()

function resolve(name: string, options: Parameters<typeof RekaResolver>[0] = { subpaths: true }) {
  return (RekaResolver(options) as ComponentResolverObject).resolve(name)
}

describe('reka-ui/resolver', () => {
  it('imports components from the package root by default', () => {
    for (const name of allComponents)
      expect((RekaResolver() as ComponentResolverObject).resolve(name)).toEqual({ name, from: 'reka-ui' })
  })

  it('imports components from their family entry point with `subpaths: true`', () => {
    expect(resolve('DialogRoot')).toEqual({ name: 'DialogRoot', from: 'reka-ui/dialog' })
    expect(resolve('AlertDialogAction')).toEqual({ name: 'AlertDialogAction', from: 'reka-ui/alert-dialog' })
    expect(resolve('ColorSwatchPickerItem')).toEqual({ name: 'ColorSwatchPickerItem', from: 'reka-ui/color-swatch-picker' })
    expect(resolve('Slot')).toEqual({ name: 'Slot', from: 'reka-ui/primitive' })
  })

  it('imports components from the package root with `subpaths: false`', () => {
    for (const name of allComponents)
      expect(resolve(name, { subpaths: false })).toEqual({ name, from: 'reka-ui' })
  })

  it('strips the prefix', () => {
    expect(resolve('RekaDialogRoot', { prefix: 'Reka', subpaths: true })).toEqual({ name: 'DialogRoot', from: 'reka-ui/dialog' })
    expect(resolve('DialogRoot', { prefix: 'Reka', subpaths: true })).toBeUndefined()
  })

  it('ignores components that are not part of reka-ui', () => {
    expect(resolve('RouterLink')).toBeUndefined()
    expect(resolve('useForwardProps')).toBeUndefined()
  })

  it.each(allComponents)('resolves %s to an entry point that exports it', async (name) => {
    const { from } = resolve(name) as { from: string }
    expect(Object.keys(corePackage.exports)).toContain(`./${from.slice('reka-ui/'.length)}`)
    const entry = await import(/* @vite-ignore */ from)
    expect(entry[name], `${from} exports ${name}`).toBeDefined()
  })

  // `shared.ts` cannot import the core build script, so check that both name the same subpath
  it.each(Object.keys(components))('maps the %s group like the core exports generator', (group) => {
    expect(getComponentSource(group as keyof typeof components, true)).toBe(`reka-ui/${toKebabCase(group)}`)
  })
})
