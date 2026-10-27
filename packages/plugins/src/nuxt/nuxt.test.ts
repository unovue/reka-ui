import type { ModuleOptions } from '.'
import { addComponent, addVitePlugin } from '@nuxt/kit'
import { components } from 'reka-ui/constant'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RekaModule from '.'

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (definition: unknown) => definition,
  addComponent: vi.fn(),
  addVitePlugin: vi.fn(),
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

interface ConfigPlugin { name: string, config: (config: Record<string, any>) => void }

function viteConfig(config: Record<string, any> = {}) {
  expect(addVitePlugin).toHaveBeenCalledTimes(1)
  const [plugin, options] = vi.mocked(addVitePlugin).mock.calls[0] as unknown as [ConfigPlugin, unknown]
  plugin.config(config)
  return { config, options, plugin }
}

const allComponents = Object.values(components).flat()

describe('reka-ui/nuxt', () => {
  beforeEach(() => {
    vi.mocked(addComponent).mockClear()
    vi.mocked(addVitePlugin).mockClear()
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
    expect(addVitePlugin).not.toHaveBeenCalled()
  })

  it('only registers the enabled groups', () => {
    setup({ components: { dialog: true, select: false } })
    expect(new Set(registered().map(options => options.filePath))).toEqual(new Set(['reka-ui/dialog']))
  })

  it('registers nothing with `components: false`', () => {
    setup({ components: false })
    expect(addComponent).not.toHaveBeenCalled()
    expect(addVitePlugin).not.toHaveBeenCalled()
  })

  it('pre-bundles reka-ui and the registered entry points for the client', () => {
    setup({ components: { dialog: true, alertDialog: true } })
    const { config, options, plugin } = viteConfig({ optimizeDeps: { include: ['some-dep', 'reka-ui/dialog'] } })
    expect(plugin.name).toBe('reka-ui:optimize-deps')
    expect(options).toEqual({ server: false })
    expect(config.optimizeDeps.include).toEqual(['some-dep', 'reka-ui/dialog', 'reka-ui', 'reka-ui/alert-dialog'])
  })

  it('pre-bundles into an empty config', () => {
    setup({ components: { dialog: true } })
    expect(viteConfig().config).toEqual({ optimizeDeps: { include: ['reka-ui', 'reka-ui/dialog'] } })
  })

  it.each([
    ['top-level', { optimizeDeps: { exclude: ['reka-ui'] } }],
    ['client environment', { environments: { client: { optimizeDeps: { exclude: ['reka-ui'] } } } }],
  ])('pre-bundles nothing when reka-ui is excluded (%s)', (_, config) => {
    setup()
    expect(viteConfig(config).config.optimizeDeps.include).toBeUndefined()
  })

  it('skips the entry points the app excludes', () => {
    setup({ components: { dialog: true, select: true } })
    const { config } = viteConfig({ optimizeDeps: { exclude: ['reka-ui/select'] }, environments: { client: { optimizeDeps: { exclude: ['reka-ui/dialog'] } } } })
    expect(config.optimizeDeps.include).toEqual(['reka-ui'])
  })
})
