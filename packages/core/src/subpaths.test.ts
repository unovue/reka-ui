import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fireEvent, render } from '@testing-library/vue'
import { beforeAll, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { getComponentFamilies, mergeExports, toKebabCase } from '../scripts/families'
import * as RekaUI from './index'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
const exportsMap: Record<string, any> = pkg.exports

/** Subpaths that are not component families. They must keep working. */
const NON_FAMILY_SUBPATHS = ['.', './internal', './constant', './date', './namespaced', './nuxt', './resolver', './package.json']

const familyIndexes = import.meta.glob<Record<string, unknown>>('./*/index.ts', { eager: true })
const barrel = RekaUI as Record<string, unknown>

/** Every `src/<Family>/index.ts`, with the runtime exports the root barrel re-exports from it. */
// (lowercase directories such as `shared` and `date` are not component families)
const sourceFamilies = Object.entries(familyIndexes).filter(([path]) => /^\.\/[A-Z]/.test(path)).map(([path, mod]) => {
  const name = path.split('/')[1]
  const publicKeys = Object.keys(mod).filter(key => key in barrel && barrel[key] === mod[key]).sort()
  return { name, subpath: `./${toKebabCase(name)}`, mod, publicKeys }
})
const publicFamilies = sourceFamilies.filter(family => family.publicKeys.length > 0)
const internalFamilies = sourceFamilies.filter(family => family.publicKeys.length === 0)

describe('per-family subpath exports', () => {
  it('finds the families', () => {
    expect(publicFamilies.length).toBeGreaterThan(60)
    expect(internalFamilies.map(family => family.name)).toEqual(expect.arrayContaining(['Collection', 'Menu', 'Popper']))
  })

  it.each(publicFamilies)('$name is exported from the barrel, so it has the $subpath subpath', ({ subpath }) => {
    expect(Object.keys(exportsMap)).toContain(subpath)
  })

  it.each(internalFamilies)('$name is not exported from the barrel, so it has no subpath', ({ subpath }) => {
    expect(Object.keys(exportsMap)).not.toContain(subpath)
  })

  it('has no subpath without a matching family in the barrel', () => {
    const expected = [...NON_FAMILY_SUBPATHS, ...publicFamilies.map(family => family.subpath)].sort()
    expect(Object.keys(exportsMap).sort()).toEqual(expected)
  })

  it('keeps package.json#exports in sync with the barrel (run `pnpm --filter reka-ui gen:exports`)', () => {
    const generated = mergeExports(exportsMap)
    expect(exportsMap).toEqual(generated)
    expect(Object.keys(exportsMap)).toEqual(Object.keys(generated))
  })

  it('builds every subpath from an entry exposing exactly what the barrel exposes', () => {
    const families = getComponentFamilies()
    expect(families.map(family => family.name).sort()).toEqual(publicFamilies.map(family => family.name).sort())

    for (const family of families) {
      const source = sourceFamilies.find(i => i.name === family.name)!
      const allKeys = Object.keys(source.mod).sort()
      if (!family.generatedSource) {
        // `export *` in the barrel: the family index is the entry, nothing may be hidden from the barrel
        expect(family.entry).toBe(`./src/${family.name}/index.ts`)
        expect(source.publicKeys, family.name).toEqual(allKeys)
      }
      else {
        // Named re-export in the barrel: the generated entry lists the same names
        const names = family.generatedSource.match(/\{([^}]*)\}/)![1].split(',').map(i => i.trim()).filter(i => !i.startsWith('type '))
        expect(names.sort(), family.name).toEqual(source.publicKeys)
      }
    }
  })
})

const dist = (file: string) => join(PACKAGE_DIR, file)
const importDist = (file: string): Promise<Record<string, unknown>> => import(/* @vite-ignore */ pathToFileURL(dist(file)).href)
// `dist` only exists after `pnpm --filter reka-ui build`. Locally the suite is skipped
// without it; on CI a missing build is a failure rather than a silent skip.
const hasDist = existsSync(dist('./dist/index.js')) || !!process.env.CI

describe.skipIf(!hasDist)('built subpaths (dist)', () => {
  let root: Record<string, any>

  // The built barrel is several hundred modules, give it room when the whole suite runs in parallel
  beforeAll(async () => {
    root = await importDist(exportsMap['.'].import)
  }, 120_000)

  it.each(publicFamilies)('$subpath resolves to built files exporting the same objects as the barrel', async ({ subpath, publicKeys }) => {
    const target = exportsMap[subpath].import
    expect(existsSync(dist(target.default)), target.default).toBe(true)
    expect(existsSync(dist(target.types)), target.types).toBe(true)

    const family = await importDist(target.default)
    expect(Object.keys(family).sort()).toEqual(publicKeys)
    for (const key of publicKeys)
      expect(family[key], key).toBe(root[key])
  })

  it('shares context between parts imported from a subpath and from the barrel', async () => {
    const dialog: Record<string, any> = await importDist(exportsMap['./dialog'].import.default)
    expect(dialog.DialogRoot).toBe(root.DialogRoot)
    expect(dialog.injectDialogRootContext).toBe(root.injectDialogRootContext)

    const Mixed = defineComponent({
      render: () => h(dialog.DialogRoot, null, () => [
        h(root.DialogTrigger, null, () => 'Open'),
        h(root.DialogContent, { 'aria-describedby': undefined }, () => [h(dialog.DialogTitle, null, () => 'Title')]),
      ]),
    })
    const { getByText, findByRole } = render(Mixed)
    await fireEvent.click(getByText('Open'))
    expect(await findByRole('dialog')).toHaveTextContent('Title')
  })

  it('does not load unrelated families from a subpath entry', () => {
    const seen = new Set<string>()
    const walk = (file: string) => {
      if (seen.has(file))
        return
      seen.add(file)
      const code = readFileSync(file, 'utf8')
      for (const [, specifier] of code.matchAll(/(?:from|import)\s*"(\.[^"]+)"/g))
        walk(resolve(dirname(file), specifier))
    }
    walk(dist(exportsMap['./aspect-ratio'].import.default))

    const loaded = Array.from(seen, file => relative(dist('./dist'), file).replaceAll('\\', '/'))
    expect(loaded).toContain('AspectRatio/AspectRatio.js')
    expect(loaded.filter(file => /^(?:Dialog|Select|Combobox|Calendar|Popper)\//.test(file))).toEqual([])
    expect(loaded.length).toBeLessThan(40)
  })
})
