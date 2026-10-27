import { expect, it } from 'vitest'
import { components, utilities } from '../constant'
import * as RekaUI from './index'

const exportedComponents = Object.keys(RekaUI).filter(exp => !exp.includes('inject'))
const constants = [...Object.values(components).flat(), ...Object.values(utilities).flat()]

it.each(constants)('it should export %s', (component) => {
  expect(exportedComponents).toContain(component)
})

// The resolver, the Nuxt module and `reka-ui/namespaced` only know the components listed in `constant`
const listedComponents = new Set<string>(Object.values(components).flat())
/**
 * Exported, but implementation details that are never written in a template:
 * - `ScrollAreaScrollbarGlimpse` is what `ScrollAreaScrollbar` renders for `type="glimpse"`, like its
 *   unexported `auto` / `hover` / `scroll` siblings.
 */
const notAutoImported = ['ScrollAreaScrollbarGlimpse']
const exportedVueComponents = Object.entries(RekaUI)
  .filter(([, value]) => typeof value === 'object' && value !== null && ('setup' in value || 'render' in value || '__name' in value))
  .map(([name]) => name)
  .filter(name => !notAutoImported.includes(name))

it('finds the exported components', () => {
  expect(exportedVueComponents).toEqual(expect.arrayContaining(['DialogRoot', 'Primitive', 'DrawerProvider']))
  for (const name of notAutoImported) {
    expect(RekaUI).toHaveProperty(name)
    expect(listedComponents.has(name), name).toBe(false)
  }
})

it.each(exportedVueComponents)('lists the exported component %s in constant/components.ts', (component) => {
  expect(listedComponents.has(component)).toBe(true)
})
