// pnpm bench [--family A,B] [--scenario mount,collection] [--runs N] [--rounds N] [--sizes 1000,5000]
//            [--lib <packages/core dir>] [--label name] [--gate <load>] [--gate-wait <min>]
//            [--out file.json] [--no-caffeinate]
//
// Measures a BUILT reka-ui (<lib>/dist, default: this checkout) in headless Chromium and writes
// <out> (JSON), <out minus .json>.md (tables) and, last of all, <out>.done. See ../README.md.
/* eslint-disable no-console */
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { arch, cpus, loadavg, platform, release, totalmem } from 'node:os'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import { COLLECTION_FAMILIES, COLLECTION_SIZES, FAMILIES } from '../src/families.js'
import { BENCH_ROOT, buildPage, libInfo } from './build.mjs'
import { report } from './report.mjs'
import { runBench } from './run.mjs'
import { summarize } from './stats.mjs'

const { values: opts } = parseArgs({
  options: {
    'family': { type: 'string' },
    'scenario': { type: 'string', default: 'mount,collection' },
    'runs': { type: 'string', default: '3' },
    'rounds': { type: 'string', default: '5' },
    'sizes': { type: 'string', default: COLLECTION_SIZES.join(',') },
    'lib': { type: 'string' },
    'label': { type: 'string' },
    'gate': { type: 'string' },
    'gate-wait': { type: 'string', default: '40' },
    'out': { type: 'string' },
    'no-caffeinate': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h' },
  },
})
if (opts.help) {
  console.log(`Usage: pnpm bench [options]

  --family A,B        families to run (default: all ${Object.keys(FAMILIES).length}; see bench/src/families.js)
  --scenario a,b      mount (census + interactions, every family) and/or collection
                      (1,000 / 5,000 items: ${COLLECTION_FAMILIES.join(', ')})
  --runs N            page loads per family (default 3); each is a fresh renderer
  --rounds N          mount/unmount rounds per page load (default 5)
  --sizes a,b         collection sizes (default ${COLLECTION_SIZES.join(',')})
  --lib dir           the packages/core directory to measure; its dist/ must be built
                      (default: this checkout's)
  --label name        name stored in the results (default: the measured branch or sha)
  --gate L            wait until the 1-minute load average is below L before starting, and
                      below L + 3 before each family (the run itself adds 2 to 3)
  --gate-wait M       ... for at most M minutes in total (default 40), then run anyway and
                      mark the timings as suspect
  --out file.json     results file (default bench/dist/<label>.json)
  --no-caffeinate     macOS: don't hold a caffeinate assertion for the run`)
  process.exit(0)
}

const SLEEP_ENTRY = /\b(?:DarkWake|Entering Sleep)\b/
const log = msg => console.log(`[bench] ${msg}`)
const REPO = resolve(BENCH_ROOT, '../../..')
const lib = resolve(opts.lib ?? resolve(BENCH_ROOT, '..'))
function git(dir, ...args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  }
  catch {
    return null
  }
}

const families = opts.family ? opts.family.split(',').map(s => s.trim()) : Object.keys(FAMILIES)
const unknown = families.filter(f => !FAMILIES[f])
if (unknown.length)
  throw new Error(`unknown families: ${unknown.join(', ')} (see bench/src/families.js)`)
const scenarios = opts.scenario.split(',')
const sizes = opts.sizes.split(',').map(Number)
const runs = Number(opts.runs)
const rounds = Number(opts.rounds)

const jobs = []
if (scenarios.includes('mount'))
  jobs.push(...families.map(family => ({ scenario: 'mount', family })))
if (scenarios.includes('collection')) {
  for (const family of families.filter(f => COLLECTION_FAMILIES.includes(f)))
    jobs.push(...sizes.map(items => ({ scenario: 'collection', family, items })))
}
if (!jobs.length)
  throw new Error('nothing to run: no family matches the requested scenarios')

const info = libInfo(lib)
const commit = git(lib, 'rev-parse', 'HEAD')
const branch = git(lib, 'rev-parse', '--abbrev-ref', 'HEAD')
const label = opts.label ?? (branch && branch !== 'HEAD' ? branch.replaceAll('/', '-') : commit?.slice(0, 9) ?? info.kind)
const out = resolve(opts.out ?? join(BENCH_ROOT, 'dist', `${label}.json`))
const done = `${out}.done`
mkdirSync(resolve(out, '..'), { recursive: true })
rmSync(done, { force: true })

// Timings taken while the machine sleeps or naps (macOS DarkWake) read several times too slow.
let caffeinate
if (platform() === 'darwin' && !opts['no-caffeinate']) {
  caffeinate = spawn('caffeinate', ['-dimsu', '-w', String(process.pid)], { stdio: 'ignore' })
  caffeinate.on('error', () => (caffeinate = null))
}
const stamp = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.toTimeString().slice(0, 8)}`
// Sleep / DarkWake entries in the power log between two local timestamps (macOS only).
function sleepEvents(from, to) {
  if (platform() !== 'darwin')
    return null
  try {
    const text = execFileSync('pmset', ['-g', 'log'], { encoding: 'utf8', maxBuffer: 1 << 30, timeout: 60_000, stdio: ['ignore', 'pipe', 'ignore'] })
    return text.split('\n').filter(l => l.slice(0, 19) >= from && l.slice(0, 19) <= to && SLEEP_ENTRY.test(l)).length
  }
  catch {
    return null
  }
}

// bench/dist does not exist in a fresh checkout when --out points elsewhere
mkdirSync(join(BENCH_ROOT, 'dist'), { recursive: true })
const pageRoot = mkdtempSync(join(BENCH_ROOT, 'dist', 'page-'))
process.on('exit', () => rmSync(pageRoot, { recursive: true, force: true }))
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]])
  process.on(sig, () => process.exit(code))

log(`measuring ${relative(REPO, lib) || lib} (reka-ui ${info.version}, ${commit?.slice(0, 9) ?? 'no git'}) as "${label}"`)
const gen = await buildPage({ lib, label: 'page', outRoot: pageRoot, kind: info.kind })
if (Object.keys(gen.missing).length)
  log(`not in this build: ${Object.keys(gen.missing).join(', ')}`)

// --gate L: start below L. The run itself adds 2 to 3 to the load average, so while it runs
// the limit is L + 3: a job waits for the machine to drop below that. All waits share --gate-wait.
const load = { gate: opts.gate ? Number(opts.gate) : null, busy: opts.gate ? Number(opts.gate) + 3 : null, waitedMin: 0 }
const budgetMin = Number(opts['gate-wait'])
async function waitBelow(limit) {
  while (loadavg()[0] >= limit && load.waitedMin < budgetMin) {
    log(`load ${loadavg()[0].toFixed(2)} >= ${limit}: waiting (${load.waitedMin.toFixed(1)}/${budgetMin} min)`)
    await sleep(30_000)
    load.waitedMin += 0.5
  }
}
if (load.gate)
  await waitBelow(load.gate)
load.atStart = Number(loadavg()[0].toFixed(2))

const started = new Date()
const raw = await runBench({ root: pageRoot, label: 'page', jobs, runs, rounds, log, beforeJob: load.gate ? () => waitBelow(load.busy) : undefined })
const ended = new Date()
load.atEnd = Number(loadavg()[0].toFixed(2))
load.max = Math.max(...raw.runs.map(r => r.load))
const sleeps = sleepEvents(stamp(started), stamp(ended))
caffeinate?.kill()

const quiet = load.gate ? load.atStart < load.gate && load.max < load.busy : null
const results = {
  meta: {
    label,
    date: started.toISOString(),
    durationSec: Math.round((ended - started) / 1000),
    // srcCommit: the last commit that touched the library's source (the harness lives in the same repo)
    lib: { version: info.version, kind: info.kind, commit, srcCommit: git(lib, 'log', '-1', '--format=%H', '--', 'src'), branch, dirty: (git(lib, 'status', '--porcelain', '--untracked-files=no') ?? '') !== '' },
    harness: { commit: git(BENCH_ROOT, 'rev-parse', 'HEAD') },
    chromium: raw.chromium,
    vue: raw.vue,
    node: process.version,
    machine: { cpu: cpus()[0]?.model, cores: cpus().length, memoryGB: Math.round(totalmem() / 2 ** 30), platform: platform(), release: release(), arch: arch() },
    settings: { runs, rounds, sizes, scenarios, families: opts.family ? families : 'all' },
    load,
    power: { caffeinate: !!caffeinate, sleepEvents: sleeps },
    // ok: gated, quiet at the start and at every job, no sleep during the run. ungated: nobody checked.
    // suspect: the machine was busy or slept; don't compare the timings (heap and counts are fine).
    timing: sleeps || quiet === false ? 'suspect' : quiet ? 'ok' : 'ungated',
  },
  ...summarize(raw.runs),
}

writeFileSync(`${out}.tmp`, `${JSON.stringify(results)}\n`)
renameSync(`${out}.tmp`, out)
const md = report(results)
writeFileSync(out.replace(/\.json$/, '.md'), `${md}\n`)
console.log(`\n${md}\n`)
log(`results: ${out}`)
if (results.errors.length)
  log(`${results.errors.length} run(s) reported errors (see "errors" in the results)`)
// Written last: a results file that exists is not proof that the run finished.
writeFileSync(done, `${new Date().toISOString()}\n`)
process.exit(results.errors.some(e => e.error) ? 1 : 0)
