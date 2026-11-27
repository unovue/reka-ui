// pnpm bench:compare <a.json> <b.json> [--time 0.15] [--heap 0.02] [--all] [--out file.md]
//
// Diffs two results files (a = before, b = after) and lists the metrics that changed beyond
// noise. A change counts when
//   timings: b/a is outside 1 ± --time, AND the medians differ by more than twice the larger
//            standard deviation, AND by more than 0.1 ms
//   heap:    b/a is outside 1 ± --heap, AND the medians differ by more than 0.1 KB
//   counts:  the medians differ by more than 1% and by 0.5 or more (they are deterministic)
// The defaults are the noise floor measured by running the same build twice (see ../README.md).
// Exits 0 either way: this is a report, not a gate.
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { quantile } from './stats.mjs'

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    time: { type: 'string', default: '0.15' },
    heap: { type: 'string', default: '0.02' },
    all: { type: 'boolean', default: false },
    out: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})
if (opts.help || positionals.length !== 2) {
  console.log(`Usage: pnpm bench:compare <a.json> <b.json> [options]

  --time X    relative change a timing must exceed to be listed (default 0.15 = ±15%)
  --heap X    relative change a heap metric must exceed (default 0.02 = ±2%)
  --all       also print every compared metric, not only the changes
  --out file  write the markdown report here as well`)
  process.exit(opts.help ? 0 : 1)
}
// pnpm runs the script from the package directory; paths are relative to where the user is.
const base = process.env.INIT_CWD ?? process.cwd()
const [a, b] = positionals.map(p => JSON.parse(readFileSync(resolve(base, p), 'utf8')))
const tTime = Number(opts.time)
const tHeap = Number(opts.heap)

// metric -> [class, label]
const MOUNT = {
  mountMs: ['time', 'mount ms'],
  heapKB: ['heap', 'heap KB/inst'],
  leakKB: ['leak', 'after-unmount KB/inst'],
  leakNodes: ['count', 'leaked nodes/inst'],
  nodes: ['count', 'DOM nodes/inst'],
  components: ['count', 'components/inst'],
  listeners: ['count', 'listeners/inst'],
  actMs: ['time', 'interaction ms'],
  resetMs: ['time', 'close ms'],
}
const COLLECTION = {
  mountMs: ['time', 'mount ms'],
  heapKB: ['heap', 'heap KB/item'],
  heapOpenKB: ['heap', 'heap open KB/item'],
  openMs: ['time', 'open ms'],
  keyMs: ['time', 'ms/key'],
  typeMs: ['time', 'type ms'],
  selectMs: ['time', 'select ms'],
}
const COUNTS = { updates: 'component updates', mounts: 'component mounts', qsa: 'querySelectorAll calls' }
const PHASES = { key: 'key', type: 'typed char', select: 'selection' }

const rows = []
function add(scenario, id, cls, label, sa, sb) {
  if (sa == null || sb == null)
    return
  const x = typeof sa === 'number' ? { median: sa, stddev: 0 } : sa
  const y = typeof sb === 'number' ? { median: sb, stddev: 0 } : sb
  const delta = y.median - x.median
  const ratio = x.median ? y.median / x.median : (y.median ? Infinity : 1)
  const rel = Math.abs(ratio - 1)
  const abs = Math.abs(delta)
  let changed
  if (cls === 'time')
    changed = rel > tTime && abs > 2 * Math.max(x.stddev, y.stddev) && abs > 0.1
  else if (cls === 'heap')
    changed = rel > tHeap && abs > 0.1
  // what is still retained after unmount is ~0 on both sides: only an absolute change means anything
  else if (cls === 'leak')
    changed = abs > 1
  else
    changed = rel > 0.01 && abs >= 0.5
  rows.push({ scenario, id, cls, label, a: x.median, b: y.median, ratio, delta, changed })
}

for (const [name, ra] of Object.entries(a.mount)) {
  const rb = b.mount[name]
  if (!rb)
    continue
  for (const [m, [cls, label]] of Object.entries(MOUNT))
    add('mount', name, cls, label, ra.metrics[m], rb.metrics[m])
}
for (const [id, ra] of Object.entries(a.collection)) {
  const rb = b.collection[id]
  if (!rb)
    continue
  for (const [m, [cls, label]] of Object.entries(COLLECTION))
    add('collection', id, cls, label, ra.metrics[m], rb.metrics[m])
  for (const [phase, phaseLabel] of Object.entries(PHASES)) {
    for (const [c, label] of Object.entries(COUNTS))
      add('collection', id, 'count', `${label} / ${phaseLabel}`, ra.counts?.[phase]?.[c], rb.counts?.[phase]?.[c])
  }
}

const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '∞')
const table = (head, body) => [`| ${head.join(' | ')} |`, `|${head.map((_, i) => (i < 3 ? '---' : '--:')).join('|')}|`, ...body.map(r => `| ${r.join(' | ')} |`)].join('\n')
const line = r => [r.scenario, r.id, r.label, f(r.a), f(r.b), `×${f(r.ratio, r.ratio < 0.1 ? 3 : 2)}`, r.changed ? (r.delta < 0 ? '**lower**' : '**higher**') : 'same']
const describe = m => `${m.label}: reka-ui ${m.lib.version} @ ${(m.lib.srcCommit ?? m.lib.commit)?.slice(0, 9)}, ${m.date.slice(0, 16)}Z, load ${m.load.atStart} → max ${m.load.max}, timings ${m.timing}`

const out = [`## Bench compare: ${a.meta.label} → ${b.meta.label}`, '', `- a = ${describe(a.meta)}`, `- b = ${describe(b.meta)}`]
const warn = []
if (a.meta.timing !== 'ok' || b.meta.timing !== 'ok')
  warn.push('at least one run was not taken on a quiet, gated machine: **ignore the timing rows**, heap and counts are still valid')
for (const k of ['chromium', 'vue', 'node']) {
  if (a.meta[k] !== b.meta[k])
    warn.push(`${k} differs (${a.meta[k]} vs ${b.meta[k]})`)
}
if (a.meta.machine.cpu !== b.meta.machine.cpu || a.meta.machine.cores !== b.meta.machine.cores)
  warn.push('the two runs come from different machines: timings are not comparable')
const only = (x, y, key) => Object.keys(x[key]).filter(k => !y[key][k])
const onlyA = [...only(a, b, 'mount'), ...only(a, b, 'collection')]
const onlyB = [...only(b, a, 'mount'), ...only(b, a, 'collection')]
if (onlyA.length)
  warn.push(`only in a: ${onlyA.join(', ')}`)
if (onlyB.length)
  warn.push(`only in b: ${onlyB.join(', ')}`)
out.push(...warn.map(w => `- ⚠️ ${w}`), '')
out.push(`Listed when: timings outside ±${tTime * 100}% and > 2 × stddev and > 0.1 ms; heap outside ±${tHeap * 100}% and > 0.1 KB; counts differ by > 1% and ≥ 0.5. Ratios are b / a.`, '')

// How far apart the two files are per metric class. For two runs of the SAME build this is the noise floor.
const spread = []
for (const [key, label] of [['time', 'timings'], ['heap', 'heap'], ['count', 'counts']]) {
  const rel = rows.filter(r => r.cls === key && Number.isFinite(r.ratio) && r.a > 0).map(r => r.ratio)
  if (!rel.length)
    continue
  const dev = rel.map(r => Math.abs(r - 1)).sort((x, y) => x - y)
  const geo = Math.exp(rel.reduce((s, r) => s + Math.log(r || 1), 0) / rel.length)
  spread.push([label, rel.length, `×${f(geo, 3)}`, `${f(quantile(dev, 0.5) * 100, 1)}%`, `${f(quantile(dev, 0.9) * 100, 1)}%`, `${f(dev.at(-1) * 100, 1)}%`, rows.filter(r => r.cls === key && r.changed).length])
}
out.push('### Spread of b / a', '', table(['Class', 'metrics', 'geomean', 'median abs. change', 'p90', 'max', 'listed'], spread).replace('|---|---|---|', '|---|--:|--:|'), '')

const changed = rows.filter(r => r.changed).sort((x, y) => Math.abs(Math.log(y.ratio || 1e-9)) - Math.abs(Math.log(x.ratio || 1e-9)))
out.push(`### Changes beyond noise (${changed.length} of ${rows.length} metrics)`, '')
out.push(changed.length ? table(['Scenario', 'Family', 'Metric', 'a', 'b', 'b / a', ''], changed.map(line)) : 'None.', '')
if (opts.all)
  out.push('### Everything compared', '', table(['Scenario', 'Family', 'Metric', 'a', 'b', 'b / a', ''], rows.map(line)), '')

const md = out.join('\n')
console.log(md)
if (opts.out)
  writeFileSync(resolve(base, opts.out), `${md}\n`)
