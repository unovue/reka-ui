// In-page driver. The page is loaded as /<label>/?f=<Family>[&n=<instances>]; the
// Playwright runner (scripts/run.mjs) calls window.__bench.run() and gets the metrics back.
//
// One run = an untimed warm-up (min(n, 50) instances + 2 updates, then unmount), then the
// measured pass:
//   heap per instance: GC'd JSHeapUsed after mount minus before mount, divided by n
//   mountSync:         app.mount() alone, per instance
//   mount:             app.mount() + nextTick + double rAF (to paint), per instance
//   DOM nodes / components / listeners per instance
//   update:            one representative action on K instances spread over the list,
//                      timed until the expected DOM state + double rAF (median of K)
import { missingExports } from 'virtual:bench-imports'
import { createApp, h, nextTick, version } from 'vue'
import { $, $$, doubleRaf, FAMILIES, waitFor } from './families.js'

const fixtures = import.meta.glob('./fixtures/*.vue', { eager: true })
const heap = () => (window.__heap ? window.__heap() : Promise.resolve(null))
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]

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
function countNodes(root) {
  let all = 0
  let el = 0
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ALL)
  while (w.nextNode()) {
    all++
    if (w.currentNode.nodeType === 1)
      el++
  }
  return { all, el }
}
function changed(inst) {
  const before = inst.innerHTML
  return () => inst.innerHTML !== before
}

async function pass(family, n, m) {
  const spec = FAMILIES[family]
  const Comp = fixtures[`./fixtures/${family}.vue`].default
  const host = $('#app')
  const nodesBefore = countNodes(document.body)
  const heapBefore = await heap()
  const app = createApp({ render: () => h(Comp, { n }) })
  const t0 = performance.now()
  app.mount(host)
  const t1 = performance.now()
  await nextTick()
  await doubleRaf()
  const t2 = performance.now()
  const heapAfter = await heap()
  const nodesAfter = countNodes(document.body)
  const insts = $$('.ci', host)
  if (insts.length !== n)
    throw new Error(`expected ${n} instances, found ${insts.length}`)
  if (m) {
    m.n = n
    m.mountSyncUs = (t1 - t0) * 1000 / n
    m.mountUs = (t2 - t0) * 1000 / n
    if (heapBefore && heapAfter) {
      m.heapPerInstKB = (heapAfter.jsHeapUsed - heapBefore.jsHeapUsed) / n / 1024
      m.listenersPerInst = (heapAfter.listeners - heapBefore.listeners) / n
    }
    // all nodes added under <body> (incl. teleports), minus the .ci wrapper element
    m.nodesPerInst = (nodesAfter.all - nodesBefore.all) / n - 1
    m.elementsPerInst = (nodesAfter.el - nodesBefore.el) / n - 1
    m.componentsPerInst = (countComponents(app._container._vnode) - 1) / n
  }
  if (spec.act) {
    const K = m ? 10 : 2
    const sync = []
    const full = []
    for (let k = 0; k < K; k++) {
      const inst = insts[Math.floor((k + 0.5) * insts.length / K)]
      const done = spec.done ? () => spec.done(inst) : changed(inst)
      const a = performance.now()
      await spec.act(inst)
      await nextTick()
      const b = performance.now()
      await waitFor(done, `${family} update #${k}`)
      await doubleRaf()
      const d = performance.now()
      sync.push(b - a)
      full.push(d - a)
      if (spec.reset)
        await spec.reset(inst)
      await doubleRaf()
    }
    if (m) {
      m.updSyncMs = median(sync)
      m.updMs = median(full)
    }
  }
  app.unmount()
  await nextTick()
  await doubleRaf()
}

async function run() {
  const params = new URLSearchParams(location.search)
  const family = params.get('f')
  if (!FAMILIES[family] || !fixtures[`./fixtures/${family}.vue`])
    throw new Error(`unknown family ${family}`)
  // A fixture that uses an export this build of reka-ui doesn't have (e.g. a family added
  // by the PR, measured against the base) is reported as missing instead of mounting garbage.
  if (missingExports[family]?.length)
    return { missing: missingExports[family] }
  const n = Number(params.get('n') ?? FAMILIES[family].n)
  await pass(family, Math.min(n, 50), null)
  const metrics = {}
  await pass(family, n, metrics)
  return { metrics }
}

window.__bench = { run, families: Object.keys(FAMILIES), vue: version }
window.__ready = true
