import { beforeEach, describe, expect, it, vi } from 'vitest'
import { components, utilities } from '../constant'
import * as RekaUI from './index'

// The Nuxt module lives in `packages/plugins`, which has no test runner of its own.
const addComponent = vi.fn()
const addImports = vi.fn()

// `@nuxt/kit` is a dependency of the plugins package only, so it is mocked by path.
vi.mock('../../plugins/node_modules/@nuxt/kit', () => ({
  addComponent,
  addImports,
  // v3's module also registers a Vite plugin for its `subpaths` option.
  addVitePlugin: vi.fn(),
  defineNuxtModule: (definition: any) => definition,
}))

async function setup(options: Record<string, unknown> = {}) {
  const module = (await import('../../plugins/src/nuxt/index')).default as any
  module.setup({ ...module.defaults, ...options })
}

function importedNames() {
  return addImports.mock.calls.flatMap(([imports]) => imports).map((entry: any) => entry.name)
}

describe('nuxt module', () => {
  beforeEach(() => {
    addComponent.mockClear()
    addImports.mockClear()
  })

  it('auto-imports every component and composable by default', async () => {
    await setup()

    expect(addComponent).toHaveBeenCalledTimes(Object.values(components).flat().length)
    expect(importedNames()).toEqual(utilities.utilities.filter(name => name !== 'useId'))
  })

  it('imports composables from reka-ui, below the priority of app and layer composables', async () => {
    await setup()

    for (const entry of addImports.mock.calls.flatMap(([imports]) => imports)) {
      expect(entry).toEqual({ name: entry.name, from: 'reka-ui', priority: -1000 })
      // Nuxt registers the composables of extended layers at -1, -2, ...
      expect(entry.priority).toBeLessThan(-100)
      expect(RekaUI).toHaveProperty(entry.name)
    }
  })

  it('leaves out useId, which clashes with the one Nuxt auto-imports', async () => {
    await setup()

    expect(importedNames()).not.toContain('useId')
  })

  it('does not prefix composables', async () => {
    await setup({ prefix: 'Reka' })

    expect(addComponent).toHaveBeenCalledWith({ name: 'RekaAccordionRoot', export: 'AccordionRoot', filePath: 'reka-ui/accordion' })
    expect(importedNames()).toContain('useFilter')
  })

  it('skips composables when `composables` is false', async () => {
    await setup({ composables: false })

    expect(addComponent).toHaveBeenCalled()
    expect(addImports).not.toHaveBeenCalled()
  })

  it('still imports composables when `components` is false', async () => {
    await setup({ components: false })

    expect(addComponent).not.toHaveBeenCalled()
    expect(importedNames()).toContain('useFilter')
  })
})

// Only v2's set is auto-imported. v3's headless `use*` composables (useRender, useAccordion, ...)
// stay explicit imports, so they add no names to every Nuxt app's auto-imports.
it('auto-imports v2\'s composables, each of them exported', () => {
  expect([...utilities.utilities].sort()).toEqual([
    'createContext',
    'createToastManager',
    'useBodyScrollLock',
    'useDateFormatter',
    'useDirection',
    'useEmitAsProps',
    'useFilter',
    'useForwardExpose',
    'useForwardProps',
    'useForwardPropsEmits',
    'useId',
    'useLocale',
    'useStateMachine',
    'useToastManager',
    'withDefault',
  ])
  expect(utilities.utilities.filter(name => !(name in RekaUI))).toEqual([])
})
