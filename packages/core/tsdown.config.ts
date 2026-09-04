import type { OutputPlugin } from 'rolldown'
import { defineConfig } from 'tsdown'

// Match `defineComponent(`, `createContext(`, `reactive(` at word boundaries,
// skipping calls already preceded by a PURE annotation or prefixed with a
// word character (e.g. _defineComponent), or preceded by `function` keyword
// (function declarations should not be annotated).
const PURE_PATTERN = /(?<!function\s)(?<=^|[^.\w$])(defineComponent|createContext|reactive)\s*\(/g
const ALREADY_PURE = /\/\*\s*[#@]__PURE__\s*\*\/\s*$/
const PATH_SEP = /[\\/]/g

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
      return result === code ? null : result
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
  },
  fromVite: true,
  platform: 'neutral',
  format: ['esm'],
  tsconfig: './tsconfig.app.json',
  dts: { vue: true, sourcemap: true },
  sourcemap: true,
  hash: false,

  /**
   * The dist output makes no bundler assumption: `import.meta.env` is only
   * populated by Vite-style bundlers and is `undefined` in plain Node ESM,
   * Vitest-externalised deps and browser `<script type="module">` usage, where
   * `import.meta.env.DEV` would throw a TypeError. Replace the few dev-only
   * `import.meta.env.*` reads in `src` with `undefined` so they are inert.
   * Dev-only warnings that must survive in dist use `process.env.NODE_ENV`
   * instead (same convention as Vue's own esm-bundler build).
   */
  define: {
    'import.meta.env.DEV': 'undefined',
    'import.meta.env.MODE': 'undefined',
  },

  inputOptions: {
    preserveEntrySignatures: 'allow-extension',
    experimental: {
      // Causes major issues with advancedChunks. Not really important here anyway.
      strictExecutionOrder: false,
    },
  },
  outputOptions: {
    minifyInternalExports: false,
    plugins: [pureAnnotationPlugin()],

    // Don't rely on unbundle: it creates a lot of unwanted files because of the multiple sections of SFC files
    advancedChunks: {
      groups: [
        {
          // Exclude d.ts files so they get bundled up
          // Also not possible when using unbundle mode...
          test: /(?<!\.d\.c?ts)$/,
          name: (id) => {
            const [namespace, file] = id.split('?')[0].split(PATH_SEP).slice(-2)
            return (
              file
                ? namespace === 'src'
                  ? file.slice(0, file.lastIndexOf('.'))
                  : `${namespace}/${file.slice(0, file.lastIndexOf('.'))}`
                : namespace
            )
          },
        },
      ],
    },
  },
})
