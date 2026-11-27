// Sample statistics and the per-metric summary stored in a results file.
const round = (x, d = 4) => Number(x.toFixed(d))

export function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function stats(samples) {
  const xs = samples.filter(x => typeof x === 'number' && Number.isFinite(x))
  if (!xs.length)
    return null
  const sorted = [...xs].sort((a, b) => a - b)
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const variance = xs.length > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1) : 0
  return {
    n: xs.length,
    median: round(quantile(sorted, 0.5)),
    p95: round(quantile(sorted, 0.95)),
    stddev: round(Math.sqrt(variance)),
    mean: round(mean),
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
    samples: xs.map(x => round(x, 3)),
  }
}

const MOUNT_ROUND = ['mountMs', 'mountPaintMs', 'heapKB', 'leakKB', 'leakNodes', 'nodes', 'components', 'listeners']
const MOUNT_ACT = ['actMs', 'actPaintMs', 'resetMs']
const COLLECTION_ONE = ['mountMs', 'heapKB', 'heapOpenKB', 'openMs', 'openPaintMs', 'selectMs']
const COLLECTION_MANY = ['keyMs', 'typeMs']

function compact(metrics) {
  return Object.fromEntries(Object.entries(metrics).filter(([, v]) => v))
}

// raw: [{ scenario, family, items?, run, load, result }] -> { mount, collection, missing, errors }
export function summarize(raw) {
  const out = { mount: {}, collection: {}, missing: {}, errors: [] }
  const groups = Object.groupBy(raw, r => (r.scenario === 'collection' ? `collection:${r.family}@${r.items}` : `mount:${r.family}`))
  for (const [id, runs] of Object.entries(groups)) {
    const { scenario, family, items } = runs[0]
    for (const r of runs) {
      if (r.result.error || r.result.errors?.length)
        out.errors.push({ id, run: r.run, error: r.result.error, console: r.result.errors })
    }
    const ok = runs.map(r => r.result).filter(r => !r.error && !r.missing)
    if (runs.some(r => r.result.missing)) {
      out.missing[family] = runs.find(r => r.result.missing).result.missing
      continue
    }
    if (!ok.length)
      continue
    const load = Math.max(...runs.map(r => r.load))
    if (scenario === 'mount') {
      const rounds = ok.flatMap(r => r.rounds)
      out.mount[family] = {
        n: ok[0].n,
        load,
        metrics: compact({
          ...Object.fromEntries(MOUNT_ROUND.map(m => [m, stats(rounds.map(r => r[m]))])),
          ...Object.fromEntries(MOUNT_ACT.map(m => [m, stats(ok.flatMap(r => r[m] ?? []))])),
        }),
      }
    }
    else {
      out.collection[`${family}@${items}`] = {
        family,
        items,
        load,
        metrics: compact({
          ...Object.fromEntries(COLLECTION_ONE.map(m => [m, stats(ok.map(r => r[m]))])),
          ...Object.fromEntries(COLLECTION_MANY.map(m => [m, stats(ok.flatMap(r => r[m] ?? []))])),
        }),
        // deterministic: the first run's counts
        counts: ok[0].counts,
      }
    }
  }
  return out
}
