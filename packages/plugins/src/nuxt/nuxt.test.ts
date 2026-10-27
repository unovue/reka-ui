import type { ModuleOptions } from '.'
import { addComponent, extendViteConfig } from '@nuxt/kit'
import { components } from 'reka-ui/constant'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RekaModule from '.'

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (definition: unknown) => definition,
  addComponent: vi.fn(),
  extendViteConfig: vi.fn(),
}))

interface Definition {
  defaults: ModuleOptions
  setup: (options: ModuleOptions, nuxt: unknown) => void
}
const definition = RekaModule as unknown as Definition

function setup(options: Partial<ModuleOptions> = {}) {
  definition.setup({ ...definition.defaults, ...options }, {})
}

function registered() {
  return vi.mocked(addComponent).mock.calls.map(([options]) => options)
}

function viteConfig(config: Record<string, any> = {}) {
  const [extend, options] = vi.mocked(extendViteConfig).mock.calls[0]
  extend(config)
  return { config, options }
}

const allComponents = Object.values(components).flat()

describe('reka-ui/nuxt', () => {
  beforeEach(() => {
    vi.mocked(addComponent).mockClear()
    vi.mocked(extendViteConfig).mockClear()
  })

  it('registers every component from its family entry point by default', () => {
    setup()
    expect(registered()).toHaveLength(allComponents.length)
    expect(registered()).toContainEqual({ name: 'DialogRoot', export: 'DialogRoot', filePath: 'reka-ui/dialog' })
    expect(registered()).toContainEqual({ name: 'DropdownMenuItem', export: 'DropdownMenuItem', filePath: 'reka-ui/dropdown-menu' })
    expect(registered()).toContainEqual({ name: 'Slot', export: 'Slot', filePath: 'reka-ui/primitive' })
  })

  it('registers every component from the package root with `subpaths: false`', () => {
    setup({ subpaths: false, prefix: 'Reka' })
    expect(registered()).toHaveLength(allComponents.length)
    for (const options of registered())
      expect(options).toEqual({ name: `Reka${options.export}`, export: options.export, filePath: 'reka-ui' })
    expect(extendViteConfig).not.toHaveBeenCalled()
  })

  it('only registers the enabled groups', () => {
    setup({ components: { dialog: true, select: false } })
    expect(new Set(registered().map(options => options.filePath))).toEqual(new Set(['reka-ui/dialog']))
  })

  it('registers nothing with `components: false`', () => {
    setup({ components: false })
    expect(addComponent).not.toHaveBeenCalled()
    expect(extendViteConfig).not.toHaveBeenCalled()
  })

  it('pre-bundles the registered entry points for the client', () => {
    setup({ components: { dialog: true, alertDialog: true } })
    const { config, options } = viteConfig({ optimizeDeps: { include: ['some-dep', 'reka-ui/dialog'] } })
    expect(options).toEqual({ server: false })
    expect(config.optimizeDeps.include).toEqual(['some-dep', 'reka-ui/dialog', 'reka-ui/alert-dialog'])
  })

  it('does not pre-bundle when reka-ui is excluded from optimization', () => {
    setup()
    const { config } = viteConfig({ optimizeDeps: { exclude: ['reka-ui'] } })
    expect(config.optimizeDeps.include).toBeUndefined()
  })
})
