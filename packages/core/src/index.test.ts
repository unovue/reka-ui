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
const exportedVueComponents = Object.entries(RekaUI)
  .filter(([, value]) => typeof value === 'object' && value !== null && ('setup' in value || 'render' in value || '__name' in value))
  .map(([name]) => name)

it('finds the exported components', () => {
  expect(exportedVueComponents).toEqual(expect.arrayContaining(['DialogRoot', 'Primitive', 'ScrollAreaScrollbarGlimpse']))
})

it.each(exportedVueComponents)('lists the exported component %s in constant/components.ts', (component) => {
  expect(listedComponents.has(component)).toBe(true)
})
