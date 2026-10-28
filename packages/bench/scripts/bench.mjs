// pnpm bench [--compare <ref>] [--only A,B] [--runs N] [--warmup N] [--no-build]
//            [--threshold 0.03] [--floor 0.2] [--keep-base] [--gate] [--out file] [--summary file]
//
// Without --compare: builds packages/core, measures every family, prints a table.
// With --compare <ref>: also checks <ref> out in a temporary git worktree, installs and
// builds it there, then measures both builds interleaved and compares them per family.
// Every run gets its own base worktree and page output directory, so concurrent runs
// (several agents or checkouts comparing against the same ref) never share one.
// Exits 1 when any family's retained heap per instance regresses beyond the threshold.
/* eslint-disable no-console */
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
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
  --keep-base       leave the base worktree in place after the run (its path is printed)
  --gate            wait while the machine's load average is above ncpu/2
  --out file        raw samples + summary JSON (default packages/bench/dist/results.json)
  --summary file    append the markdown report here (default $GITHUB_STEP_SUMMARY)`)
  process.exit(0)
}

const log = msg => console.log(`[bench] ${msg}`)
const REPO = resolve(BENCH_ROOT, '../..')
const CORE = resolve(REPO, 'packages/core')
// Short temp root, whatever $TMPDIR is: the base worktree lives there, and the builds run with
// TMPDIR pointing at it, because tsx (packages/core postbuild) puts its IPC socket under TMPDIR
// and a Unix socket path over ~104 chars (macOS) fails with EINVAL.
const SHORT_TMP = process.platform === 'win32' ? tmpdir() : '/tmp'
const env = { ...process.env, TMPDIR: SHORT_TMP }
const sh = (cmd, args, cwd, quiet = false) => execFileSync(cmd, args, { cwd, env, stdio: quiet ? ['ignore', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8' })
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

let baseDir = null
let baseSha = null
// This run's page builds; dist/ is shared by every run in this checkout.
mkdirSync(join(BENCH_ROOT, 'dist'), { recursive: true })
const pageRoot = mkdtempSync(join(BENCH_ROOT, 'dist', 'run-'))

// Runs in this checkout share packages/core/dist: building it and bundling the head page from
// it happen under a lock. Once bundled, the page no longer reads packages/core.
//
// The lock is a file holding "<pid> <random token>". It is published with link(), which is
// atomic and fails if the lock exists, so a lock never exists without its owner recorded.
// A lock whose pid is dead is reclaimed by renaming it to a name unique to the reclaimer:
// only one run can win that rename, and the winner deletes it only if it still holds the
// dead owner's token (otherwise it raced a fresh lock and puts it back).
const HEAD_LOCK = join(BENCH_ROOT, 'dist', '.head-build.lock')
const myToken = `${process.pid} ${randomBytes(6).toString('hex')}`
let holdsLock = false
function readLock(file) {
  try {
    return readFileSync(file, 'utf8')
  }
  catch (e) {
    if (e.code === 'ENOENT')
      return null
    throw e
  }
}
function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (e) {
    return e.code === 'EPERM'
  }
}
function tryLock() {
  const tmp = `${HEAD_LOCK}.${process.pid}.tmp`
  writeFileSync(tmp, myToken)
  try {
    linkSync(tmp, HEAD_LOCK)
    return true
  }
  catch (e) {
    if (e.code !== 'EEXIST')
      throw e
    return false
  }
  finally {
    rmSync(tmp, { force: true })
  }
}
function reclaimIfStale(token) {
  const reap = `${HEAD_LOCK}.reap.${process.pid}`
  try {
    renameSync(HEAD_LOCK, reap)
  }
  catch (e) {
    if (e.code === 'ENOENT')
      return // another run reclaimed or released it first
    throw e
  }
  if (readLock(reap) !== token) {
    // A fresh lock replaced the stale one before our rename: put it back.
    try {
      linkSync(reap, HEAD_LOCK)
    }
    catch {}
  }
  rmSync(reap, { force: true })
}
async function lockHeadBuild() {
  let waiting = false
  while (!tryLock()) {
    const token = readLock(HEAD_LOCK)
    if (token === null)
      continue
    const pid = Number(token.split(' ')[0])
    if (!isAlive(pid)) {
      reclaimIfStale(token)
      continue
    }
    if (!waiting)
      log(`waiting for another bench run (pid ${pid}) to finish building packages/core`)
    waiting = true
    await sleep(1000)
  }
  holdsLock = true
}
function unlockHeadBuild() {
  if (holdsLock && readLock(HEAD_LOCK) === myToken)
    rmSync(HEAD_LOCK, { force: true })
  holdsLock = false
}

let cleaned = false
function cleanup() {
  if (cleaned)
    return
  cleaned = true
  unlockHeadBuild()
  rmSync(pageRoot, { recursive: true, force: true })
  if (!baseDir)
    return
  if (opts['keep-base']) {
    log(`kept base worktree ${baseDir} (remove with: git worktree remove --force ${baseDir})`)
    return
  }
  // Only this run's directory: other runs have their own.
  try {
    git('worktree', 'remove', '--force', baseDir)
  }
  catch {}
  rmSync(baseDir, { recursive: true, force: true })
  try {
    git('worktree', 'prune')
  }
  catch {}
  log('removed base worktree')
}
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(sig, () => {
    cleanup()
    process.exit(code)
  })
}
process.on('exit', cleanup)

if (opts.compare) {
  baseSha = git('rev-parse', '--verify', `${opts.compare}^{commit}`)
  // Drop registrations of worktrees whose directories are gone (e.g. a killed run, a cleaned
  // /tmp). Worktrees still being created are locked by git, and live ones still exist, so
  // a concurrent run is never touched.
  git('worktree', 'prune')
  baseDir = mkdtempSync(join(SHORT_TMP, `rkb-${baseSha.slice(0, 7)}-`))
  log(`base ${opts.compare} = ${baseSha.slice(0, 12)}: worktree at ${baseDir}`)
  git('worktree', 'add', '--detach', baseDir, baseSha)
  // --ignore-scripts: the root `prepare` hook installs git hooks, which a worktree doesn't need
  sh('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--ignore-scripts'], baseDir)
  sh('pnpm', ['--filter', 'reka-ui', 'build-only'], baseDir)
}

// --- this checkout: library (build-only: tsdown without the vue-tsc type-check) + page ---
await lockHeadBuild()
if (!opts['no-build']) {
  log('building packages/core')
  sh('pnpm', ['--filter', 'reka-ui', 'build-only'], REPO)
}
if (!existsSync(join(CORE, 'dist/index.js')))
  throw new Error('packages/core/dist is missing; drop --no-build or run `pnpm --filter reka-ui build` first')
log('building bench page against this checkout')
await buildPage({ lib: CORE, label: 'head', outRoot: pageRoot })
unlockHeadBuild()

const labels = []
if (baseDir) {
  log('building bench page against base')
  await buildPage({ lib: join(baseDir, 'packages/core'), label: 'base', outRoot: pageRoot })
  labels.push('base')
}
labels.push('head')
const tBuilt = Date.now()

// --- run ---
const raw = await runBench({ root: pageRoot, labels, families, runs, warmup, concurrency: Number(opts.concurrency), gate: opts.gate, log })
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
// Write then rename: concurrent runs sharing the default path never leave a half-written file
// (the last one to finish wins; pass --out to keep each run's results).
writeFileSync(`${out}.${process.pid}`, JSON.stringify({ base: baseSha, head: headSha, threshold, floor, summary, rows, raw }, null, 1))
renameSync(`${out}.${process.pid}`, out)
log(`results: ${out}`)
if (opts.summary)
  appendFileSync(opts.summary, `${md}\n`)

cleanup()

const headFailed = !baseDir && Object.values(summary).some(s => !s.head?.ok || s.head.failed)
process.exit(failed.length || headFailed ? 1 : 0)
