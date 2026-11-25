// Builds the experimental `reka-ui/vapor` entry into `dist/vapor/` (run by `pnpm build-only`, after
// tsdown, so the main entries are untouched). ESM only, plus the declaration and CJS stub below.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { core, isExternal, rekaVaporPlugins } from './plugins.mjs'

const { version } = JSON.parse(readFileSync(resolve(core, 'package.json'), 'utf8'))
const DOCS = 'https://reka-ui.com/docs/guides/vapor'
const EXPORT_LIST = /export\s*\{([^}]*)\}/g

/**
 * The components are the v2 SFCs compiled a second time, so their public types are the main entry's.
 * Each runtime export is re-declared from `../index` with an `@experimental` tag; every other type is
 * re-exported type-only, so importing a family the Vapor build lacks fails type-checking.
 */
function declarations() {
  const source = readFileSync(resolve(core, 'vapor/src/index.ts'), 'utf8')
  const names = [...source.matchAll(EXPORT_LIST)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean))
  const lines = [
    '/**',
    ' * Native Vue Vapor build of reka-ui.',
    ' *',
    ' * @experimental Needs vue >=3.6.0-rc.16 (tested with 3.6.0-rc.16), client-side only (no SSR), and',
    ` * covers a subset of the families. It relies on Vue internals and may break in any Vue 3.6 release. See ${DOCS}`,
    ' * @module',
    ' */',
    `export type * from '../index.js'`,
    '',
    ...names.flatMap(name => [
      `/** @experimental Vapor build of \`${name}\`, see ${DOCS} */`,
      `export declare const ${name}: typeof import('../index.js').${name}`,
    ]),
    '',
  ]
  return { names, code: lines.join('\n') }
}

// As the main build's `pureAnnotationPlugin` (tsdown.config.ts), plus the calls Vapor compiles to at
// module level (`template()` per static template, `defineVaporComponent()` per component), so a
// consumer's bundler drops the families an app doesn't import.
const PURE_PATTERN = /(?<!function\s)(?<=^|[^.\w$])(defineVaporComponent|defineVaporAsyncComponent|template|defineComponent|createContext|createRekaContext|reactive)(\$\d+)?\s*\(/g
const ALREADY_PURE = /\/\*\s*[#@]__PURE__\s*\*\/\s*$/

function pureAnnotations() {
  return {
    name: 'reka-vapor-pure-annotations',
    renderChunk(code) {
      const out = code.replace(PURE_PATTERN, (match, _fn, _suffix, offset) =>
        ALREADY_PURE.test(code.slice(Math.max(0, offset - 30), offset)) ? match : `/*#__PURE__*/ ${match}`)
      return out === code ? null : { code: out, map: null }
    },
  }
}

function vaporEntryFiles() {
  return {
    name: 'reka-vapor-entry-files',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'index.d.ts', source: declarations().code })
      // Vapor output is ESM; a `require()` gets a clear error instead of a missing-export one
      this.emitFile({ type: 'asset', fileName: 'index.cjs', source: `throw new Error('reka-ui/vapor is ESM-only: import it instead of require(). See ${DOCS}')\n` })
      // Node (the `node` export condition: SSR, scripts) gets this instead of the build, which would
      // otherwise fail on Vue's server build lacking the Vapor exports before the runtime guard can run
      this.emitFile({ type: 'asset', fileName: 'ssr.cjs', source: `throw new Error('reka-ui/vapor does not support server-side rendering (it needs a DOM). Render it client-only, or import from "reka-ui" for SSR. See ${DOCS}')\n` })
    },
  }
}

export default {
  root: core,
  configFile: false,
  logLevel: 'warn',
  resolve: { alias: { '@': resolve(core, 'src') } },
  plugins: [...rekaVaporPlugins(), vaporEntryFiles(), pureAnnotations()],
  // Its own context keys: a page mixing the VDOM and Vapor builds keeps their contexts apart
  define: { __REKA_UI_VERSION__: JSON.stringify(`${version}+vapor`) },
  build: {
    outDir: resolve(core, 'dist/vapor'),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: { entry: resolve(core, 'vapor/src/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: {
      external: isExternal,
      // One file per module, as the main build, so `sideEffects: false` lets a bundler drop whole
      // families; a single bundle keeps far more (module-level destructuring, shared composables).
      output: {
        preserveModules: true,
        preserveModulesRoot: core,
        entryFileNames: chunk => chunk.facadeModuleId === resolve(core, 'vapor/src/index.ts') ? 'index.js' : '[name].js',
      },
    },
  },
}
