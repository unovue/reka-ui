import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fireEvent, render } from '@testing-library/vue'
import ts from 'typescript'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { components } from '../constant'
import { getComponentFamilies, getTypesVersions, mergeExports, syncPackageJson, toKebabCase } from '../scripts/families'
import * as RekaUI from './index'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
const exportsMap: Record<string, any> = pkg.exports

/** Subpaths that are not component families. They must keep working. */
const NON_FAMILY_SUBPATHS = ['.', './internal', './constant', './date', './elements', './elements/global', './elements/react', './namespaced', './nuxt', './resolver', './package.json']

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

  it('keeps package.json#typesVersions in sync with the barrel (run `pnpm --filter reka-ui gen:exports`)', () => {
    expect(pkg.typesVersions).toEqual(getTypesVersions(exportsMap))
    for (const [subpath, [types]] of Object.entries(pkg.typesVersions['*'] as Record<string, string[]>)) {
      expect(Object.keys(exportsMap)).toContain(`./${subpath}`)
      expect(types).toMatch(/^\.\/dist\/.+\.d\.m?ts$/)
    }
    expect(JSON.stringify(syncPackageJson(pkg))).toBe(JSON.stringify(pkg))
  })

  // The resolver and the Nuxt module import each component from `reka-ui/<kebab-case group>`
  it.each(Object.entries(components))('the %s components in reka-ui/constant come from the family subpath of the same name', (group, names) => {
    const subpath = `./${toKebabCase(group)}`
    expect(Object.keys(exportsMap)).toContain(subpath)
    const family = publicFamilies.find(i => i.subpath === subpath)!
    expect(family.publicKeys).toEqual(expect.arrayContaining([...names]))
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

  // A part rendered inside a root imported from another entry point only finds the root's
  // context when both entries share one module instance (one `createContext` call, one key).
  it('shares Select context between subpath and barrel parts', async () => {
    const select: Record<string, any> = await importDist(exportsMap['./select'].import.default)
    const Mixed = defineComponent({
      render: () => h(select.SelectRoot, { defaultOpen: true, defaultValue: 'apple' }, () => [
        h(root.SelectTrigger, null, () => h(select.SelectValue)),
        h(root.SelectPortal, null, () => h(select.SelectContent, { position: 'popper' }, () => h(root.SelectViewport, null, () => [
          h(select.SelectItem, { value: 'apple' }, () => h(root.SelectItemText, null, () => 'Apple')),
          h(root.SelectItem, { value: 'pear' }, () => h(select.SelectItemText, null, () => 'Pear')),
        ]))),
      ]),
    })
    const { findAllByRole, findByRole } = render(Mixed)
    expect(await findByRole('listbox')).toBeTruthy()
    expect((await findAllByRole('option')).map(i => i.textContent)).toEqual(['Apple', 'Pear'])
  })

  it('shares Combobox and Listbox context between subpath and barrel parts', async () => {
    const combobox: Record<string, any> = await importDist(exportsMap['./combobox'].import.default)
    const Mixed = defineComponent({
      render: () => h(root.ComboboxRoot, { defaultOpen: true }, () => [
        h(combobox.ComboboxAnchor, null, () => h(root.ComboboxInput, { 'aria-label': 'Fruit' })),
        h(combobox.ComboboxContent, null, () => h(root.ComboboxViewport, null, () => [
          h(combobox.ComboboxItem, { value: 'apple' }, () => 'Apple'),
          h(root.ComboboxItem, { value: 'pear' }, () => 'Pear'),
        ])),
      ]),
    })
    const { findAllByRole, getByRole } = render(Mixed)
    expect((await findAllByRole('option')).map(i => i.textContent)).toEqual(['Apple', 'Pear'])
    expect(getByRole('combobox').getAttribute('aria-expanded')).toBe('true')
  })

  it('shares DropdownMenu and Menu context between subpath and barrel parts', async () => {
    const dropdown: Record<string, any> = await importDist(exportsMap['./dropdown-menu'].import.default)
    const Mixed = defineComponent({
      render: () => h(dropdown.DropdownMenuRoot, { defaultOpen: true, modal: false }, () => [
        h(root.DropdownMenuTrigger, null, () => 'Menu'),
        h(dropdown.DropdownMenuPortal, null, () => h(root.DropdownMenuContent, null, () => [
          h(dropdown.DropdownMenuItem, null, () => 'Edit'),
          h(root.DropdownMenuItem, null, () => 'Delete'),
        ])),
      ]),
    })
    const { findAllByRole, findByRole } = render(Mixed)
    expect(await findByRole('menu')).toBeTruthy()
    expect((await findAllByRole('menuitem')).map(i => i.textContent)).toEqual(['Edit', 'Delete'])
  })

  it('shares Slider context between the color-slider and slider subpaths and the barrel', async () => {
    const colorSlider: Record<string, any> = await importDist(exportsMap['./color-slider'].import.default)
    const slider: Record<string, any> = await importDist(exportsMap['./slider'].import.default)
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    const sliderValue = ref<unknown>()
    // `ColorSliderRoot` renders a `SliderRoot`, which provides the Slider context
    const Probe = defineComponent({
      setup() {
        sliderValue.value = slider.injectSliderRootContext().modelValue.value
        return () => null
      },
    })
    const Mixed = defineComponent({
      render: () => h(colorSlider.ColorSliderRoot, { defaultValue: '#ff0000', channel: 'hue', colorSpace: 'hsl' }, () => [
        h(root.ColorSliderTrack, null, () => h(Probe)),
        h(root.ColorSliderThumb),
      ]),
    })
    const { findByRole } = render(Mixed)
    expect((await findByRole('slider')).getAttribute('aria-valuenow')).toBe('0')
    expect(sliderValue.value).toEqual([0])
    vi.unstubAllGlobals()
  })

  // The resolver and the Nuxt module write `typeof import('reka-ui/<family>')` into `components.d.ts`
  it.each(['bundler', 'node16', 'node10'] as const)('resolves subpath types with moduleResolution: %s', (moduleResolution) => {
    const dir = mkdtempSync(join(tmpdir(), 'reka-ui-subpath-types-'))
    try {
      mkdirSync(join(dir, 'node_modules'))
      symlinkSync(PACKAGE_DIR, join(dir, 'node_modules/reka-ui'), 'junction')
      symlinkSync(dirname(fileURLToPath(import.meta.resolve('vue/package.json'))), join(dir, 'node_modules/vue'), 'junction')
      writeFileSync(join(dir, 'package.json'), '{ "type": "module" }')
      writeFileSync(join(dir, 'index.ts'), [
        `import type { DialogRootProps } from 'reka-ui/dialog'`,
        `import { DialogRoot } from 'reka-ui'`,
        `import { ColorSliderRoot } from 'reka-ui/color-slider'`,
        `import { DialogRoot as SubpathDialogRoot } from 'reka-ui/dialog'`,
        `import { DropdownMenuRoot } from 'reka-ui/dropdown-menu'`,
        `import { Primitive } from 'reka-ui/primitive'`,
        `export const props: DialogRootProps = { defaultOpen: true }`,
        `export const same: typeof DialogRoot = SubpathDialogRoot`,
        `export const parts = [ColorSliderRoot, DropdownMenuRoot, Primitive]`,
        `export type Root = typeof import('reka-ui/select')['SelectRoot']`,
        `// @ts-expect-error a subpath only exports its own family`,
        `export type Missing = typeof import('reka-ui/select')['DialogRoot']`,
        `// @ts-expect-error the root import keeps its types`,
        `export type MissingRoot = typeof import('reka-ui')['NotAComponent']`,
        // Hand-written entries (the plugin entries are built by `packages/plugins` and not checked here)
        `export type Units = typeof import('reka-ui/date')['CALENDAR_UNITS']`,
        `export type MenuContent = typeof import('reka-ui/internal')['MenuContent']`,
        `export type Groups = typeof import('reka-ui/constant')['components']`,
        `// @ts-expect-error hand-written entries keep their own exports`,
        `export type MissingDate = typeof import('reka-ui/date')['DialogRoot']`,
      ].join('\n'))

      const program = ts.createProgram([join(dir, 'index.ts')], {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        module: moduleResolution === 'node16' ? ts.ModuleKind.Node16 : ts.ModuleKind.ESNext,
        moduleResolution: {
          bundler: ts.ModuleResolutionKind.Bundler,
          node16: ts.ModuleResolutionKind.Node16,
          node10: ts.ModuleResolutionKind.Node10,
        }[moduleResolution],
        // TypeScript 6 deprecates node10 resolution; consumers still use it.
        ...(moduleResolution === 'node10' ? { ignoreDeprecations: '6.0' } : {}),
      })
      const diagnostics = ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      expect(diagnostics).toEqual([])
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 120_000)

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
