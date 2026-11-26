// Markdown for one results file.
import { FAMILIES } from '../src/families.js'

const f = (x, d = 2) => (x == null ? '–' : x.toFixed(d))
// median / p95 / stddev
const mps = (s, d = 2) => (s ? `${f(s.median, d)} / ${f(s.p95, d)} / ${f(s.stddev, d)}` : '–')
const med = (s, d = 2) => (s ? f(s.median, d) : '–')
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map((_, i) => (i ? '--:' : '---')).join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n')

export function metaLines(meta) {
  const m = meta.machine
  return [
    `- **Build**: reka-ui ${meta.lib.version} (${meta.lib.branch ?? '?'} @ ${meta.lib.commit?.slice(0, 9) ?? '?'}, source last changed in ${meta.lib.srcCommit?.slice(0, 9) ?? '?'}${meta.lib.dirty ? ', dirty' : ''}), production dist, Vue ${meta.vue}`,
    `- **Browser**: headless Chromium ${meta.chromium}, Node ${meta.node}`,
    `- **Machine**: ${m.cpu}, ${m.cores} cores, ${m.memoryGB} GB, ${m.platform} ${m.release} ${m.arch}`,
    `- **Run**: ${meta.date}, ${meta.durationSec}s, ${meta.settings.runs} page load(s) × ${meta.settings.rounds} round(s) per family`,
    `- **Load (1 min)**: ${meta.load.atStart} at start${meta.load.gate ? ` (gate < ${meta.load.gate}, then < ${meta.load.busy} per family; waited ${meta.load.waitedMin} min)` : ' (not gated)'}, max ${meta.load.max} during the run, ${meta.load.atEnd} at the end; caffeinate ${meta.power.caffeinate ? 'on' : 'off'}, sleep events ${meta.power.sleepEvents ?? 'n/a'}`,
    `- **Timings**: ${{ ok: 'valid (quiet machine)', ungated: 'not gated on load: treat as indicative', suspect: '**SUSPECT** (busy machine or sleep during the run): use heap and counts only' }[meta.timing]}`,
  ]
}

export function mountTable(mount) {
  return table(
    ['Family', 'N', 'mount ms (med / p95 / sd)', 'µs / inst', 'heap KB / inst (med / p95 / sd)', 'after unmount KB / inst', 'leaked nodes / inst', 'DOM nodes', 'components', 'listeners', 'interaction ms (med / p95 / sd)'],
    Object.entries(mount).map(([name, r]) => {
      const m = r.metrics
      return [
        FAMILIES[name]?.ref ? `_${name}_` : name,
        r.n,
        mps(m.mountMs),
        f(m.mountMs.median * 1000 / r.n, 1),
        mps(m.heapKB),
        med(m.leakKB),
        med(m.leakNodes),
        med(m.nodes, 0),
        med(m.components, 0),
        med(m.listeners, 0),
        mps(m.actMs),
      ]
    }),
  )
}

export function popupTable(mount) {
  const rows = Object.entries(mount).filter(([name]) => FAMILIES[name]?.popup)
  return table(
    ['Family', 'open ms (med / p95 / sd)', 'open → painted ms (med / p95 / sd)', 'close ms (med / p95 / sd)', 'closed: mount µs / inst', 'closed: heap KB / inst', 'closed: components', 'closed: listeners'],
    rows.map(([name, r]) => {
      const m = r.metrics
      return [name, mps(m.actMs), mps(m.actPaintMs), mps(m.resetMs), f(m.mountMs.median * 1000 / r.n, 1), med(m.heapKB), med(m.components, 0), med(m.listeners, 0)]
    }),
  )
}

const top = c => (c ? Object.entries(c.top).map(([k, v]) => `${k} ${f(v, v % 1 ? 1 : 0)}`).join(', ') : '–')
const cnt = (c, k) => (c ? f(c[k], c[k] % 1 ? 1 : 0) : '–')

export function collectionTable(collection) {
  return table(
    ['Family', 'items', 'mount ms', 'heap KB / item', 'open ms', 'ms / key (med / p95 / sd)', 'type ms (med / p95 / sd)', 'select ms', 'updates / key', 'mounts / key', 'qSA / key', 'updates / type', 'updates / select'],
    Object.values(collection).map((r) => {
      const m = r.metrics
      const c = r.counts ?? {}
      return [r.family, r.items, med(m.mountMs, 1), med(m.heapKB), med(m.openMs, 1), mps(m.keyMs), mps(m.typeMs), med(m.selectMs), cnt(c.key, 'updates'), cnt(c.key, 'mounts'), cnt(c.key, 'qsa'), cnt(c.type, 'updates'), cnt(c.select, 'updates')]
    }),
  )
}

export function renderTable(collection) {
  return table(
    ['Family', 'items', 'per key press', 'per typed character', 'per selection'],
    Object.values(collection).map(r => [r.family, r.items, top(r.counts?.key), top(r.counts?.type), top(r.counts?.select)]),
  )
}

export function report(results) {
  const { meta, mount, collection, missing, errors } = results
  const out = [`## Bench: ${meta.label}`, '', ...metaLines(meta), '']
  if (Object.keys(mount).length) {
    out.push('### Mount, retained heap, interaction (per family)', '', mountTable(mount), '')
    if (Object.keys(mount).some(n => FAMILIES[n]?.popup))
      out.push('### Popups: open / close, and what a closed instance costs', '', popupTable(mount), '')
  }
  if (Object.keys(collection).length) {
    out.push('### Large collections (one instance)', '', collectionTable(collection), '')
    out.push('Component updates by component (top 4):', '', renderTable(collection), '')
  }
  if (Object.keys(missing).length)
    out.push(`Not in this build: ${Object.entries(missing).map(([k, v]) => `${k} (${v.slice(0, 3).join(', ')}${v.length > 3 ? ', …' : ''})`).join('; ')}`, '')
  if (errors.length)
    out.push(`**Errors** (${errors.length}): ${errors.slice(0, 20).map(e => `${e.id} #${e.run}: ${e.error ?? e.console?.[0]}`).join('; ')}`, '')
  return out.join('\n')
}
