import { resolve } from 'node:path'
import ts from 'typescript'
import { expect, it } from 'vitest'
import { components, utilities } from '../constant'
import * as RekaUI from './index'

const exportedComponents = Object.keys(RekaUI).filter(exp => !exp.includes('inject'))
const constants = [...Object.values(components).flat(), ...Object.values(utilities).flat()]

it.each(constants)('it should export %s', (component) => {
  expect(exportedComponents).toContain(component)
})

/**
 * Every name the entry exports, type-only ones included. Types do not exist at runtime, so the
 * names are read from the module's export table through the TypeScript compiler. Only binding is
 * needed for that: nothing is type-checked and the default library is not loaded.
 */
function getStaticExportNames() {
  const entry = resolve(__dirname, 'index.ts')
  const program = ts.createProgram([entry], {
    allowJs: false,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noLib: true,
    noResolve: false,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    types: [],
  })
  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(entry)!)!
  return checker.getExportsOfModule(moduleSymbol).map(symbol => symbol.getName())
}

const sortNames = (names: string[]) => [...new Set(names)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

// A rename or removal of a public export, value or type, shows up as a diff of the snapshot file.
// After an intended change, update it with `pnpm --filter reka-ui exec vitest run src/index.test.ts -u`
it('keeps the public export names', async () => {
  const runtimeNames = sortNames(Object.keys(RekaUI))
  const staticNames = sortNames(getStaticExportNames())

  // The static list has to see at least everything that exists at runtime, otherwise an export
  // the compiler could not follow would silently drop its types from the snapshot
  expect(runtimeNames.filter(name => !staticNames.includes(name))).toEqual([])

  const typeNames = staticNames.filter(name => !runtimeNames.includes(name))
  expect(typeNames.length).toBeGreaterThan(0)

  const content = [
    `# values (${runtimeNames.length})`,
    ...runtimeNames,
    '',
    `# types (${typeNames.length})`,
    ...typeNames,
    '',
  ].join('\n')

  await expect(content).toMatchFileSnapshot('./__snapshots__/index.exports.txt')
})
