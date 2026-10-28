// Production build of the bench page against one build of reka-ui.
//   lib:   a packages/core directory whose dist/ is built (this checkout, or the base worktree)
//   label: output directory under dist/, also the URL prefix the runner serves it at
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'

export const BENCH_ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIXTURES = resolve(BENCH_ROOT, 'src/fixtures')
const VUE_FILE = /\.vue$/
const REKA_ID = /^reka-ui$/
const VUE_ID = /^vue$/
const REKA_IMPORT = /import\s*\{([^}]+)\}\s*from\s*'reka-ui'/g

// `virtual:bench-imports`: for each fixture, the reka-ui exports it imports that are
// missing from this build (shimMissingExports turns those into `undefined`).
function benchImports() {
  const id = 'virtual:bench-imports'
  return {
    name: 'bench-imports',
    resolveId: s => (s === id ? `\0${id}` : undefined),
    load(s) {
      if (s !== `\0${id}`)
        return
      const used = {}
      for (const f of readdirSync(FIXTURES).filter(f => f.endsWith('.vue'))) {
        const src = readFileSync(resolve(FIXTURES, f), 'utf8')
        const names = [...src.matchAll(REKA_IMPORT)]
          .flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean))
        used[f.replace(VUE_FILE, '')] = names
      }
      const all = [...new Set(Object.values(used).flat())].sort()
      return [
        all.length ? `import { ${all.join(', ')} } from 'reka-ui'` : '',
        `const lib = { ${all.join(', ')} }`,
        `const used = ${JSON.stringify(used)}`,
        'export const missingExports = Object.fromEntries(Object.entries(used).map(([f, names]) => [f, names.filter(n => lib[n] === undefined)]))',
      ].join('\n')
    },
  }
}

export async function buildPage({ lib, label, minify = true }) {
  await build({
    configFile: false,
    root: BENCH_ROOT,
    base: `/${label}/`,
    logLevel: 'warn',
    plugins: [vue(), benchImports()],
    resolve: {
      alias: [
        { find: REKA_ID, replacement: resolve(lib, 'dist/index.js') },
        // One Vue (this package's) for every build: the library's own deps (@vueuse, @floating-ui)
        // would otherwise pick up the copy installed in that checkout.
        { find: VUE_ID, replacement: resolve(BENCH_ROOT, 'node_modules/vue/dist/vue.runtime.esm-bundler.js') },
      ],
      dedupe: ['vue'],
    },
    define: {
      '__VUE_OPTIONS_API__': 'true',
      '__VUE_PROD_DEVTOOLS__': 'false',
      '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      outDir: resolve(BENCH_ROOT, 'dist', label),
      emptyOutDir: true,
      minify,
      sourcemap: false,
      target: 'es2022',
      reportCompressedSize: false,
      chunkSizeWarningLimit: Infinity,
      rollupOptions: { shimMissingExports: true },
    },
  })
}
