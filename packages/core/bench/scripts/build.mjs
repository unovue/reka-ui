// Production build of the bench page against one build of reka-ui.
//   lib:   a packages/core directory whose dist/ is built (this checkout, or another worktree)
//   kind:  'v2' | 'v3': which spelling of the fixtures and which date type to use
//   label: output directory under `outRoot`, also the URL prefix the runner serves it at
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import { generate } from './gen.mjs'

export const BENCH_ROOT = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const REKA_ID = /^reka-ui$/
const VUE_ID = /^vue$/
const FIXTURES_ID = /^virtual:bench-fixtures$/
const MAJOR = /^(\d+)\./

export function libInfo(lib) {
  if (!existsSync(resolve(lib, 'dist/index.js')))
    throw new Error(`${lib}/dist is missing: run \`pnpm --filter reka-ui build\` there first`)
  const { version } = JSON.parse(readFileSync(resolve(lib, 'package.json'), 'utf8'))
  return { version, kind: Number(version.match(MAJOR)[1]) >= 3 ? 'v3' : 'v2' }
}

// `virtual:bench-date`: start values in the build's own date type
// (v2: @internationalized/date from that checkout, v3: Temporal, which Chromium ships).
function benchDate(lib, kind) {
  const id = 'virtual:bench-date'
  return {
    name: 'bench-date',
    resolveId: s => (s === id ? `\0${id}` : undefined),
    load(s) {
      if (s !== `\0${id}`)
        return
      if (kind === 'v3') {
        return `export const startDate = Temporal.PlainDate.from('2026-01-15')
export const endDate = Temporal.PlainDate.from('2026-01-20')
export const startTime = Temporal.PlainTime.from('10:30')
export const endTime = Temporal.PlainTime.from('12:30')
`
      }
      return `import { CalendarDate, Time } from ${JSON.stringify(resolve(lib, 'node_modules/@internationalized/date'))}
export const startDate = new CalendarDate(2026, 1, 15)
export const endDate = new CalendarDate(2026, 1, 20)
export const startTime = new Time(10, 30)
export const endTime = new Time(12, 30)
`
    },
  }
}

export async function buildPage({ lib, label, outRoot, kind = libInfo(lib).kind }) {
  const fixtures = resolve(outRoot, `${label}-fixtures`)
  const gen = generate({ lib, kind, out: fixtures })
  await build({
    configFile: false,
    root: BENCH_ROOT,
    base: `/${label}/`,
    logLevel: 'warn',
    plugins: [vue(), benchDate(lib, kind)],
    resolve: {
      alias: [
        { find: REKA_ID, replacement: resolve(lib, 'dist/index.js') },
        { find: FIXTURES_ID, replacement: resolve(fixtures, 'index.js') },
        // One Vue (this checkout's) for every build: the library's own deps (@vueuse, @floating-ui)
        // would otherwise pick up the copy installed next to that build.
        { find: VUE_ID, replacement: resolve(require.resolve('vue/package.json'), '../dist/vue.runtime.esm-bundler.js') },
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
      outDir: resolve(outRoot, label),
      emptyOutDir: true,
      minify: true,
      sourcemap: false,
      target: 'es2022',
      reportCompressedSize: false,
      chunkSizeWarningLimit: Infinity,
    },
  })
  return gen
}
