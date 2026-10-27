/*
 * The built declarations, type-checked as an app on TypeScript 5.9 and 6
 * would. Reka UI's types name the global `Temporal`, which TypeScript 6 has in
 * its `esnext.temporal` lib and TypeScript 5 only gets from a polyfill's types.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts6 from 'typescript'
import ts5 from 'typescript-5'
import { describe, expect, it } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../..')
// Like `subpaths.test.ts`: skipped locally without a build, a failure on CI.
const hasDist = existsSync(join(PACKAGE_DIR, 'dist/index.d.ts')) || !!process.env.CI

// Dev dependencies of this package (`temporal-polyfill-lite` exports no `./package.json`).
const packageDir = (name: string) => join(PACKAGE_DIR, 'node_modules', name)

/** A date consumer: `DateValue` must be the Temporal union, not `any`. */
const DATE_CONSUMER = [
  `import type { CalendarRootProps, DateValue } from 'reka-ui'`,
  `import { isPlainDate, toIsoString } from 'reka-ui/date'`,
  `declare const value: DateValue`,
  `export const plain: boolean = isPlainDate(value)`,
  `export const iso: string = toIsoString(value)`,
  `export const year: number = value.year`,
  `export const props: CalendarRootProps = { modelValue: value }`,
  `// @ts-expect-error a number is not a DateValue (this fails if DateValue is \`any\`)`,
  `export const notADate: DateValue = 42`,
  `// @ts-expect-error DateValue has no \`foo\` (this fails if DateValue is \`any\`)`,
  `export const missing = value.foo`,
].join('\n')

/** A consumer of the other components only. */
const NON_DATE_CONSUMER = [
  `import type { DialogRootProps } from 'reka-ui'`,
  `import { CheckboxRoot, DialogRoot } from 'reka-ui'`,
  `import { SelectRoot } from 'reka-ui/select'`,
  `export const props: DialogRootProps = { defaultOpen: true }`,
  `export const parts = [CheckboxRoot, DialogRoot, SelectRoot]`,
].join('\n')

function typeCheck(ts: typeof ts6, source: string, { lib, temporalTypes }: { lib: string[], temporalTypes: boolean }) {
  const dir = mkdtempSync(join(tmpdir(), 'reka-ui-temporal-types-'))
  try {
    mkdirSync(join(dir, 'node_modules'))
    symlinkSync(PACKAGE_DIR, join(dir, 'node_modules/reka-ui'), 'junction')
    symlinkSync(packageDir('vue'), join(dir, 'node_modules/vue'), 'junction')
    symlinkSync(packageDir('temporal-polyfill-lite'), join(dir, 'node_modules/temporal-polyfill-lite'), 'junction')
    writeFileSync(join(dir, 'package.json'), '{ "type": "module" }')
    writeFileSync(join(dir, 'index.ts'), source)
    const files = [join(dir, 'index.ts')]
    if (temporalTypes) {
      writeFileSync(join(dir, 'temporal.d.ts'), `import 'temporal-polyfill-lite/types/global'\n`)
      files.push(join(dir, 'temporal.d.ts'))
    }
    const program = ts.createProgram(files, {
      strict: true,
      noEmit: true,
      // The default of Vite's and Vue's templates (`@vue/tsconfig`).
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib,
    })
    return ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const ES2022 = ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts']
const ESNEXT = ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts']

describe.skipIf(!hasDist)('the built types on TypeScript 5 and 6', () => {
  it('runs TypeScript 5.9 and 6', () => {
    expect(ts5.version).toMatch(/^5\.9\./)
    expect(ts6.version).toMatch(/^6\./)
  })

  it('types the date values on TypeScript 5.9 with a polyfill\'s global types', () => {
    expect(typeCheck(ts5, DATE_CONSUMER, { lib: ES2022, temporalTypes: true })).toEqual([])
  }, 120_000)

  it('types the date values on TypeScript 6 with the ESNext lib', () => {
    expect(typeCheck(ts6, DATE_CONSUMER, { lib: ESNEXT, temporalTypes: false })).toEqual([])
  }, 120_000)

  it.each([['5.9', ts5], ['6', ts6]] as const)('compiles a consumer of the other components on TypeScript %s without Temporal types', (_, ts) => {
    expect(typeCheck(ts, NON_DATE_CONSUMER, { lib: ES2022, temporalTypes: false })).toEqual([])
  }, 120_000)

  it('turns DateValue into `any` on TypeScript 5.9 without Temporal types (what the docs warn about)', () => {
    // Both `@ts-expect-error` lines go unused: nothing checks the date values.
    expect(typeCheck(ts5, DATE_CONSUMER, { lib: ES2022, temporalTypes: false })).toEqual([
      'Unused \'@ts-expect-error\' directive.',
      'Unused \'@ts-expect-error\' directive.',
    ])
  }, 120_000)
})
