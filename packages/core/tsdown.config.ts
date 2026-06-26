import type { OutputPlugin } from 'rolldown'
import { defineConfig } from 'tsdown'
import { getComponentFamilies } from './scripts/families.ts'

const componentEntries = Object.fromEntries(
  getComponentFamilies().map(family => [family.key, family.entry]),
)
const componentKeys = Object.keys(componentEntries)

// Match `defineComponent(`, `createContext(`, `reactive(` at word boundaries,
// skipping calls already preceded by a PURE annotation or prefixed with a
// word character (e.g. _defineComponent), or preceded by `function` keyword
// (function declarations should not be annotated).
const PURE_PATTERN = /(?<!function\s)(?<=^|[^.\w$])(defineComponent|createContext|reactive)\s*\(/g
const ALREADY_PURE = /\/\*\s*[#@]__PURE__\s*\*\/\s*$/

/**
 * Rolldown output plugin that inserts `/*#__PURE__* /` annotations before
 * known side-effect-free function calls so that consumer bundlers can
 * tree-shake unused components/contexts.
 */
function pureAnnotationPlugin(): OutputPlugin {
  const PURE = '/*#__PURE__*/'

  return {
    name: 'pure-annotation',
    renderChunk(code) {
      const result = code.replace(PURE_PATTERN, (match, _fn, offset) => {
        const before = code.slice(Math.max(0, offset - 30), offset)
        if (ALREADY_PURE.test(before)) {
          return match
        }
        return `${PURE} ${match}`
      })
      return result === code ? null : { code: result, map: null }
    },
  }
}

export default defineConfig({
  entry: {
    index: './src/index.ts',
    internal: './src/internal.ts',
    date: './src/date/index.ts',
    constant: './constant/index.ts',
    shared: './src/shared/index.ts',
    ...componentEntries,
  },
  fromVite: true,
  platform: 'neutral',
  format: ['esm', 'cjs'],
  unbundle: true,
  deps: { onlyBundle: false },
  tsconfig: './tsconfig.app.json',
  dts: { vue: true, sourcemap: true },
  exports: {
    inlinedDependencies: false,
    customExports(exports) {
      for (const key of componentKeys) {
        const exportKey = `./${key}`
        const value = exports[exportKey]
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          exports[exportKey] = {
            types: `./dist/${key}.d.ts`,
            ...value,
          }
        }
      }

      exports['./namespaced'] = {
        import: './dist/namespaced/index.mjs',
        require: './dist/namespaced/index.cjs',
      }
      exports['./nuxt'] = {
        import: './dist/nuxt/index.mjs',
        require: './dist/nuxt/index.cjs',
      }
      exports['./resolver'] = {
        import: './dist/resolver/index.mjs',
        require: './dist/resolver/index.cjs',
      }
      return exports
    },
  },
  sourcemap: true,
  hash: false,

  /**
   * Quick fix for tsdown not convert "import.meta" for non-esm output.
   * When tsdown resolves the issue, this can be removed.
   *
   * @see https://github.com/rolldown/tsdown/issues/370
   */
  define: {
    'import.meta.env.DEV': 'undefined',
    'import.meta.env.MODE': 'undefined',
  },

  inputOptions: {
    preserveEntrySignatures: 'allow-extension',
  },
  outputOptions: {
    minifyInternalExports: false,
    sourcemapExcludeSources: true,
    strictExecutionOrder: false,
    plugins: [pureAnnotationPlugin()],
  },
})
