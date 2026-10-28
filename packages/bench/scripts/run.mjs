// Playwright runner: serves <root>/<label>/ and drives each family's page in Chromium.
// Every sample is a fresh browser context (= a fresh renderer and heap). Labels are
// interleaved within each family block, and the order alternates between runs, so slow
// drift on the machine hits every label equally.
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { cpus, loadavg } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

function serve(root) {
  const dir = resolve(root)
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (p.endsWith('/'))
      p += 'index.html'
    const file = join(dir, p)
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
  })
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)))
}

// Optional: wait (3 min steps, 30 min max) while the 1-min load average is above ncpu/2.
async function gate(log) {
  const half = cpus().length / 2
  for (let waited = 0; loadavg()[0] > half && waited < 30; waited += 3) {
    log(`load ${loadavg()[0].toFixed(1)} > ${half}, waiting 3 min`)
    await new Promise(r => setTimeout(r, 180_000))
  }
}

/**
 * @param {object} o
 * @param {string} o.root         directory holding the page builds, one per label
 * @param {string[]} o.labels    labels to compare (built with buildPage into root)
 * @param {string[]} o.families
 * @param {number} o.runs        measured samples per label and family
 * @param {number} o.warmup      discarded page-level samples per label and family
 * @param {number} [o.concurrency]  family blocks run in parallel (1 = sequential, the quietest timings)
 * @param {boolean} [o.gate]
 * @param {(msg: string) => void} o.log
 */
export async function runBench({ root, labels, families, runs, warmup, concurrency = 1, gate: useGate = false, log }) {
  const server = await serve(root)
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({
    headless: true,
    // Uncapped frames: without these every rAF wait costs ~16.7 ms and drowns the component work.
    args: ['--disable-frame-rate-limit', '--disable-gpu-vsync', '--run-all-compositor-stages-before-draw', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
  })

  async function once(label, family) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', (m) => {
      if (m.type() === 'error')
        errors.push(m.text())
    })
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Performance.enable')
    await page.exposeFunction('__heap', async () => {
      await cdp.send('HeapProfiler.collectGarbage')
      await cdp.send('HeapProfiler.collectGarbage')
      const { metrics } = await cdp.send('Performance.getMetrics')
      const dom = await cdp.send('Memory.getDOMCounters')
      return { jsHeapUsed: metrics.find(x => x.name === 'JSHeapUsedSize')?.value, nodes: dom.nodes, listeners: dom.jsEventListeners }
    })
    let result
    try {
      await page.goto(`${base}/${label}/?f=${family}`)
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 })
      result = await page.evaluate(() => window.__bench.run())
    }
    catch (e) {
      result = { error: String(e).split('\n')[0] }
    }
    result.errors = errors
    await ctx.close()
    return result
  }

  const raw = { chromium: browser.version(), labels, runs: [] }
  log(`chromium ${raw.chromium}; ${families.length} families × ${labels.length} build(s) × ${runs} run(s) (+${warmup} warm-up), ${concurrency} at a time`)
  let next = 0
  let finished = 0
  // Each worker takes whole family blocks, so both builds of a family always run back to back.
  // Heap is per page (each context is its own renderer), so concurrency only adds timing noise.
  async function worker() {
    while (next < families.length) {
      const family = families[next++]
      if (useGate)
        await gate(log)
      const t0 = Date.now()
      for (let i = 0; i < warmup; i++) {
        for (const l of labels)
          await once(l, family)
      }
      for (let i = 0; i < runs; i++) {
        const order = i % 2 ? [...labels].reverse() : labels
        for (const label of order) {
          const r = await once(label, family)
          raw.runs.push({ family, label, i, ...r })
          if (r.error || r.errors.length)
            log(`  ${family} ${label} #${i}: ${r.error ?? ''} ${r.errors.slice(0, 2).join(' | ')}`)
        }
      }
      log(`[${++finished}/${families.length}] ${family} ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    }
  }
  try {
    await Promise.all(Array.from({ length: concurrency }, worker))
  }
  finally {
    await browser.close()
    server.close()
  }
  return raw
}
