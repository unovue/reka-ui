// Playwright runner: serves <root>/<label>/ and drives the page in Chromium.
// Every sample set is a fresh browser context (= a fresh renderer and heap).
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { loadavg } from 'node:os'
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

/**
 * @param {object} o
 * @param {string} o.root     directory holding the page build
 * @param {string} o.label    the page build to drive (built with buildPage into root)
 * @param {{ scenario: string, family: string, items?: number }[]} o.jobs
 * @param {number} o.runs     page loads per job
 * @param {number} o.rounds   mount rounds per page load (scenario `mount`)
 * @param {() => Promise<void>} [o.beforeJob]  e.g. wait for the machine to calm down
 * @param {(msg: string) => void} o.log
 */
export async function runBench({ root, label, jobs, runs, rounds, beforeJob, log }) {
  const server = await serve(root)
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--js-flags=--expose-gc',
      // Uncapped frames: without these every rAF wait costs ~16.7 ms and drowns the component work.
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--run-all-compositor-stages-before-draw',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
    ],
  })

  async function once(job) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e).split('\n')[0]))
    page.on('console', (m) => {
      if (m.type() === 'error')
        errors.push(m.text().split('\n')[0])
    })
    const cdp = await ctx.newCDPSession(page)
    // Retained heap after a forced, full GC, plus the renderer's live DOM node / listener counts.
    await page.exposeFunction('__heap', async () => {
      await cdp.send('HeapProfiler.collectGarbage')
      await cdp.send('HeapProfiler.collectGarbage')
      const { usedSize } = await cdp.send('Runtime.getHeapUsage')
      const dom = await cdp.send('Memory.getDOMCounters')
      return { jsHeapUsed: usedSize, nodes: dom.nodes, listeners: dom.jsEventListeners }
    })
    let result
    try {
      await page.goto(`${base}/${label}/`)
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 })
      result = await page.evaluate(opts => window.__bench.run(opts), { ...job, rounds })
    }
    catch (e) {
      result = { error: String(e).split('\n')[0] }
    }
    result.errors = [...new Set(errors)].slice(0, 5)
    await ctx.close()
    return result
  }

  const raw = { chromium: browser.version(), vue: null, runs: [] }
  try {
    const probe = await browser.newPage()
    await probe.goto(`${base}/${label}/`)
    await probe.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 })
    raw.vue = await probe.evaluate(() => window.__bench.vue)
    await probe.close()
    log(`chromium ${raw.chromium}, vue ${raw.vue}; ${jobs.length} job(s) × ${runs} run(s)`)
    let finished = 0
    for (const job of jobs) {
      await beforeJob?.()
      const t0 = Date.now()
      const id = `${job.family}${job.items ? `@${job.items}` : ''}`
      for (let run = 0; run < runs; run++) {
        const load = loadavg()[0]
        const result = await once(job)
        raw.runs.push({ ...job, run, load: Number(load.toFixed(2)), result })
        if (result.error || result.errors.length)
          log(`  ${job.scenario} ${id} #${run}: ${result.error ?? ''} ${result.errors.slice(0, 2).join(' | ')}`)
        if (result.missing)
          break
      }
      log(`[${++finished}/${jobs.length}] ${job.scenario} ${id} ${((Date.now() - t0) / 1000).toFixed(1)}s (load ${loadavg()[0].toFixed(2)})`)
    }
  }
  finally {
    await browser.close()
    server.close()
  }
  return raw
}
