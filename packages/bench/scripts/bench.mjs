// pnpm bench [--compare <ref>] [--only A,B] [--runs N] [--warmup N] [--no-build]
//            [--threshold 0.03] [--floor 0.2] [--keep-base] [--gate] [--out file] [--summary file]
//
// Without --compare: builds packages/core, measures every family, prints a table.
// With --compare <ref>: also checks <ref> out in a temporary git worktree, installs and
// builds it there, then measures both builds interleaved and compares them per family.
// Exits 1 when any family's retained heap per instance regresses beyond the threshold.
/* eslint-disable no-console */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { FAMILIES } from '../src/families.js'
import { BENCH_ROOT, buildPage } from './build.mjs'
import { compare, compareTable, singleTable, summarize } from './report.mjs'
import { runBench } from './run.mjs'

const { values: opts } = parseArgs({
  options: {
    'compare': { type: 'string' },
    'only': { type: 'string' },
    'runs': { type: 'string', default: '3' },
    'warmup': { type: 'string', default: '0' },
    'concurrency': { type: 'string', default: '1' },
    'no-build': { type: 'boolean', default: false },
    'threshold': { type: 'string', default: '0.03' },
    'floor': { type: 'string', default: '0.2' },
    'keep-base': { type: 'boolean', default: false },
    'gate': { type: 'boolean', default: false },
    'out': { type: 'string' },
    'summary': { type: 'string', default: process.env.GITHUB_STEP_SUMMARY },
    'help': { type: 'boolean', short: 'h' },
  },
})
if (opts.help) {
  console.log(`Usage: pnpm bench [options]

  --compare <ref>   also build <ref> in a temporary worktree and compare (base → this checkout)
  --only A,B        families to run (default: all ${Object.keys(FAMILIES).length})
  --runs N          measured samples per family and build (default 3; bench:full uses 10)
  --warmup N        discarded page-level samples per family and build (default 0)
  --concurrency N   families measured in parallel (default 1; heap is unaffected, timings get noisier)
  --no-build        use the existing packages/core/dist instead of rebuilding it
  --threshold X     heap regression ratio that fails the run (default 0.03 = +3%)
  --floor KB        ... and only if heap grew by more than this many KB/inst (default 0.2)
  --keep-base       keep the base worktree (and reuse it on the next run of the same commit)
  --gate            wait while the machine's load average is above ncpu/2
  --out file        raw samples + summary JSON (default packages/bench/dist/results.json)
  --summary file    append the markdown report here (default $GITHUB_STEP_SUMMARY)`)
  process.exit(0)
}

const log = msg => console.log(`[bench] ${msg}`)
const REPO = resolve(BENCH_ROOT, '../..')
const CORE = resolve(REPO, 'packages/core')
const sh = (cmd, args, cwd, quiet = false) => execFileSync(cmd, args, { cwd, stdio: quiet ? ['ignore', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8' })
const git = (...args) => sh('git', args, REPO, true).trim()

const families = opts.only ? opts.only.split(',').map(s => s.trim()) : Object.keys(FAMILIES)
const unknown = families.filter(f => !FAMILIES[f])
if (unknown.length)
  throw new Error(`unknown families: ${unknown.join(', ')} (see src/families.js)`)
const runs = Number(opts.runs)
const warmup = Number(opts.warmup)
const threshold = Number(opts.threshold)
const floor = Number(opts.floor)
const t0 = Date.now()

// --- library builds (build-only: tsdown without the vue-tsc type-check) ---
if (!opts['no-build']) {
  log('building packages/core')
  sh('pnpm', ['--filter', 'reka-ui', 'build-only'], REPO)
}
if (!existsSync(join(CORE, 'dist/index.js')))
  throw new Error('packages/core/dist is missing; drop --no-build or run `pnpm --filter reka-ui build` first')

let baseDir = null
let baseSha = null
if (opts.compare) {
  baseSha = git('rev-parse', '--verify', `${opts.compare}^{commit}`)
  baseDir = join(tmpdir(), `reka-bench-base-${baseSha.slice(0, 12)}`)
  const built = existsSync(join(baseDir, 'packages/core/dist/index.js'))
  if (built && opts['keep-base']) {
    log(`reusing base worktree ${baseDir}`)
  }
  else {
    if (existsSync(baseDir))
      git('worktree', 'remove', '--force', baseDir)
    log(`base ${opts.compare} = ${baseSha.slice(0, 12)}: worktree at ${baseDir}`)
    git('worktree', 'add', '--detach', baseDir, baseSha)
    // --ignore-scripts: the root `prepare` hook installs git hooks, which a worktree doesn't need
    sh('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--ignore-scripts'], baseDir)
    sh('pnpm', ['--filter', 'reka-ui', 'build-only'], baseDir)
  }
}

// --- bench page builds ---
const labels = []
if (baseDir) {
  log('building bench page against base')
  await buildPage({ lib: join(baseDir, 'packages/core'), label: 'base' })
  labels.push('base')
}
log('building bench page against this checkout')
await buildPage({ lib: CORE, label: 'head' })
labels.push('head')
const tBuilt = Date.now()

// --- run ---
const raw = await runBench({ labels, families, runs, warmup, concurrency: Number(opts.concurrency), gate: opts.gate, log })
const summary = summarize(raw)
const tRan = Date.now()

const headSha = git('rev-parse', 'HEAD')
const meta = [
  `Chromium ${raw.chromium}, Vue ${execFileSync('node', ['-p', 'require("vue/package.json").version'], { cwd: BENCH_ROOT, encoding: 'utf8' }).trim()}, production build`,
  `${runs} run(s) per family and build${warmup ? ` (+${warmup} warm-up)` : ''}, medians${opts.concurrency !== '1' ? `, ${opts.concurrency} families in parallel` : ''}`,
  `build ${((tBuilt - t0) / 1000).toFixed(0)}s, run ${((tRan - tBuilt) / 1000).toFixed(0)}s`,
]
let md
let failed = []
let rows
if (baseDir) {
  rows = compare(summary, { threshold, floor })
  failed = rows.filter(r => r.fail)
  // A gate that compared nothing must not pass (e.g. every page failed on both builds).
  if (!rows.some(r => r.base?.ok && r.head?.ok))
    failed.push({ family: 'all families', verdict: 'nothing comparable' })
  const counts = Object.entries(Object.groupBy(rows, r => r.verdict)).map(([k, v]) => `${v.length} ${k}`).join(', ')
  md = [
    `## Bench: ${opts.compare} (${baseSha.slice(0, 7)}) → HEAD (${headSha.slice(0, 7)})`,
    '',
    failed.length
      ? `**${failed.length} famil${failed.length === 1 ? 'y' : 'ies'} failed:** ${failed.map(r => `${r.family} (${r.verdict}${r.heapRatio ? `, heap ×${r.heapRatio.toFixed(3)}` : ''})`).join(', ')}`
      : `No heap regressions. ${counts}.`,
    '',
    `Gate: retained heap per instance, head/base > ${1 + threshold} **and** +${floor} KB/inst or more. Mount and update times are informational (noisy on shared runners). Ratios are head/base.`,
    '',
    compareTable(rows),
    '',
    `<sub>${meta.join(' · ')}</sub>`,
  ].join('\n')
}
else {
  md = [`## Bench: HEAD (${headSha.slice(0, 7)})`, '', singleTable(summary), '', `<sub>${meta.join(' · ')}</sub>`].join('\n')
}

console.log(`\n${md}\n`)
const out = opts.out ?? join(BENCH_ROOT, 'dist/results.json')
mkdirSync(resolve(out, '..'), { recursive: true })
writeFileSync(out, JSON.stringify({ base: baseSha, head: headSha, threshold, floor, summary, rows, raw }, null, 1))
log(`results: ${out}`)
if (opts.summary)
  appendFileSync(opts.summary, `${md}\n`)

if (baseDir && !opts['keep-base']) {
  git('worktree', 'remove', '--force', baseDir)
  log('removed base worktree')
}

const headFailed = !baseDir && Object.values(summary).some(s => !s.head?.ok || s.head.failed)
process.exit(failed.length || headFailed ? 1 : 0)
