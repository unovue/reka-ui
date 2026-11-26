// In-page driver. The Playwright runner (scripts/run.mjs) loads /<label>/ and calls
// window.__bench.run({ scenario, family, ... }); the measurements come back as plain JSON.
//
// scenario `mount` (every family): after an untimed warm-up, `rounds` times
//   mount N instances -> GC -> unmount -> GC, recording per round
//     mountMs        app.mount() + Vue's post-flush + style/layout, for all N instances
//     mountPaintMs   ... + two animation frames
//     heapKB         retained JS heap per instance: (GC'd heap after mount - before) / N
//     leakKB         what is still retained per instance after unmount (expected: ~0)
//     leakNodes      DOM nodes still alive per instance after unmount (expected: 0)
//     nodes / components / listeners per instance
//   then one more mount on which the family's interaction (`act`) runs on 10 instances:
//     actMs          interaction -> end state + style/layout ("open" for popups)
//     actPaintMs     ... + two animation frames
//     resetMs        undoing it ("close" for popups)
//
// scenario `collection` (families with a `collection` entry): ONE instance with `items` items
//     mountMs, heapKB (per item), openMs / openPaintMs (popups), keyMs (each of up to 50
//     presses of the navigation key), typeMs (one typeahead / filter character), selectMs
//   and, on a second mount with counters installed (untimed), per key press / typed
//   character / selection: component updates, component mounts, querySelectorAll calls.
import { fixtures, missing } from 'virtual:bench-fixtures'
import { createApp, h, nextTick, version } from 'vue'
import { $, $$, active, doubleRaf, key, layout, task, until } from './dom.js'
import { FAMILIES } from './families.js'

const heap = () => (window.__heap ? window.__heap() : Promise.resolve(null))
const now = () => performance.now()
const KB = 1024
const BUDGET_MS = 3000
const MIN_SAMPLES = 3
const TYPEAHEAD_RESET_MS = 1100

// Vue component instances in the vnode tree under `vnode`.
function countComponents(vnode) {
  let n = 0
  const stack = [vnode]
  while (stack.length) {
    const v = stack.pop()
    if (!v || typeof v !== 'object')
      continue
    if (v.component) {
      n++
      stack.push(v.component.subTree)
    }
    else if (v.suspense) {
      stack.push(v.suspense.activeBranch)
    }
    if (Array.isArray(v.children))
      stack.push(...v.children)
    else if (Array.isArray(v.dynamicChildren) && !v.component && !v.children)
      stack.push(...v.dynamicChildren)
  }
  return n
}
function changed(inst) {
  const before = inst.innerHTML
  return () => inst.innerHTML !== before
}

// The returned handle is the only reference to the app and its elements. `unmount` clears it, so
// nothing of the driver's keeps the unmounted tree alive when the heap is read afterwards.
async function mount(family, props, setup) {
  const host = $('#app')
  const m = { app: createApp({ render: () => h(fixtures[family], props) }) }
  setup?.(m.app)
  const t0 = now()
  m.app.mount(host)
  await nextTick()
  layout()
  const t1 = now()
  await doubleRaf()
  const t2 = now()
  m.insts = $$('.ci', host)
  if (m.insts.length !== (props.n ?? 1))
    throw new Error(`expected ${props.n ?? 1} instances, found ${m.insts.length}`)
  m.mountMs = t1 - t0
  m.mountPaintMs = t2 - t0
  return m
}
async function unmount(m) {
  m.app.unmount()
  m.app = null
  m.insts = null
  await nextTick()
  await doubleRaf()
}

// --- scenario: mount ------------------------------------------------------------------------

async function round(family, n) {
  const h0 = await heap()
  const m = await mount(family, { n })
  const h1 = await heap()
  const components = (countComponents(m.app._container._vnode) - 1) / n
  await unmount(m)
  const h2 = await heap()
  return {
    mountMs: m.mountMs,
    mountPaintMs: m.mountPaintMs,
    components,
    ...(h0 && {
      heapKB: (h1.jsHeapUsed - h0.jsHeapUsed) / n / KB,
      leakKB: (h2.jsHeapUsed - h0.jsHeapUsed) / n / KB,
      // the .ci wrapper element is not the family's
      nodes: (h1.nodes - h0.nodes) / n - 1,
      listeners: (h1.listeners - h0.listeners) / n,
      leakNodes: (h2.nodes - h0.nodes) / n,
    }),
  }
}

async function interact(family, n, times) {
  const spec = FAMILIES[family]
  const m = await mount(family, { n })
  const out = { actMs: [], actPaintMs: [], resetMs: [] }
  for (let k = 0; k < times; k++) {
    const inst = m.insts[Math.floor((k + 0.5) * m.insts.length / times)]
    const done = spec.done ? () => spec.done(inst) : changed(inst)
    const a = now()
    await spec.act(inst)
    await until(done, `${family} interaction #${k}`)
    layout()
    const b = now()
    await doubleRaf()
    out.actMs.push(b - a)
    out.actPaintMs.push(now() - a)
    if (spec.reset) {
      const c = now()
      await spec.reset(inst)
      layout()
      out.resetMs.push(now() - c)
    }
    await doubleRaf()
  }
  await unmount(m)
  return out
}

async function mountScenario(family, { rounds = 5, n = FAMILIES[family].n }) {
  const spec = FAMILIES[family]
  await round(family, Math.min(n, 30))
  if (spec.act)
    await interact(family, Math.min(n, 30), 2)
  const out = { n, rounds: [] }
  for (let r = 0; r < rounds; r++)
    out.rounds.push(await round(family, n))
  if (spec.act)
    Object.assign(out, await interact(family, n, 10))
  return out
}

// --- scenario: collection -------------------------------------------------------------------

// Counters for the untimed pass. Component updates and mounts come from a global mixin (it
// changes mount cost, so it is never installed in a timed pass); querySelectorAll calls from
// a patched prototype (the driver's own queries use the originals, see dom.js).
function installCounters(app) {
  const c = { updates: {}, mounts: 0, qsa: 0 }
  app.mixin({
    beforeMount() {
      c.mounts++
    },
    beforeUpdate() {
      const name = this.$options.__name ?? this.$options.name ?? 'Anonymous'
      c.updates[name] = (c.updates[name] ?? 0) + 1
    },
  })
  const restore = [Element.prototype, Document.prototype].map((proto) => {
    const original = proto.querySelectorAll
    proto.querySelectorAll = function (...args) {
      c.qsa++
      return original.apply(this, args)
    }
    return () => (proto.querySelectorAll = original)
  })
  return {
    // counts since the last call, divided by `per`
    take(per = 1) {
      const updates = Object.values(c.updates).reduce((a, b) => a + b, 0)
      const top = Object.fromEntries(Object.entries(c.updates).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, v / per]))
      const out = { updates: updates / per, mounts: c.mounts / per, qsa: c.qsa / per, top }
      c.updates = {}
      c.mounts = 0
      c.qsa = 0
      return out
    },
    restore: () => restore.forEach(fn => fn()),
  }
}

async function flow(family, items, { presses, types, count = false }) {
  const spec = FAMILIES[family].collection
  let counters
  const h0 = count ? null : await heap()
  const m = await mount(family, { n: 1, items }, count ? app => (counters = installCounters(app)) : undefined)
  const root = m.insts[0]
  const out = { mountMs: m.mountMs, keyMs: [], typeMs: [] }
  const counts = {}
  try {
    if (h0)
      out.heapKB = ((await heap()).jsHeapUsed - h0.jsHeapUsed) / items / KB
    counters?.take()

    if (spec.open) {
      const a = now()
      await spec.open(root)
      await until(() => spec.opened(root), `${family} open`)
      layout()
      out.openMs = now() - a
      await doubleRaf()
      out.openPaintMs = now() - a
      if (h0)
        out.heapOpenKB = ((await heap()).jsHeapUsed - h0.jsHeapUsed) / items / KB
    }
    // let focus management that runs after open settle
    await doubleRaf()
    await task()
    await spec.focus(root)
    await doubleRaf()
    counters?.take()

    // `presses` key presses, cut short (never below MIN_SAMPLES) once they have taken BUDGET_MS:
    // a list that needs 300 ms per key has made its point after a few.
    const navStart = now()
    for (let p = 0; p < presses && (p < MIN_SAMPLES || now() - navStart < BUDGET_MS); p++) {
      const before = spec.marker(root)
      const a = now()
      key(active(), spec.navKey)
      await until(() => spec.marker(root) !== before, `${family} ${spec.navKey} #${p}`)
      layout()
      out.keyMs.push(now() - a)
    }
    if (counters)
      counts.key = counters.take(out.keyMs.length)

    if (spec.type) {
      // typeahead buffers reset after a second without a key: start from an empty one
      await new Promise(r => setTimeout(r, TYPEAHEAD_RESET_MS))
      const typeStart = now()
      for (let t = 0; t < types && (t < 1 || now() - typeStart < BUDGET_MS); t++) {
        const before = { marker: spec.marker(root), options: $$('[role="option"]').length }
        const a = now()
        await spec.type(root, 'k')
        await until(() => (spec.typed ? spec.typed(root, 'k', before) : spec.marker(root) !== before.marker), `${family} type #${t}`)
        layout()
        out.typeMs.push(now() - a)
        if (counters && t === 0)
          counts.type = counters.take()
        if (spec.untype) {
          await spec.untype(root)
          await until(() => $$('[role="option"]').length === before.options, `${family} untype`)
        }
      }
      counters?.take()
    }

    // an item away from the current highlight, so the selection also moves it
    const k = Math.floor(items / 2) + 1
    const a = now()
    await spec.select(root, k)
    await until(() => spec.selected(root, k), `${family} select`)
    layout()
    out.selectMs = now() - a
    if (counters)
      counts.select = counters.take()
    await doubleRaf()
  }
  finally {
    counters?.restore()
    await unmount(m)
  }
  return count ? counts : out
}

async function collectionScenario(family, { items }) {
  await flow(family, 30, { presses: 3, types: 1 })
  const out = await flow(family, items, { presses: 50, types: 5 })
  out.counts = await flow(family, items, { presses: MIN_SAMPLES, types: 1, count: true })
  return out
}

async function run({ scenario, family, ...opts }) {
  if (!FAMILIES[family])
    throw new Error(`unknown family ${family}`)
  if (missing[family])
    return { missing: missing[family] }
  return scenario === 'collection' ? collectionScenario(family, opts) : mountScenario(family, opts)
}

window.__bench = { run, vue: version, missing }
window.__ready = true
