// Medians per family and label, base → head ratios, verdicts, and the markdown table.
import { FAMILIES } from '../src/families.js'

/**
 * The update-time gate is coarse on purpose: all three must hold, so noise on a
 * shared runner cannot fail it, but an update that re-renders a whole list can.
 */
export const UPDATE_GATE = { ratio: 2, floorMs: 5 }

const KEYS = ['heapPerInstKB', 'mountSyncUs', 'mountUs', 'updSyncMs', 'updMs', 'nodesPerInst', 'componentsPerInst', 'listenersPerInst', 'n']

function median(a) {
  const s = a.filter(Number.isFinite).sort((x, y) => x - y)
  if (!s.length)
    return null
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Per family: { [label]: { ok, errors, missing, med: {key: median}, heapSpread } } */
export function summarize(raw) {
  const out = {}
  for (const r of raw.runs) {
    const o = ((out[r.family] ??= {})[r.label] ??= { ok: 0, failed: 0, errors: [], missing: null, v: Object.fromEntries(KEYS.map(k => [k, []])) })
    if (r.missing) {
      o.missing = r.missing
      continue
    }
    if (r.error || !r.metrics) {
      o.failed++
      o.errors.push(r.error ?? 'no metrics')
      continue
    }
    if (r.errors?.length)
      o.errors.push(r.errors[0])
    o.ok++
    for (const k of KEYS) o.v[k].push(r.metrics[k])
  }
  for (const labels of Object.values(out)) {
    for (const o of Object.values(labels)) {
      o.med = Object.fromEntries(KEYS.map(k => [k, median(o.v[k])]))
      const h = o.v.heapPerInstKB.filter(Number.isFinite)
      o.heapMin = h.length ? Math.min(...h) : null
      o.heapMax = h.length ? Math.max(...h) : null
      o.heapSpread = h.length > 1 && o.med.heapPerInstKB ? (o.heapMax - o.heapMin) / o.med.heapPerInstKB : 0
      const u = o.v.updMs.filter(Number.isFinite)
      o.updMin = u.length ? Math.min(...u) : null
      o.updMax = u.length ? Math.max(...u) : null
      o.errors = [...new Set(o.errors)]
      delete o.v
    }
  }
  return out
}

/**
 * Heap is the gate: it is deterministic (run-to-run spread is well under 1%).
 * A family regresses when head/base > 1 + threshold AND head − base > floor KB/inst;
 * the floor keeps tiny families (a few KB/inst) from failing on a single extra object.
 * It must also be clear of the noise: every head sample above every base sample. A few
 * families with live timers (Toast) vary by ~1% between runs, more on a loaded machine.
 * Mount times are reported, never gated: shared CI runners are too noisy. Update time
 * is gated only when it clears the noise by far (`UPDATE_GATE`): head/base over the ratio,
 * head − base over the floor, and every head sample above every base sample.
 */
export function compare(summary, { base = 'base', head = 'head', threshold, floor }) {
  const rows = []
  for (const family of Object.keys(FAMILIES)) {
    const s = summary[family]
    if (!s)
      continue
    const b = s[base]
    const h = s[head]
    const row = { family, ref: !!FAMILIES[family].ref, base: b, head: h }
    const bh = b?.ok ? b.med.heapPerInstKB : null
    const hh = h?.ok ? h.med.heapPerInstKB : null
    row.heapRatio = bh && hh != null ? hh / bh : null
    row.heapDeltaKB = bh != null && hh != null ? hh - bh : null
    const ratio = k => (b?.ok && h?.ok && b.med[k] ? h.med[k] / b.med[k] : null)
    row.mountSyncRatio = ratio('mountSyncUs')
    row.mountRatio = ratio('mountUs')
    row.updRatio = ratio('updMs')
    // Any failed head sample (a thrown error or a timed-out end state) makes the family an error.
    if (!h?.ok || h.failed)
      row.verdict = h?.missing ? 'missing' : 'error'
    else if (!b?.ok)
      row.verdict = 'new'
    else if (row.heapRatio > 1 + threshold && row.heapDeltaKB > floor && h.heapMin > b.heapMax)
      row.verdict = 'regressed'
    else if (row.updRatio > UPDATE_GATE.ratio && h.med.updMs - b.med.updMs > UPDATE_GATE.floorMs && h.updMin > b.updMax)
      row.verdict = 'slower update'
    else if (row.heapRatio < 1 - threshold && -row.heapDeltaKB > floor && h.heapMax < b.heapMin)
      row.verdict = 'improved'
    else
      row.verdict = 'same'
    row.fail = row.verdict === 'regressed' || row.verdict === 'slower update' || (row.verdict === 'error' && !!b?.ok && !b.failed)
    rows.push(row)
  }
  return rows
}

const f = (x, d = 1) => (x == null ? '–' : x.toFixed(d))
const r2 = x => (x == null ? '–' : x.toFixed(2))
const VERDICT = { 'regressed': '**regressed**', 'slower update': '**slower update**', 'improved': 'improved', 'same': '', 'new': 'new (not in base)', 'missing': '**missing export**', 'error': '**error**' }

export function compareTable(rows, { base = 'base', head = 'head' } = {}) {
  const lines = [
    `| Family | N | Heap KB/inst ${base} → ${head} | Heap ratio | Mount µs/inst ${base} → ${head} | Mount ratio | To-paint ratio | Update ms ${base} → ${head} | Update ratio | Verdict |`,
    '|---|--:|--:|--:|--:|--:|--:|--:|--:|---|',
  ]
  const order = [...rows].sort((a, b) => (b.fail - a.fail) || (a.ref - b.ref))
  for (const r of order) {
    const b = r.base?.med ?? {}
    const h = r.head?.med ?? {}
    const notes = [VERDICT[r.verdict]]
    for (const [lab, o] of [[base, r.base], [head, r.head]]) {
      if (o?.errors?.length)
        notes.push(`${lab}: ${o.errors[0].slice(0, 80).replaceAll('|', '\\|')}`)
      if (o?.missing)
        notes.push(`${lab} lacks ${o.missing.join(', ')}`)
    }
    lines.push(`| ${r.ref ? `_${r.family}_ (ref)` : r.family} | ${h.n ?? b.n ?? ''} | ${f(b.heapPerInstKB, 2)} → ${f(h.heapPerInstKB, 2)} | ${r2(r.heapRatio)} | ${f(b.mountSyncUs)} → ${f(h.mountSyncUs)} | ${r2(r.mountSyncRatio)} | ${r2(r.mountRatio)} | ${f(b.updMs, 2)} → ${f(h.updMs, 2)} | ${r2(r.updRatio)} | ${notes.filter(Boolean).join('; ')} |`)
  }
  return lines.join('\n')
}

export function singleTable(summary, label = 'head') {
  const lines = [
    '| Family | N | Heap KB/inst | Mount µs/inst (sync) | Mount µs/inst (to paint) | Update ms | DOM nodes/inst | Components/inst | Notes |',
    '|---|--:|--:|--:|--:|--:|--:|--:|---|',
  ]
  for (const family of Object.keys(FAMILIES)) {
    const o = summary[family]?.[label]
    if (!o)
      continue
    const m = o.med
    const notes = [...(o.ok ? [] : ['**failed**']), ...(o.missing ? [`missing export ${o.missing.join(', ')}`] : []), ...o.errors.map(e => e.slice(0, 80).replaceAll('|', '\\|'))]
    lines.push(`| ${FAMILIES[family].ref ? `_${family}_ (ref)` : family} | ${m.n ?? ''} | ${f(m.heapPerInstKB, 2)} | ${f(m.mountSyncUs)} | ${f(m.mountUs)} | ${f(m.updMs, 2)} | ${f(m.nodesPerInst, 0)} | ${f(m.componentsPerInst, 0)} | ${notes.join('; ')} |`)
  }
  return lines.join('\n')
}
